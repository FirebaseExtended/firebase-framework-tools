// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { BoolValue as _google_protobuf_BoolValue, BoolValue__Output as _google_protobuf_BoolValue__Output } from '../../../../google/protobuf/BoolValue.js';

export interface RuntimeFeatureFlag {
  'defaultValue'?: (_google_protobuf_BoolValue | null);
  'runtimeKey'?: (string);
}

export interface RuntimeFeatureFlag__Output {
  'defaultValue'?: (_google_protobuf_BoolValue__Output);
  'runtimeKey'?: (string);
}
