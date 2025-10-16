import { readFileSync } from "node:fs";
import { createServer, ServerResponse, IncomingMessage } from "node:http";
import { join } from "node:path";

import {
  ExternalProcessorServer,
  ProcessingRequest,
  ProcessingResponse,
  ExternalProcessorService,
  CommonResponse_ResponseStatus,
} from '../protos/envoy/service/ext_proc/v3/external_processor.js';
import { HeaderValueOption, HeaderValueOption_HeaderAppendAction } from '../protos/envoy/config/core/v3/base.js';
import grpc from "@grpc/grpc-js";

const dir = process.cwd();

const port = parseInt(process.env.PORT!, 10) || 3000
const hostname = process.env.HOSTNAME || '0.0.0.0'

let keepAliveTimeout: number | undefined = parseInt(process.env.KEEP_ALIVE_TIMEOUT!, 10);

// (bundle.yaml)
// service_calls:
// - matcher:
//   - path: /api/**
//   - header_exists: x-foo
//   on:
//   - request_headers
//   - response_headers

// rewrites, redirects (before_files, after_files)

const conf = JSON.parse(readFileSync(join(dir, ".next", "required-server-files.json"), "utf-8")).config;

const extProcService: ExternalProcessorServer = {
  process(call): void {
    console.log('New processing stream initiated...');

    call.on('data', (request: ProcessingRequest) => {
      // 1. Handle Request Headers
      if (request.requestHeaders) {
        console.log('Processing REQUEST_HEADERS...');
        
        const newHeader: HeaderValueOption = {
          header: {
            key: 'x-callout-processed-ts',
            rawValue: Uint8Array.from(Buffer.from('true')),
            value: "true",
          },
          appendAction: HeaderValueOption_HeaderAppendAction.APPEND_IF_EXISTS_OR_ADD,
          append: true,
          keepEmptyValue: true,
        };

        const response: ProcessingResponse = {
          requestHeaders: {
            response: { 
              headerMutation: {
                setHeaders: [newHeader],
                removeHeaders: [],
              },
              status: CommonResponse_ResponseStatus.CONTINUE,
              bodyMutation: undefined,
              trailers: undefined,
              clearRouteCache: false,
            }
          },
          dynamicMetadata: undefined,
          modeOverride: undefined,
          overrideMessageTimeout: undefined,
        };
        call.write(response);
      }
      
      // 2. Handle Request Body
      else if (request.requestBody) {
        console.log('Processing REQUEST_BODY...');
        
        const response: ProcessingResponse = {
          requestBody: {
            response: {
              headerMutation: undefined,
              status: CommonResponse_ResponseStatus.CONTINUE,
              bodyMutation: undefined,
              trailers: undefined,
              clearRouteCache: false,
            },
          },
          dynamicMetadata: undefined,
          modeOverride: undefined,
          overrideMessageTimeout: undefined,
        };
        call.write(response);
      }

      // 3. Handle Request Trailers
      else if (request.requestTrailers) {
        console.log('Processing REQUEST_TRAILERS...');

        const response: ProcessingResponse = {
          requestTrailers: {
            headerMutation: {
              setHeaders: [],
              removeHeaders: [],
            },
          },
          dynamicMetadata: undefined,
          modeOverride: undefined,
          overrideMessageTimeout: undefined,
        };
        call.write(response);
      }

      // 4. Handle Response Headers
      else if (request.responseHeaders) {
        console.log('Processing RESPONSE_HEADERS...');
        
        const response: ProcessingResponse = {
          // --- The oneof property ---
          responseHeaders: {
            response: {
              headerMutation: undefined,
              status: CommonResponse_ResponseStatus.CONTINUE,
              bodyMutation: undefined,
              trailers: undefined,
              clearRouteCache: false,
            }
          },
          // --- Required top-level properties ---
          dynamicMetadata: undefined,
          modeOverride: undefined,
          overrideMessageTimeout: undefined,
        };
        call.write(response);
      }

      // 5. Handle Response Body
      else if (request.responseBody) {
        console.log('Processing RESPONSE_BODY...');
        
        const response: ProcessingResponse = {
          // --- The oneof property ---
          responseBody: {
            response: {
              headerMutation: undefined,
              status: CommonResponse_ResponseStatus.CONTINUE,
              bodyMutation: undefined,
              trailers: undefined,
              clearRouteCache: false,
            },
          },
          // --- Required top-level properties ---
          dynamicMetadata: undefined,
          modeOverride: undefined,
          overrideMessageTimeout: undefined,
        };
        call.write(response);
      }

      // 6. Handle Response Trailers
      else if (request.responseTrailers) {
        console.log('Processing RESPONSE_TRAILERS...');
        
        const response: ProcessingResponse = {
          // --- The oneof property ---
          responseTrailers: {
            headerMutation: {
              setHeaders: [],
              removeHeaders: [],
            },
          },
          // --- Required top-level properties ---
          dynamicMetadata: undefined,
          modeOverride: undefined,
          overrideMessageTimeout: undefined,
        };
        call.write(response);
      }
    });

    call.on('error', (err) => {
      console.error('Stream error:', err);
    });

    call.on('end', () => {
      console.log('Processing stream ended.');
      call.end();
    });
  },
};

