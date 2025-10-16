// Original file: ../../../protoc-gen-validate/validate/validate.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../google/protobuf/Timestamp.js';
import type { Duration as _google_protobuf_Duration, Duration__Output as _google_protobuf_Duration__Output } from '../google/protobuf/Duration.js';

export interface TimestampRules {
  'required'?: (boolean);
  'const'?: (_google_protobuf_Timestamp | null);
  'lt'?: (_google_protobuf_Timestamp | null);
  'lte'?: (_google_protobuf_Timestamp | null);
  'gt'?: (_google_protobuf_Timestamp | null);
  'gte'?: (_google_protobuf_Timestamp | null);
  'ltNow'?: (boolean);
  'gtNow'?: (boolean);
  'within'?: (_google_protobuf_Duration | null);
}

export interface TimestampRules__Output {
  'required'?: (boolean);
  'const'?: (_google_protobuf_Timestamp__Output);
  'lt'?: (_google_protobuf_Timestamp__Output);
  'lte'?: (_google_protobuf_Timestamp__Output);
  'gt'?: (_google_protobuf_Timestamp__Output);
  'gte'?: (_google_protobuf_Timestamp__Output);
  'ltNow'?: (boolean);
  'gtNow'?: (boolean);
  'within'?: (_google_protobuf_Duration__Output);
}
