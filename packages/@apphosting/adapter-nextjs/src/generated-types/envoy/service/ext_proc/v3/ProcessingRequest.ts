// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type { HttpHeaders as _envoy_service_ext_proc_v3_HttpHeaders, HttpHeaders__Output as _envoy_service_ext_proc_v3_HttpHeaders__Output } from './HttpHeaders.js';
import type { HttpBody as _envoy_service_ext_proc_v3_HttpBody, HttpBody__Output as _envoy_service_ext_proc_v3_HttpBody__Output } from './HttpBody.js';
import type { HttpTrailers as _envoy_service_ext_proc_v3_HttpTrailers, HttpTrailers__Output as _envoy_service_ext_proc_v3_HttpTrailers__Output } from './HttpTrailers.js';
import type { Metadata as _envoy_config_core_v3_Metadata, Metadata__Output as _envoy_config_core_v3_Metadata__Output } from '../../../config/core/v3/Metadata.js';
import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from '../../../../google/protobuf/Struct.js';
import type { ProtocolConfiguration as _envoy_service_ext_proc_v3_ProtocolConfiguration, ProtocolConfiguration__Output as _envoy_service_ext_proc_v3_ProtocolConfiguration__Output } from './ProtocolConfiguration.js';

export interface ProcessingRequest {
  'requestHeaders'?: (_envoy_service_ext_proc_v3_HttpHeaders | null);
  'responseHeaders'?: (_envoy_service_ext_proc_v3_HttpHeaders | null);
  'requestBody'?: (_envoy_service_ext_proc_v3_HttpBody | null);
  'responseBody'?: (_envoy_service_ext_proc_v3_HttpBody | null);
  'requestTrailers'?: (_envoy_service_ext_proc_v3_HttpTrailers | null);
  'responseTrailers'?: (_envoy_service_ext_proc_v3_HttpTrailers | null);
  'metadataContext'?: (_envoy_config_core_v3_Metadata | null);
  'attributes'?: ({[key: string]: _google_protobuf_Struct});
  'observabilityMode'?: (boolean);
  'protocolConfig'?: (_envoy_service_ext_proc_v3_ProtocolConfiguration | null);
  'request'?: "requestHeaders"|"responseHeaders"|"requestBody"|"responseBody"|"requestTrailers"|"responseTrailers";
}

export interface ProcessingRequest__Output {
  'requestHeaders'?: (_envoy_service_ext_proc_v3_HttpHeaders__Output);
  'responseHeaders'?: (_envoy_service_ext_proc_v3_HttpHeaders__Output);
  'requestBody'?: (_envoy_service_ext_proc_v3_HttpBody__Output);
  'responseBody'?: (_envoy_service_ext_proc_v3_HttpBody__Output);
  'requestTrailers'?: (_envoy_service_ext_proc_v3_HttpTrailers__Output);
  'responseTrailers'?: (_envoy_service_ext_proc_v3_HttpTrailers__Output);
  'metadataContext'?: (_envoy_config_core_v3_Metadata__Output);
  'attributes'?: ({[key: string]: _google_protobuf_Struct__Output});
  'observabilityMode'?: (boolean);
  'protocolConfig'?: (_envoy_service_ext_proc_v3_ProtocolConfiguration__Output);
}
