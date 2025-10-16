// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { ProcessingRequest as _envoy_service_ext_proc_v3_ProcessingRequest, ProcessingRequest__Output as _envoy_service_ext_proc_v3_ProcessingRequest__Output } from './ProcessingRequest.js';
import type { ProcessingResponse as _envoy_service_ext_proc_v3_ProcessingResponse, ProcessingResponse__Output as _envoy_service_ext_proc_v3_ProcessingResponse__Output } from './ProcessingResponse.js';

export interface ExternalProcessorClient extends grpc.Client {
  Process(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_envoy_service_ext_proc_v3_ProcessingRequest, _envoy_service_ext_proc_v3_ProcessingResponse__Output>;
  Process(options?: grpc.CallOptions): grpc.ClientDuplexStream<_envoy_service_ext_proc_v3_ProcessingRequest, _envoy_service_ext_proc_v3_ProcessingResponse__Output>;
  process(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_envoy_service_ext_proc_v3_ProcessingRequest, _envoy_service_ext_proc_v3_ProcessingResponse__Output>;
  process(options?: grpc.CallOptions): grpc.ClientDuplexStream<_envoy_service_ext_proc_v3_ProcessingRequest, _envoy_service_ext_proc_v3_ProcessingResponse__Output>;
  
}

export interface ExternalProcessorHandlers extends grpc.UntypedServiceImplementation {
  Process: grpc.handleBidiStreamingCall<_envoy_service_ext_proc_v3_ProcessingRequest__Output, _envoy_service_ext_proc_v3_ProcessingResponse>;
  
}

export interface ExternalProcessorDefinition extends grpc.ServiceDefinition {
  Process: MethodDefinition<_envoy_service_ext_proc_v3_ProcessingRequest, _envoy_service_ext_proc_v3_ProcessingResponse, _envoy_service_ext_proc_v3_ProcessingRequest__Output, _envoy_service_ext_proc_v3_ProcessingResponse__Output>
}
