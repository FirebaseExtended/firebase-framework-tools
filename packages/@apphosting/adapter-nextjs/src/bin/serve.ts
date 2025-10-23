#! /usr/bin/env node
import { readFileSync } from "node:fs";
import { ServerResponse, IncomingMessage, createServer } from "node:http";
import { join } from "node:path";
import fastify from "fastify";
import { AsyncLocalStorage } from "node:async_hooks";
import { parse } from "node:url";

import { CommonResponse_ResponseStatus, ExternalProcessor } from "../protos/envoy/service/ext_proc/v3/external_processor_pb.js"
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";

import { HeaderValue } from "../protos/envoy/config/core/v3/base_pb.js";
import { Socket } from "node:net";
import { PassThrough } from "node:stream";

const dir = join(process.cwd(), process.argv[2] || ".next/standalone");

const port = parseInt(process.env.PORT!, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

// @ts-ignore
globalThis.self = globalThis;
globalThis.AsyncLocalStorage = AsyncLocalStorage;

// @ts-ignore
process.env.NODE_ENV = "production";

let keepAliveTimeout: number | undefined = parseInt(process.env.KEEP_ALIVE_TIMEOUT!, 10);

const conf = JSON.parse(readFileSync(join(dir, ".next", "required-server-files.json"), "utf-8")).config;

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(conf);

process.setMaxListeners(1_000);

const resolveMiddleware = import(join(dir, ".next/server/middleware.js"));

// TODO don't hardcode
const matchers = [
  '/about/:path*',
  '/((?!_next|firebase|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  '/private/:path*',
].map(it => new RegExp(it));

if (
  Number.isNaN(keepAliveTimeout) ||
  !Number.isFinite(keepAliveTimeout) ||
  keepAliveTimeout < 0
) {
  keepAliveTimeout = undefined
}

const resolveNextServer = import(join(dir, "node_modules/next/dist/server/next-server.js")).then(async ({ default: NextServer }) => {
  const server = new NextServer.default({
    conf,
    dev: false,
    dir,
    hostname, 
    port,
    minimalMode: true,
  });
  await server.prepare();
  return server;
});

async function injectAppHostingHeaders(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return;
  if (!res.getHeaderNames().includes('x-nextjs-postponed')) return;
  // TODO memoize/import this symbol outside the function
  // TODO import the type from NextJS
  const { NEXT_REQUEST_META } = await import(join(dir, "node_modules/next/dist/server/request-meta.js"));
  const metadata = (req as any)[NEXT_REQUEST_META];
  // TODO use a stable API to get the reumption token
  const cacheEntry = await metadata.incrementalCache.get(metadata.match.definition.pathname, { kind: metadata.match.definition.kind, isRoutePPREnabled: true });
  res.appendHeader('x-fah-postponed', Buffer.from(cacheEntry.value.postponed).toString('base64url'));
}

async function requestHandle(req: IncomingMessage, res: ServerResponse) {
    const isPPR = req.url === "/";
    if (isPPR) {
      const originalWrite = res.write.bind(res);
      let resolveHeaders: Promise<void> | undefined;
      // We need to append our headers before the body starts getting written
      res.write = function () {
        resolveHeaders ||= injectAppHostingHeaders(req, res);
        resolveHeaders.then(() => {
          // @ts-expect-error TODO fix the type
          const written = originalWrite(...arguments);
          if (written) res.emit("drain");
        })
        return false;
      };
      const originalEnd = res.end.bind(res);
      res.end = function () {
        resolveHeaders ||= injectAppHostingHeaders(req, res);
        resolveHeaders.then(() => {
          originalEnd(...arguments);
        });
        return res;
      };
    }
    const parsedUrl = parse(req.url!, true);
    const nextServer = await resolveNextServer;
    return nextServer.getRequestHandler()(req, res, parsedUrl);
};


const grpcServer = fastify({ http2: true } as {});

await grpcServer.register(fastifyConnectPlugin, {
  routes: (router) => router.service(ExternalProcessor, {
    process: async function *processCallouts(callouts) {
      let requestHeaders: HeaderValue[] = [];
      let resolveResumeBuffer: Promise<PassThrough>|undefined;
      let path: string|undefined = undefined;
      const getRequestHeader = (key: string) => {
        const header = requestHeaders.find((it) => it.key === key);
        if (header) return header.value || new TextDecoder().decode(header.rawValue);
        return undefined;
      }
      for await (const callout of callouts) {
        switch (callout.request.case) {
          case "requestHeaders": {
            requestHeaders = callout.request.value.headers?.headers || [];
            path = getRequestHeader(":path");
            if (!callout.request.value.endOfStream) break;
          }
          case "requestBody": {
            // TODO make a converter to a fetch request, make a helper to extract these headers
            const method = getRequestHeader(":method")!;
            const scheme = getRequestHeader(":scheme")!;
            const referrer = getRequestHeader("referer");
            const authority = getRequestHeader(":authority")!;
            if (!matchers.some(it => path?.match(it))) break;
            // middleware is intended for v8 isolates, with the fetch api
            const middlewareRequest = {
                url: `${scheme}://${authority}${path}`,
                method,
                // filter out http2 pseudo-headers, next chokes on these
                headers: Object.fromEntries(requestHeaders.filter((it) => !it.key.startsWith(":")).map((it) => [it.key, it.value || new TextDecoder().decode(it.rawValue)]) || []),
                // keepalive: req.keepalive,
                destination: 'document',
                credentials: 'same-origin',
                bodyUsed: false,
                // @ts-ignore
                body: callout.request.case === "requestBody" ? callout.request.value.body : undefined,
                mode: "navigate",
                redirect: "follow",
                referrer,
            };
            const middleware = await resolveMiddleware;
            let middlewareResponse: Response;
            try {
              const result = await middleware.default.default({ request: middlewareRequest });
              await result.waitUntil;
              middlewareResponse = result.response;
            } catch (err) {
              console.error("Middleware execution failed:", err);
              yield {
                response: {
                  case: "immediateResponse",
                  value: {
                    status: { code: 500 },
                    body: Uint8Array.from(Buffer.from("Internal Server Error")),
                  },
                },
              };
              continue;
            }
            if (middlewareResponse.headers.has("x-middleware-next")) break;
            const middlewareResponseHeaders = Object.fromEntries(middlewareResponse.headers);
            delete middlewareResponseHeaders["x-middleware-next"]; // Clean up middleware-specific header, TODO clean up other headers

            // Convert the Fetch Headers object to the { key, value } array Envoy expects
            const setHeaders = Object.entries(middlewareResponseHeaders).map(([key, value]) => ({
              header: { key, rawValue: Uint8Array.from(Buffer.from(value)) },
            }));

            yield {
              response: {
                case: "immediateResponse",
                value: {
                  status: { code: middlewareResponse.status },
                  headers: {
                    setHeaders
                  },
                  body: Uint8Array.from(Buffer.from(await middlewareResponse.text())),
                },
              }
            }
            continue;
          }
          case "responseHeaders": {
            const postponedToken = callout.request.value.headers?.headers.find((it) => it.key === "x-fah-postponed")?.rawValue;
            if (!postponedToken) break;
            yield {
              response: {
                case: "responseHeaders",
                value: {
                  response: {
                    status: CommonResponse_ResponseStatus.CONTINUE,
                    headerMutation: {
                      setHeaders: [
                        { header: { key: "transfer-encoding", rawValue: Uint8Array.from(Buffer.from("chunked")) } },
                      ],
                      removeHeaders: ["x-fah-postponed", "content-length"],
                    },
                  },
                },
              },
            }
            
            resolveResumeBuffer = new Promise<PassThrough>(async (resolve) => {
              const socket = new Socket();
              const resumeRequest = new IncomingMessage(socket);
              const postponed = Buffer.from(new TextDecoder().decode(postponedToken), "base64url").toString();

              const resumePath = `/_next/postponed/resume${path === "/" ? "/index" : path}`;
              resumeRequest.url = resumePath;
              resumeRequest.method = "POST";
              resumeRequest.httpVersion = "1.1";
              resumeRequest.httpVersionMajor = 1;
              resumeRequest.httpVersionMinor = 1;
              resumeRequest.push(postponed.trim());
              resumeRequest.push(null);

              for (const header of requestHeaders) {
                // drop HTTP2 pseudo headers
                if (header.key.startsWith(":")) continue;
                resumeRequest.headers[header.key] = getRequestHeader(header.key);
              }
              resumeRequest.headers['x-matched-path'] = resumePath;
              resumeRequest.headers['next-resume'] = "1";
              
              const resumeResponse = new ServerResponse(resumeRequest);
              const intermediaryStream = new PassThrough();
              
              resumeResponse.write = (data) => {
                const result = intermediaryStream.push(data);
                if (!result) intermediaryStream.on("drain", () => resumeResponse.emit("drain"));
                return result;
              };

              resumeResponse.end = (data) => {
                if (data) intermediaryStream.push(data);
                intermediaryStream.end();
                return resumeResponse;
              }
            
              const nextServer = await resolveNextServer;
              const parsedUrl = parse(resumePath, true);
              nextServer.getRequestHandler()(resumeRequest, resumeResponse, parsedUrl);
              resolve(intermediaryStream);
            }).catch((e) => {
              console.error(e);
              // TODO figure out how to tell react we crashed and need to client render
              const intermediaryStream = new PassThrough();
              return intermediaryStream;
            });
            
            continue;
          }
          case "responseBody": {
            //if (!resolveResumeBuffer) break;
            const end_stream = !resolveResumeBuffer && callout.request.value.endOfStream;

            // OK now that we're duplex streaming, we need to replace everythign with a stream
            // TODO look into switching mode for PPR
            const body = callout.request.value.body;
            yield {
              response: {
                case: "responseBody",
                value: {
                  response: {
                    status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                    bodyMutation: { mutation: { case: 'streamedResponse', value: { body, endOfStream: end_stream } } },
                    end_stream,
                  },
                },
              },
            };

            if (!callout.request.value.endOfStream) continue;

            const resumeBuffer = await resolveResumeBuffer!;
            resolveResumeBuffer = undefined;

            for await (const body of resumeBuffer) {
              yield {
                response: {
                  case: "responseBody",
                  value: {
                    response: {
                      status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                      bodyMutation: { mutation: { case: 'streamedResponse', value: { body, endOfStream: false } } },
                      end_stream: false,
                    },
                  },
                },
              };
            }

            yield {
              response: {
                case: "responseBody",
                value: {
                  response: {
                    status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                    bodyMutation: { mutation: { case: 'streamedResponse', value: { body: Buffer.alloc(0), endOfStream: true } } },
                    end_stream: true,
                  },
                },
              },
            };
            continue;
          }
        }
        const empty = {};
        yield { 
          response: {
            case: callout.request.case,
            value: {
              response: {
                status: CommonResponse_ResponseStatus.CONTINUE,
              }
            }
          }
        } as (typeof empty);
      }
    }
  }),
});


createServer(requestHandle).listen(port, hostname, () => {
  console.log(`NextJS listening on http://${hostname}:${port}`);
}).on("error", (err) => {
  console.error(err);
  process.exit(1);
});

await grpcServer.ready();

grpcServer.listen({ host: hostname, port: port+1 }, (err, address) => {
  if (err) return console.error(err);
  console.log(`RPC listening on ${address}`);
});
