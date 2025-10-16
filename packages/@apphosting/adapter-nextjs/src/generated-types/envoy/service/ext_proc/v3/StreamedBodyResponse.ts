// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto


export interface StreamedBodyResponse {
  'body'?: (Buffer | Uint8Array | string);
  'endOfStream'?: (boolean);
}

export interface StreamedBodyResponse__Output {
  'body'?: (Buffer);
  'endOfStream'?: (boolean);
}
