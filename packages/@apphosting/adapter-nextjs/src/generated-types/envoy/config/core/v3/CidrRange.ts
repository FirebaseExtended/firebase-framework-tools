// Original file: ../../../envoy/api/envoy/config/core/v3/address.proto

import type { UInt32Value as _google_protobuf_UInt32Value, UInt32Value__Output as _google_protobuf_UInt32Value__Output } from '../../../../google/protobuf/UInt32Value.js';

export interface CidrRange {
  'addressPrefix'?: (string);
  'prefixLen'?: (_google_protobuf_UInt32Value | null);
}

export interface CidrRange__Output {
  'addressPrefix'?: (string);
  'prefixLen'?: (_google_protobuf_UInt32Value__Output);
}
