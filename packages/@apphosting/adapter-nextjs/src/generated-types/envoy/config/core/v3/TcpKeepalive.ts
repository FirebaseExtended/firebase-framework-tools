// Original file: ../../../envoy/api/envoy/config/core/v3/address.proto

import type { UInt32Value as _google_protobuf_UInt32Value, UInt32Value__Output as _google_protobuf_UInt32Value__Output } from '../../../../google/protobuf/UInt32Value.js';

export interface TcpKeepalive {
  'keepaliveProbes'?: (_google_protobuf_UInt32Value | null);
  'keepaliveTime'?: (_google_protobuf_UInt32Value | null);
  'keepaliveInterval'?: (_google_protobuf_UInt32Value | null);
}

export interface TcpKeepalive__Output {
  'keepaliveProbes'?: (_google_protobuf_UInt32Value__Output);
  'keepaliveTime'?: (_google_protobuf_UInt32Value__Output);
  'keepaliveInterval'?: (_google_protobuf_UInt32Value__Output);
}
