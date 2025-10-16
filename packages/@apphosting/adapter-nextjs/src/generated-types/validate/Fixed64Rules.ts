// Original file: ../../../protoc-gen-validate/validate/validate.proto

import type { Long } from '@grpc/proto-loader';

export interface Fixed64Rules {
  'const'?: (number | string | Long);
  'lt'?: (number | string | Long);
  'lte'?: (number | string | Long);
  'gt'?: (number | string | Long);
  'gte'?: (number | string | Long);
  'in'?: (number | string | Long)[];
  'notIn'?: (number | string | Long)[];
  'ignoreEmpty'?: (boolean);
}

export interface Fixed64Rules__Output {
  'const'?: (Long);
  'lt'?: (Long);
  'lte'?: (Long);
  'gt'?: (Long);
  'gte'?: (Long);
  'in'?: (Long)[];
  'notIn'?: (Long)[];
  'ignoreEmpty'?: (boolean);
}
