// Original file: ../../../envoy/api/envoy/config/core/v3/http_uri.proto

import type { Duration as _google_protobuf_Duration, Duration__Output as _google_protobuf_Duration__Output } from '../../../../google/protobuf/Duration.js';

export interface HttpUri {
  'uri'?: (string);
  'cluster'?: (string);
  'timeout'?: (_google_protobuf_Duration | null);
  'httpUpstreamType'?: "cluster";
}

export interface HttpUri__Output {
  'uri'?: (string);
  'cluster'?: (string);
  'timeout'?: (_google_protobuf_Duration__Output);
}
