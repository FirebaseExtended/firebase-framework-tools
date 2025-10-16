// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type { _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode, _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode__Output } from '../../../extensions/filters/http/ext_proc/v3/ProcessingMode.js';

export interface ProtocolConfiguration {
  'requestBodyMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode);
  'responseBodyMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode);
  'sendBodyWithoutWaitingForHeaderResponse'?: (boolean);
}

export interface ProtocolConfiguration__Output {
  'requestBodyMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode__Output);
  'responseBodyMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode__Output);
  'sendBodyWithoutWaitingForHeaderResponse'?: (boolean);
}
