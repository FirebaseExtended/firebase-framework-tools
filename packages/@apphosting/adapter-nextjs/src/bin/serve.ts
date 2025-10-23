#! /usr/bin/env node
import { readFileSync } from "node:fs";
import { ServerResponse, IncomingMessage } from "node:http";
import { join } from "node:path";
import fastify from "fastify";
import { AsyncLocalStorage } from "node:async_hooks";
import { parse } from "node:url";

import { CommonResponse_ResponseStatus, ExternalProcessor } from "../protos/envoy/service/ext_proc/v3/external_processor_pb.js"
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";

import type { Http2ServerRequest, Http2ServerResponse } from "node:http2";
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

const USING_CALLOUTS = !!process.env.FAH_USING_CALLOUTS;
const SERVE_H2C = !!process.env.FAH_SERVE_H2C;
const commonFastifyOptions = { }; 
const httpServer = fastify({ http2: SERVE_H2C, ...commonFastifyOptions } as {});

if (USING_CALLOUTS) {

  const grpcServer = fastify({ http2: true, ...commonFastifyOptions } as {});
  
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

  await grpcServer.ready();

  grpcServer.listen({ host: hostname, port: port+1 }, (err, address) => {
    if (err) return console.error(err);
    console.log(`RPC listening on ${address}`);
  });

}

if (SERVE_H2C) {

  /**
   * Creates a mock http.IncomingMessage from an http2.Http2ServerRequest.
   * * @param {Http2ServerRequest} h2req - The real HTTP/2 request.
   * @returns {IncomingMessage} - The mock HTTP/1 request.
   */
  function createMockIncomingMessage(h2req: Http2ServerRequest): IncomingMessage {
    // 1. Create a real IncomingMessage to get the correct prototype
    // @ts-expect-error
    const socket = h2req.stream.session.socket as Socket;
    const mockReq = new IncomingMessage(socket);

    // 2. Map HTTP/2 properties to their HTTP/1 equivalents
    //    (Http2ServerRequest already has these, but we are making a *new* object)
    mockReq.method = h2req.method;
    mockReq.url = h2req.url;
    mockReq.headers = h2req.headers;
    mockReq.rawHeaders = h2req.rawHeaders;
    mockReq.httpVersion = '2.0';
    mockReq.httpVersionMajor = 2;
    mockReq.httpVersionMinor = 0;

    // 3. Map other common properties
    mockReq.aborted = h2req.aborted;
    mockReq.complete = h2req.complete;
    // @ts-expect-error
    mockReq.trailers = h2req.trailers;
    
    // 4. Proxy the data stream events from the H2 request to the H1 mock
    h2req.on('data', (chunk: Buffer | string) => mockReq.emit('data', chunk));
    h2req.on('end', () => mockReq.emit('end'));
    h2req.on('error', (err: Error) => mockReq.emit('error', err));
    h2req.on('close', () => mockReq.emit('close'));

    // 5. Proxy stream methods
    // @ts-expect-error
    mockReq.pause = () => h2req.pause();
    // @ts-expect-error
    mockReq.resume = () => h2req.resume();
    mockReq.isPaused = () => h2req.isPaused();
    // @ts-expect-error
    mockReq.destroy = (err?: Error) => h2req.destroy(err);
    // @ts-expect-error
    mockReq.setTimeout = (msecs: number, cb?: () => void) => h2req.setTimeout(msecs, cb);

    return mockReq;
  }

  /**
   * Creates a mock http.ServerResponse from an http2.Http2ServerResponse.
   * * @param {Http2ServerRequest} h2req - The real H2 request (needed for context).
   * @param {Http2ServerResponse} h2res - The real H2 response.
   * @returns {ServerResponse} - The mock HTTP/1 response.
   */
  function createMockServerResponse(
    h2req: Http2ServerRequest,
    h2res: Http2ServerResponse
  ): ServerResponse {
    
    // 1. Create a real ServerResponse to get the correct prototype.
    const mockReq = { method: h2req.method, url: h2req.url } as IncomingMessage;
    const mockRes = new ServerResponse(mockReq);

    // 2. Set the underlying socket
    // @ts-expect-error
    mockRes.socket = h2res.stream.session.socket as Socket;
    // @ts-expect-error
    mockRes.connection = mockRes.socket;

    // 3. Override the core I/O methods

    mockRes.writeHead = (
      statusCode: number,
      statusMessage?: string | Record<string, any>,
      headers?: Record<string, any>
    ): ServerResponse => {
      if (mockRes.headersSent) return mockRes;

      let finalHeaders: Record<string, any> = {};
      
      // Handle (statusCode, headers) signature
      if (typeof statusMessage === 'object') {
        headers = statusMessage;
        // statusMessage is not used in H2
      }

      // Combine headers set via setHeader() with explicit headers
      const existingHeaders = mockRes.getHeaders();
      finalHeaders = { ...existingHeaders, ...headers };

      // 1. Call the real H2 response
      h2res.writeHead(statusCode, finalHeaders);
      
      // 2. --- THE FIX ---
      // Manually set the internal property that 'headersSent' getter uses.
      // This is "private" but necessary for shims.
      (mockRes as any)._headerSent = true;
      
      // 3. Also set the public statusCode so it's correct
      mockRes.statusCode = statusCode;
      return mockRes; // Return self for chaining
    };

    mockRes.write = (
      chunk: any,
      encoding?: BufferEncoding | ((error?: Error | null) => void),
      callback?: (error?: Error | null) => void
    ): boolean => {
      if (!mockRes.headersSent) {
        mockRes.writeHead(mockRes.statusCode || 200);
      }
      
      // Handle overloads
      let cb = callback;
      let enc: BufferEncoding = 'utf8';
      if (typeof encoding === 'function') {
        cb = encoding;
      } else if (typeof encoding === 'string') {
        enc = encoding;
      }
      
      return h2res.write(chunk, enc, cb);
    };

    mockRes.end = (
      chunk?: any,
      encoding?: BufferEncoding | (() => void),
      callback?: () => void
    ): ServerResponse => {
      if (!mockRes.headersSent) {
        mockRes.writeHead(mockRes.statusCode || 200);
      }
      
      // Handle overloads
      let cb = callback;
      let enc: BufferEncoding = 'utf8';
      if (typeof encoding === 'function') {
        cb = encoding;
      } else if (typeof encoding === 'string') {
        enc = encoding;
      }
      
      h2res.end(chunk, enc, cb);
      return mockRes;
    };

    // 4. Proxy events and methods
    h2res.stream.on('close', () => mockRes.emit('close'));
    h2res.stream.on('error', (err: Error) => mockRes.emit('error', err));
    h2res.on('timeout', () => mockRes.emit('timeout'));

    // @ts-expect-error
    mockRes.setTimeout = (msecs: number, cb?: () => void) => h2res.setTimeout(msecs, cb);
    // @ts-expect-error
    mockRes.destroy = (err?: Error) => h2res.destroy(err);
    
    return mockRes;
  }

  httpServer.all("*", function(fastifyRequest, fastifyReply) {
    // @ts-ignore
    const req = createMockIncomingMessage(fastifyRequest.raw);
    // @ts-ignore
    const res = createMockServerResponse(fastifyRequest.raw, fastifyReply.raw);
    requestHandle(req, res);
  });

} else {

  httpServer.all("*", function(fastifyRequest, fastifyReply) {
    requestHandle(fastifyRequest.raw, fastifyReply.raw);
  });

}

await httpServer.ready();

httpServer.listen({ host: hostname, port, }, (err, address) => {
  if (err) return console.error(err);
  console.log(`NextJS listening on ${address}`);
});
