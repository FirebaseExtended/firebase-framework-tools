#! /usr/bin/env node
import { readFileSync } from "node:fs";
import { ServerResponse, IncomingMessage } from "node:http";
import { join } from "node:path";
import fastify from "fastify";

import { CommonResponse_ResponseStatus, ExternalProcessor } from "../protos/envoy/service/ext_proc/v3/external_processor_pb.js"
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";

import type { Http2ServerRequest, Http2ServerResponse } from "node:http2";
import { HeaderMap, HeaderValue } from "../protos/envoy/config/core/v3/base_pb.js";
import { Socket } from "node:net";

const dir = join(process.cwd(), process.argv[2] || ".next/standalone");

const port = parseInt(process.env.PORT!, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

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

const minimalMode = !!process.env.FAH_MINIMAL_MODE;

const resolveNextServer = import(join(dir, "node_modules/next/dist/server/next-server.js")).then(async ({ default: NextServer }) => {
  const server = new NextServer.default({
    conf,
    dev: false,
    dir,
    hostname, 
    port,
    minimalMode,
  });
  await server.prepare();
  return server;
});

// TODO spin up NodeJS middleware as a GRPC service

// TODO spin up PPR resumption as a GRPC service

async function injectAppHostingHeaders(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return;
  if (!res.getHeaderNames().includes('x-nextjs-postponed')) return;
  // TODO memoize/import this symbol outside the function
  // TODO import the type from NextJS
  const { NEXT_REQUEST_META } = await import(join(dir, "node_modules/next/dist/server/request-meta.js"));
  const metadata = (req as any)[NEXT_REQUEST_META];
  // TODO investigate if there's a better / more stable way to get the postpone token
  const cacheEntry = await metadata.incrementalCache.get(metadata.match.definition.pathname, { kind: metadata.match.definition.kind, isRoutePPREnabled: true });
  res.appendHeader('x-fah-postponed', Buffer.from(cacheEntry.value.postponed).toString('base64url'));
}

async function requestHandle(req: IncomingMessage, res: ServerResponse) {
    if (minimalMode) {
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
    return (await resolveNextServer).getRequestHandler()(req, res);
};

const USING_CALLOUTS = !!process.env.FAH_USING_CALLOUTS;
const commonFastifyOptions = { }; 
let httpServer;

if (USING_CALLOUTS) {

  httpServer = fastify({ http2: true, ...commonFastifyOptions });

  await httpServer.register(fastifyConnectPlugin, {
    routes: (router) => router.service(ExternalProcessor, {
      process: async function *processCallouts(callouts) {
        let requestHeaders: HeaderValue[] = [];
        let resolveResumeResponse: Promise<ServerResponse>|undefined;
        let resumeSocket: Socket;
        for await (const callout of callouts) {
          switch (callout.request.case) {
            case "requestHeaders": {
              requestHeaders = callout.request.value.headers?.headers || [];
              break;
            }
            case "requestBody": {
              // TODO make a converter to a fetch request, make a helper to extract these headers
              const path = requestHeaders.find((it) => it.key === ":path")?.value || "/";
              const method = requestHeaders.find((it) => it.key === ":method")?.value || "GET";
              const referrer = requestHeaders.find((it) => it.key === "referer")?.value;
              const authority = requestHeaders.find((it) => it.key === ":authority")?.value || hostname;
              if (!matchers.some(it => path.match(it))) break;
              // middleware is intended for v8 isolates, with the fetch api
              const middlewareRequest = {
                  url: `http://${authority}${path}`, // TODO look into using authority
                  method,
                  // filter out http2 pseudo-headers, next chokes on these
                  headers: Object.fromEntries(requestHeaders.filter((it) => !it.key.startsWith(":")).map((it) => [it.key, it.value]) || []),
                  // keepalive: req.keepalive,
                  destination: 'document',
                  credentials: 'same-origin',
                  bodyUsed: false,
                  body: callout.request.value.body, // TODO handle endOfStream
                  mode: "navigate",
                  redirect: "follow",
                  referrer,
              };
              const middleware = await resolveMiddleware;
              let middlewareResponse: Response;
              try {
                middlewareResponse = await middleware.default({ request: middlewareRequest });
              } catch (err) {
                console.error("Middleware execution failed:", err);
                yield {
                  response: {
                    case: "requestBody",
                    value: {
                      response: {
                        status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                        bodyMutation: { body: Buffer.from("Internal Server Error") },
                        end_stream: true,
                        headerMutation: {
                          setHeaders: [
                            { header: { key: ":status", value: "500" } },
                          ]
                        },
                      },
                      
                    },
                  },
                };
                continue;
              }
              if (middlewareResponse.headers.has("x-middleware-next")) break;
              const middlewareResponseHeaders = Object.fromEntries(middlewareResponse.headers);
              delete middlewareResponseHeaders["x-middleware-next"]; // Clean up middleware-specific header, TODO clean up other headers

              // Convert the Fetch Headers object to the { key, value } array Envoy expects
              const responseHeaders = Object.entries(middlewareResponseHeaders).map(([key, value]) => ({
                header: { key, value },
              }));

              // This tells Envoy to STOP processing and send this response immediately.
              yield {
                response: {
                  case: "requestBody", // We are responding to the requestHeaders callout
                  value: {
                    response: {
                      status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                      headerMutation: {
                        setHeaders: [
                          ...responseHeaders, // Set the headers from the middleware
                          { header: { key: ":status", value: middlewareResponse.status.toString() } },
                        ]
                      },
                      bodyMutation: {
                        mutation: {
                          case: 'body',
                          // TODO stream over the body and yield
                          value: Uint8Array.from(Buffer.from(await middlewareResponse.text()))
                        },
                      },
                      end_stream: true
                    },
                  },
                },
              }
              break;
            }
            case "responseHeaders": {
              const postponedToken = callout.request.value.headers?.headers.find((it) => it.key === "x-fah-postponed")?.value;
              if (!postponedToken) break;
              yield {
                response: {
                  case: "responseHeaders",
                  value: {
                    response: {
                      status: CommonResponse_ResponseStatus.CONTINUE,
                      headerMutation: {
                        setHeaders: [
                          { header: { key: "transfer-encoding", value: "chunked" } },
                        ],
                        removeHeaders: ["x-fah-postponed", "content-length"],
                      },
                    },
                  },
                },
              }
              const nextServer = await resolveNextServer;
              resumeSocket = new Socket();
              const resumeRequest = new IncomingMessage(resumeSocket);
              resumeRequest.url = `/_next/postponed/resume${requestHeaders.find((it) => it.key === ":path")?.value || "/"}`;
              resumeRequest.method = "POST";
              for (const header in requestHeaders) {
                if (header.startsWith(":")) continue; // drop HTTP2 pseudo headers
                resumeRequest.headers[header] = requestHeaders[header].value;
              }
              const resumeResponse = new ServerResponse(resumeRequest);
              resolveResumeResponse = nextServer.getRequestHandler()(resumeRequest, resumeResponse).then(() => resumeResponse);
              resumeSocket.write(Uint8Array.from(Buffer.from(postponedToken, "base64url")));
              resumeSocket.end();
              continue;
            }
            case "responseBody": {
              if (!resolveResumeResponse) break;
              yield {
                response: {
                  case: "responseBody",
                  value: {
                    response: {
                      status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                      bodyMutation: { body: callout.request.value.body },
                      end_stream: false,
                    },
                  },
                },
              };
              if (!callout.request.value.endOfStream) continue;
              for await (const body of resumeSocket!) {
                yield {
                  response: {
                    case: "responseBody",
                    value: {
                      response: {
                        status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                        bodyMutation: { body },
                        end_stream: false,
                      },
                    },
                  },
                }
              }
              yield {
                response: {
                  case: "responseBody",
                  value: {
                    response: {
                      status: CommonResponse_ResponseStatus.CONTINUE_AND_REPLACE,
                      bodyMutation: { body: Buffer.alloc(0) },
                      end_stream: true,
                    },
                  },
                },
              }
              continue;
            }
          }
          yield {};
        }
      }
    }),
  });


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
    const req = createMockIncomingMessage(fastifyRequest.raw);
    const res = createMockServerResponse(fastifyRequest.raw, fastifyReply.raw);
    requestHandle(req, res);
  });

} else {

  httpServer = fastify({ ...commonFastifyOptions });

  httpServer.all("*", function(fastifyRequest, fastifyReply) {
    requestHandle(fastifyRequest.raw, fastifyReply.raw);
  });

}

await httpServer.ready();

httpServer.listen({ host: hostname, port, }, (err, address) => {
  if (err) return console.error(err);
  console.log(`Server listening on ${address}`);
});
