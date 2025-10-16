// Original file: ../../../protoc-gen-validate/validate/validate.proto

import type { FieldRules as _validate_FieldRules, FieldRules__Output as _validate_FieldRules__Output } from './FieldRules.js';
import type { Long } from '@grpc/proto-loader';

export interface RepeatedRules {
  'minItems'?: (number | string | Long);
  'maxItems'?: (number | string | Long);
  'unique'?: (boolean);
  'items'?: (_validate_FieldRules | null);
  'ignoreEmpty'?: (boolean);
}

export interface RepeatedRules__Output {
  'minItems'?: (Long);
  'maxItems'?: (Long);
  'unique'?: (boolean);
  'items'?: (_validate_FieldRules__Output);
  'ignoreEmpty'?: (boolean);
}
