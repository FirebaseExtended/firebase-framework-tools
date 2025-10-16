// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type { StreamedBodyResponse as _envoy_service_ext_proc_v3_StreamedBodyResponse, StreamedBodyResponse__Output as _envoy_service_ext_proc_v3_StreamedBodyResponse__Output } from './StreamedBodyResponse.js';

export interface BodyMutation {
  'body'?: (Buffer | Uint8Array | string);
  'clearBody'?: (boolean);
  'streamedResponse'?: (_envoy_service_ext_proc_v3_StreamedBodyResponse | null);
  'mutation'?: "body"|"clearBody"|"streamedResponse";
}

export interface BodyMutation__Output {
  'body'?: (Buffer);
  'clearBody'?: (boolean);
  'streamedResponse'?: (_envoy_service_ext_proc_v3_StreamedBodyResponse__Output);
}
