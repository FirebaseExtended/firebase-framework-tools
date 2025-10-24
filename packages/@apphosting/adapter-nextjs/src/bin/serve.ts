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

// The standalone directory is the root of the Next.js application.
const dir = join(process.cwd(), process.argv[2] || ".next/standalone");
process.chdir(dir);

// Standard NodeJS HTTP server port and hostname.
const port = parseInt(process.env.PORT!, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

// Polyfill for the `self` global object, used by Next.js in minimal mode.
// @ts-ignore
globalThis.self = globalThis;
// Polyfill for the `AsyncLocalStorage` global object, used by Next.js in minimal mode.
globalThis.AsyncLocalStorage = AsyncLocalStorage;

// Required by Next.js in minimal mode.
// @ts-ignore
process.env.NODE_ENV = "production";

// Allow the keep-alive timeout to be configured.
let keepAliveTimeout: number | undefined = parseInt(process.env.KEEP_ALIVE_TIMEOUT!, 10);

// Load the Next.js configuration from the standalone directory.
const conf = JSON.parse(readFileSync(join(dir, ".next", "required-server-files.json"), "utf-8")).config;

// Pass the Next.js configuration to the Next.js server.
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(conf);

// Increase the max listeners to prevent warnings when many requests are in-flight.
process.setMaxListeners(1_000);

// Dynamically import the Next.js middleware.
const resolveMiddleware = import(join(dir, ".next/server/middleware.js"));

// TODO don't hardcode these matchers, they should be derived from the build output.
const matchers = [
  '/about/:path*',
  '/((?!_next|firebase|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  '/private/:path*',
].map(it => new RegExp(it));

// If the keep-alive timeout is not a valid number, use the default.
if (
  Number.isNaN(keepAliveTimeout) ||
  !Number.isFinite(keepAliveTimeout) ||
  keepAliveTimeout < 0
) {
  keepAliveTimeout = undefined
}

// Initialize the Next.js server in minimal mode.
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

/**
 * Injects App Hosting specific headers into the response.
 *
 * This is used to communicate the postponed state of a page to the App Hosting backend.
 * The backend will then use this information to resume the request when the page is
 * ready.
 *
 * @param req The incoming request.
 * @param res The server response.
 */
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

/**
 * Handles incoming HTTP requests.
 *
 * This function is the entry point for all HTTP requests. It is responsible for
 * proxying requests to the Next.js server and for handling PPR (Partial Prerendering)
 * requests.
 *
 * @param req The incoming request.
 * @param res The server response.
 */
async function requestHandle(req: IncomingMessage, res: ServerResponse) {
    // This is a temporary workaround to enable PPR for the home page.
    const isPPR = req.url === "/";
    if (isPPR) {
      /**
       * Next.js uses a request handler (`getRequestHandler`) which takes full
       * `ServerResponse` object and doesn't provide any lifecycle hook.
       *
       * To inject our `x-fah-postponed` header *before* Next.js sends the
       * first body chunk, we must monkey-patch `res.write` and `res.end`.
       * We wrap them in a promise (`resolveHeaders`) to ensure our
       * `injectAppHostingHeaders` function runs exactly once before any
       * data is sent to the client.
       */
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

/**
 * The gRPC server that handles Envoy's external processing requests.
 *
 * This server is responsible for handling all gRPC requests from Envoy. It is
 * used to implement middleware and to resume PPR requests.
 */
const grpcServer = fastify({ http2: true } as {});

await grpcServer.register(fastifyConnectPlugin, {
  routes: (router) => router.service(ExternalProcessor, {
    /**
     * The `process` function is the entry point for all gRPC requests.
     *
     * It is a bidirectional streaming RPC that allows the data plane to send
     * information about the HTTP request to the service and for the service to
     * send back a `ProcessingResponse` message that directs the data plane on
     * how to handle the request.
     * 
     * https://www.envoyproxy.io/docs/envoy/latest/api-v3/service/ext_proc/v3/external_processor.proto
     *
     * @param callouts The stream of `ProcessingRequest` messages from the data plane.
     */
    process: async function *processCallouts(callouts) {
      let requestHeaders: HeaderValue[] = [];
      let resolveResumeBuffer: Promise<PassThrough>|undefined;
      let path: string|undefined = undefined;
      // For whatever reason the header.value is always an empty string at least with
      // my local version of envoy. I have to decode the rawValue every time
      const getRequestHeader = (key: string) => {
        const header = requestHeaders.find((it) => it.key === key);
        if (header) return header.value || new TextDecoder().decode(header.rawValue);
        return undefined;
      }
      for await (const callout of callouts) {
        switch (callout.request.case) {
          case "requestHeaders": {
            requestHeaders = callout.request.value.headers?.headers || [];
            // TODO look at the callout attributes, can we send thing like path
            //      so we don't have to parse from the pseudo headers
            path = getRequestHeader(":path");
            /** 
             * `requestHeaders` is the first callout we get. If `endOfStream` is
             * true, it's a `GET` (or other body-less request), and we can run
             * the middleware logic immediately. When there is no body
             * `requestBody` would not otherwise be called.
             *
             * We do this by *intentionally falling through* to the `requestBody`
             * case below, which contains our unified middleware logic.
             *
             * If `endOfStream` is false (e.g., a `POST`), we `break` and wait
             * for the `requestBody` callout to arrive, which will then
             * execute the *same* logic block.
             */
            if (!callout.request.value.endOfStream) break;
          }
          case "requestBody": {
            // TODO make a converter to a fetch request, make a helper to extract these headers
            const method = getRequestHeader(":method")!;
            const scheme = getRequestHeader(":scheme")!;
            const referrer = getRequestHeader("referer");
            const authority = getRequestHeader(":authority")!;
  
            // If the path does not match any of the middleware matchers, we can
            // skip the middleware execution.
            if (!matchers.some(it => path?.match(it))) break;

            // Next.js middleware is intended for v8 isolates, with the fetch api.
            // We construct a Fetch API compliant request object to pass to the
            // middleware.
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
            // If the middleware returns a response with the `x-middleware-next`
            // header, it means we should continue processing the request as if
            // the middleware was not there.
            if (middlewareResponse.headers.has("x-middleware-next")) break;
            const middlewareResponseHeaders = Object.fromEntries(middlewareResponse.headers);
            delete middlewareResponseHeaders["x-middleware-next"]; // Clean up middleware-specific header, TODO clean up other headers

            // Convert the Fetch Headers object to the { key, value } array Envoy expects
            const setHeaders = Object.entries(middlewareResponseHeaders).map(([key, value]) => ({
              header: { key, rawValue: Uint8Array.from(Buffer.from(value)) },
            }));

            // If the middleware returns a response, we send it back to the client
            // and stop processing the request.
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
            // This is where we handle PPR resumption.
            // If the response has a `x-fah-postponed` header, it means the page
            // is in a postponed state and we need to resume it.
            const postponedToken = callout.request.value.headers?.headers.find((it) => it.key === "x-fah-postponed")?.rawValue;
            if (!postponedToken) break;
            // We tell Envoy to continue processing the request, but we also
            // modify the headers to indicate that the response is chunked and
            // to remove the `x-fah-postponed` and `content-length` headers.
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
            
            // We then kick off the resume request, so it's happening in parallel to the GET's
            // body being sent to the client. Buffer it up.
            resolveResumeBuffer = new Promise<PassThrough>(async (resolve) => {
              const socket = new Socket();
              const resumeRequest = new IncomingMessage(socket);
              const postponed = Buffer.from(new TextDecoder().decode(postponedToken), "base64url").toString();

              // We construct a new request to the Next.js server to resume the
              // postponed page.
              // This is the old way of doing PPR resumption, I'm having trouble with it in NextJS 16
              // TODO investigate a stable API or why this is bugging out on me
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
              
              /**
               * This is the core of the PPR streaming workaround. We cannot
               * directly `await` the `resumeResponse` as it's a "push-style"
               * classic Node.js stream, not a modern "pull-style" async iterable.
               *
               * To fix this, we create an `intermediaryStream` (a PassThrough)
               * and manually override `resumeResponse.write` and `resumeResponse.end`.
               *
               * This effectively "pipes" the data from the Next.js handler (which
               * *thinks* it's writing to a normal socket) into our intermediary
               * stream, which we *can* await in the `responseBody` case.
               * 
               * There's probably a "better" way of doing but the old school pipes
               * in NodeJS are rough. It might be better to start with the new
               * fetch style request/response and convert to InboundMessage / 
               * ServerResponse from those more modern APIs.
               */
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
            // Let the original GET request be fulfilled, since we're using NextJS minimal-mode
            // that request will be served in a CDN friendly manner, hopefully we have a hit ;)

            /**
             * -------------------- Full-Duplex Mode  ----------------------
             *
             * Because we're using `streamedResponse` later (for PPR), we've
             * configured Envoy for full-duplex streaming mode.
             *
             * In this mode, Envoy *always* expects us to send `streamedResponse`
             * mutations. If we just `yield` a simple `CONTINUE` (our fallback)
             * for a non-PPR request, Envoy's state machine gets confused
             * and it will segfault.
             *
             * Therefore, for *all* requests, we must replace the response
             * body with a stream, even if that stream is just the *original*
             * response body.
             *
             * TODO: look into switching mode dynamically using `mode_override`
             *       in `responseHeaders` to avoid this for non-PPR requests.
             *
             * This logic determines the "passthrough" end_stream state.
             * `end_stream` should *only* be true if:
             *   1. We are *not* doing a PPR resume (`!resolveResumeBuffer`)
             *   2. AND the original upstream chunk was the last one.
             * 
             * TODO name resolveResumeBuffer better
             */
            const end_stream = !resolveResumeBuffer && callout.request.value.endOfStream;

            // Serve up the original response, only EOF if this is not a PPR request and the
            // original chunk was EOF.
            const body = callout.request.value.body;
            yield {
              response: {
                case: "responseBody",
                value: {
                  response: {
                    status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                    // Note: We use 'streamedResponse' even for the pass-through.
                    bodyMutation: { mutation: { case: 'streamedResponse', value: { body, endOfStream: end_stream } } },
                    end_stream,
                  },
                },
              },
            };

            // If the original response wasn't EOF yet, continue serving chunks (which will call this
            // case again.
            if (!callout.request.value.endOfStream) continue;

            const resumeBuffer = await resolveResumeBuffer!;
            resolveResumeBuffer = undefined; // TODO do I need to do this?

            // Ok, let's start streaming in the PPR resume response
            // full duplex mode is what allows us to yield multiple times, so we can stream, this
            // is a marked improvement over the primitives available in proxy-Wasm at the moment.
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

            // Finally send EOF
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
          // TODO can we intercept trailers to handle waitFor functionality?
        }
        // If we fall through the switch, it means we are not handling the
        // request in any special way, so we just tell Envoy to continue.
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

// Create the main HTTP server.
createServer(requestHandle).listen(port, hostname, () => {
  console.log(`NextJS listening on http://${hostname}:${port}`);
}).on("error", (err) => {
  console.error(err);
  process.exit(1);
});

await grpcServer.ready();

// Start the gRPC server.
grpcServer.listen({ host: hostname, port: port+1 }, (err, address) => {
  if (err) return console.error(err);
  console.log(`RPC listening on ${address}`);
});