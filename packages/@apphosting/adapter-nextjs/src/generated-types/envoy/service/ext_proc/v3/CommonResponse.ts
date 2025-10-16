// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type { HeaderMutation as _envoy_service_ext_proc_v3_HeaderMutation, HeaderMutation__Output as _envoy_service_ext_proc_v3_HeaderMutation__Output } from './HeaderMutation.js';
import type { BodyMutation as _envoy_service_ext_proc_v3_BodyMutation, BodyMutation__Output as _envoy_service_ext_proc_v3_BodyMutation__Output } from './BodyMutation.js';
import type { HeaderMap as _envoy_config_core_v3_HeaderMap, HeaderMap__Output as _envoy_config_core_v3_HeaderMap__Output } from '../../../config/core/v3/HeaderMap.js';

// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

export const _envoy_service_ext_proc_v3_CommonResponse_ResponseStatus = {
  CONTINUE: 0,
  CONTINUE_AND_REPLACE: 1,
} as const;

export type _envoy_service_ext_proc_v3_CommonResponse_ResponseStatus =
  | 'CONTINUE'
  | 0
  | 'CONTINUE_AND_REPLACE'
  | 1

export type _envoy_service_ext_proc_v3_CommonResponse_ResponseStatus__Output = typeof _envoy_service_ext_proc_v3_CommonResponse_ResponseStatus[keyof typeof _envoy_service_ext_proc_v3_CommonResponse_ResponseStatus]

export interface CommonResponse {
  'status'?: (_envoy_service_ext_proc_v3_CommonResponse_ResponseStatus);
  'headerMutation'?: (_envoy_service_ext_proc_v3_HeaderMutation | null);
  'bodyMutation'?: (_envoy_service_ext_proc_v3_BodyMutation | null);
  'trailers'?: (_envoy_config_core_v3_HeaderMap | null);
  'clearRouteCache'?: (boolean);
}

export interface CommonResponse__Output {
  'status'?: (_envoy_service_ext_proc_v3_CommonResponse_ResponseStatus__Output);
  'headerMutation'?: (_envoy_service_ext_proc_v3_HeaderMutation__Output);
  'bodyMutation'?: (_envoy_service_ext_proc_v3_BodyMutation__Output);
  'trailers'?: (_envoy_config_core_v3_HeaderMap__Output);
  'clearRouteCache'?: (boolean);
}
