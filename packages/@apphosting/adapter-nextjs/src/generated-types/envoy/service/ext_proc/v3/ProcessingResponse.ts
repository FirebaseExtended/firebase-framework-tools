// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type { HeadersResponse as _envoy_service_ext_proc_v3_HeadersResponse, HeadersResponse__Output as _envoy_service_ext_proc_v3_HeadersResponse__Output } from './HeadersResponse.js';
import type { BodyResponse as _envoy_service_ext_proc_v3_BodyResponse, BodyResponse__Output as _envoy_service_ext_proc_v3_BodyResponse__Output } from './BodyResponse.js';
import type { TrailersResponse as _envoy_service_ext_proc_v3_TrailersResponse, TrailersResponse__Output as _envoy_service_ext_proc_v3_TrailersResponse__Output } from './TrailersResponse.js';
import type { ImmediateResponse as _envoy_service_ext_proc_v3_ImmediateResponse, ImmediateResponse__Output as _envoy_service_ext_proc_v3_ImmediateResponse__Output } from './ImmediateResponse.js';
import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from '../../../../google/protobuf/Struct.js';
import type { ProcessingMode as _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode, ProcessingMode__Output as _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode__Output } from '../../../extensions/filters/http/ext_proc/v3/ProcessingMode.js';
import type { Duration as _google_protobuf_Duration, Duration__Output as _google_protobuf_Duration__Output } from '../../../../google/protobuf/Duration.js';

export interface ProcessingResponse {
  'requestHeaders'?: (_envoy_service_ext_proc_v3_HeadersResponse | null);
  'responseHeaders'?: (_envoy_service_ext_proc_v3_HeadersResponse | null);
  'requestBody'?: (_envoy_service_ext_proc_v3_BodyResponse | null);
  'responseBody'?: (_envoy_service_ext_proc_v3_BodyResponse | null);
  'requestTrailers'?: (_envoy_service_ext_proc_v3_TrailersResponse | null);
  'responseTrailers'?: (_envoy_service_ext_proc_v3_TrailersResponse | null);
  'immediateResponse'?: (_envoy_service_ext_proc_v3_ImmediateResponse | null);
  'dynamicMetadata'?: (_google_protobuf_Struct | null);
  'modeOverride'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode | null);
  'overrideMessageTimeout'?: (_google_protobuf_Duration | null);
  'response'?: "requestHeaders"|"responseHeaders"|"requestBody"|"responseBody"|"requestTrailers"|"responseTrailers"|"immediateResponse";
}

export interface ProcessingResponse__Output {
  'requestHeaders'?: (_envoy_service_ext_proc_v3_HeadersResponse__Output);
  'responseHeaders'?: (_envoy_service_ext_proc_v3_HeadersResponse__Output);
  'requestBody'?: (_envoy_service_ext_proc_v3_BodyResponse__Output);
  'responseBody'?: (_envoy_service_ext_proc_v3_BodyResponse__Output);
  'requestTrailers'?: (_envoy_service_ext_proc_v3_TrailersResponse__Output);
  'responseTrailers'?: (_envoy_service_ext_proc_v3_TrailersResponse__Output);
  'immediateResponse'?: (_envoy_service_ext_proc_v3_ImmediateResponse__Output);
  'dynamicMetadata'?: (_google_protobuf_Struct__Output);
  'modeOverride'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode__Output);
  'overrideMessageTimeout'?: (_google_protobuf_Duration__Output);
}
