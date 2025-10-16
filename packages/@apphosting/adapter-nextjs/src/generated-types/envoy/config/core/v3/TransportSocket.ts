// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { Any as _google_protobuf_Any, Any__Output as _google_protobuf_Any__Output } from '../../../../google/protobuf/Any.js';

export interface TransportSocket {
  'name'?: (string);
  'typedConfig'?: (_google_protobuf_Any | null);
  'configType'?: "typedConfig";
}

export interface TransportSocket__Output {
  'name'?: (string);
  'typedConfig'?: (_google_protobuf_Any__Output);
}
