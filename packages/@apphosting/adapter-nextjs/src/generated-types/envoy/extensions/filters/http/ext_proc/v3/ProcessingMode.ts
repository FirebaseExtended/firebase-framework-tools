// Original file: ../../../envoy/api/envoy/extensions/filters/http/ext_proc/v3/processing_mode.proto


// Original file: ../../../envoy/api/envoy/extensions/filters/http/ext_proc/v3/processing_mode.proto

export const _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode = {
  NONE: 0,
  STREAMED: 1,
  BUFFERED: 2,
  BUFFERED_PARTIAL: 3,
  FULL_DUPLEX_STREAMED: 4,
} as const;

export type _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode =
  | 'NONE'
  | 0
  | 'STREAMED'
  | 1
  | 'BUFFERED'
  | 2
  | 'BUFFERED_PARTIAL'
  | 3
  | 'FULL_DUPLEX_STREAMED'
  | 4

export type _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode__Output = typeof _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode[keyof typeof _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode]

// Original file: ../../../envoy/api/envoy/extensions/filters/http/ext_proc/v3/processing_mode.proto

export const _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode = {
  DEFAULT: 0,
  SEND: 1,
  SKIP: 2,
} as const;

export type _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode =
  | 'DEFAULT'
  | 0
  | 'SEND'
  | 1
  | 'SKIP'
  | 2

export type _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode__Output = typeof _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode[keyof typeof _envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode]

export interface ProcessingMode {
  'requestHeaderMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode);
  'responseHeaderMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode);
  'requestBodyMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode);
  'responseBodyMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode);
  'requestTrailerMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode);
  'responseTrailerMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode);
}

export interface ProcessingMode__Output {
  'requestHeaderMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode__Output);
  'responseHeaderMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode__Output);
  'requestBodyMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode__Output);
  'responseBodyMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_BodySendMode__Output);
  'requestTrailerMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode__Output);
  'responseTrailerMode'?: (_envoy_extensions_filters_http_ext_proc_v3_ProcessingMode_HeaderSendMode__Output);
}
