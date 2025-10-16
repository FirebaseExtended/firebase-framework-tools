// Original file: ../../../envoy/api/envoy/config/core/v3/backoff.proto

import type { Duration as _google_protobuf_Duration, Duration__Output as _google_protobuf_Duration__Output } from '../../../../google/protobuf/Duration.js';

export interface BackoffStrategy {
  'baseInterval'?: (_google_protobuf_Duration | null);
  'maxInterval'?: (_google_protobuf_Duration | null);
}

export interface BackoffStrategy__Output {
  'baseInterval'?: (_google_protobuf_Duration__Output);
  'maxInterval'?: (_google_protobuf_Duration__Output);
}
