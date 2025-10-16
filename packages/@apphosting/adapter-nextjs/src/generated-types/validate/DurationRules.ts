// Original file: ../../../protoc-gen-validate/validate/validate.proto

import type { Duration as _google_protobuf_Duration, Duration__Output as _google_protobuf_Duration__Output } from '../google/protobuf/Duration.js';

export interface DurationRules {
  'required'?: (boolean);
  'const'?: (_google_protobuf_Duration | null);
  'lt'?: (_google_protobuf_Duration | null);
  'lte'?: (_google_protobuf_Duration | null);
  'gt'?: (_google_protobuf_Duration | null);
  'gte'?: (_google_protobuf_Duration | null);
  'in'?: (_google_protobuf_Duration)[];
  'notIn'?: (_google_protobuf_Duration)[];
}

export interface DurationRules__Output {
  'required'?: (boolean);
  'const'?: (_google_protobuf_Duration__Output);
  'lt'?: (_google_protobuf_Duration__Output);
  'lte'?: (_google_protobuf_Duration__Output);
  'gt'?: (_google_protobuf_Duration__Output);
  'gte'?: (_google_protobuf_Duration__Output);
  'in'?: (_google_protobuf_Duration__Output)[];
  'notIn'?: (_google_protobuf_Duration__Output)[];
}
