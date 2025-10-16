// Original file: ../../../protoc-gen-validate/validate/validate.proto

import type { FieldRules as _validate_FieldRules, FieldRules__Output as _validate_FieldRules__Output } from './FieldRules.js';
import type { Long } from '@grpc/proto-loader';

export interface MapRules {
  'minPairs'?: (number | string | Long);
  'maxPairs'?: (number | string | Long);
  'noSparse'?: (boolean);
  'keys'?: (_validate_FieldRules | null);
  'values'?: (_validate_FieldRules | null);
  'ignoreEmpty'?: (boolean);
}

export interface MapRules__Output {
  'minPairs'?: (Long);
  'maxPairs'?: (Long);
  'noSparse'?: (boolean);
  'keys'?: (_validate_FieldRules__Output);
  'values'?: (_validate_FieldRules__Output);
  'ignoreEmpty'?: (boolean);
}
