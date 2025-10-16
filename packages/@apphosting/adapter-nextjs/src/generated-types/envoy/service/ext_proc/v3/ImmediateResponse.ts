// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type { HttpStatus as _envoy_type_v3_HttpStatus, HttpStatus__Output as _envoy_type_v3_HttpStatus__Output } from '../../../type/v3/HttpStatus.js';
import type { HeaderMutation as _envoy_service_ext_proc_v3_HeaderMutation, HeaderMutation__Output as _envoy_service_ext_proc_v3_HeaderMutation__Output } from './HeaderMutation.js';
import type { GrpcStatus as _envoy_service_ext_proc_v3_GrpcStatus, GrpcStatus__Output as _envoy_service_ext_proc_v3_GrpcStatus__Output } from './GrpcStatus.js';

export interface ImmediateResponse {
  'status'?: (_envoy_type_v3_HttpStatus | null);
  'headers'?: (_envoy_service_ext_proc_v3_HeaderMutation | null);
  'body'?: (Buffer | Uint8Array | string);
  'grpcStatus'?: (_envoy_service_ext_proc_v3_GrpcStatus | null);
  'details'?: (string);
}

export interface ImmediateResponse__Output {
  'status'?: (_envoy_type_v3_HttpStatus__Output);
  'headers'?: (_envoy_service_ext_proc_v3_HeaderMutation__Output);
  'body'?: (Buffer);
  'grpcStatus'?: (_envoy_service_ext_proc_v3_GrpcStatus__Output);
  'details'?: (string);
}
