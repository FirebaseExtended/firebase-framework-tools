// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto


export interface HttpBody {
  'body'?: (Buffer | Uint8Array | string);
  'endOfStream'?: (boolean);
}

export interface HttpBody__Output {
  'body'?: (Buffer);
  'endOfStream'?: (boolean);
}