const server = new grpc.Server();
  
// Add the ExternalProcessor service with our `process` handler
server.addService(ExternalProcessorService, extProcService);

// The load balancer requires HTTP/2, so you must use
// createSsl for a production environment.
// For this example, we use insecure credentials.
const grpcPort = '8080';
server.bindAsync(
  `0.0.0.0:${grpcPort}`,
  grpc.ServerCredentials.createInsecure(), // <-- Use createSsl() in production
  (err, port) => {
    if (err) {
      console.error('Failed to bind server:', err);
      return;
    }
    console.log(`gRPC Callout Server running on port ${port}`);
  }
);

process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(conf);

process.setMaxListeners(1_000);

if (
  Number.isNaN(keepAliveTimeout) ||
  !Number.isFinite(keepAliveTimeout) ||
  keepAliveTimeout < 0
) {
  keepAliveTimeout = undefined
}

const NextServer = require("next/dist/server/next-server.js");
const minimalServer = new NextServer.default({
    conf,
    dev: false,
    dir,
    hostname, 
    port,
    minimalMode: true,
});

// While demoing in envoy was simple enough, to do this on GCP edge we have two
// main problems:
//   1. We need to prevent EOF from being dispatched so we can stitch the
//      resume response to the end of the preamble. proxy-wasm ABI doesn't
//      currently allow this. If we didn't care about CDN, we could hack
//      into the adapter by being clever about chunked encoding but the
//      whole point is to be CDN-friendly.
//   2. The HTTP sidecar request doesn't allow streaming in proxy-wasm ATM.
// Solution:
//   GRPC could solve #2 but that leaves us with #1.
//   Solution is to invert the logic—use the sidecar for preamble and the main
//   request for resumption.
// This causes more issues:
//   1. proxy-wasm can't change the main request method (resume is a POST)
//   2. we've now broken streaming for apps/routes not using PPR
// While we can patch #1 in the adapter, there's no simple (multi-tenant)
//   solution for #1 that doesn't require we know the PPR routes ahead of time
//   and thus, this can't be done without control-plane coordination.

// TODO spin up NodeJS middleware as a GRPC service

// TODO spin up PPR resumption as a GRPC service


const { NEXT_REQUEST_META } = require("next/dist/server/request-meta.js");

async function injectAppHostingHeaders(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return;
  if (!res.getHeaderNames().includes('x-nextjs-postponed')) return;
  // TODO memoize/import this symbol outside the function
  // TODO import the type from NextJS
  const metadata = (req as any)[NEXT_REQUEST_META];
  // TODO investigate if there's a better / more stable way to get the postpone token
  const cacheEntry = await metadata.incrementalCache.get(metadata.match.definition.pathname, { kind: metadata.match.definition.kind, isRoutePPREnabled: true });
  res.appendHeader('x-fah-postponed', Buffer.from(cacheEntry.value.postponed).toString('base64url'));
}

async function requestHandle(req: IncomingMessage, res: ServerResponse) {
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
    await minimalServer.prepare();
    return await minimalServer.getRequestHandler()(req, res);
};

createServer({ keepAliveTimeout }, requestHandle).listen(port, hostname, () => {
    console.log(`minimal listening on http://${hostname}:${port}.`);
});
