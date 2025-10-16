// Original file: ../../../protoc-gen-validate/validate/validate.proto


export interface DoubleRules {
  'const'?: (number | string);
  'lt'?: (number | string);
  'lte'?: (number | string);
  'gt'?: (number | string);
  'gte'?: (number | string);
  'in'?: (number | string)[];
  'notIn'?: (number | string)[];
  'ignoreEmpty'?: (boolean);
}

export interface DoubleRules__Output {
  'const'?: (number);
  'lt'?: (number);
  'lte'?: (number);
  'gt'?: (number);
  'gte'?: (number);
  'in'?: (number)[];
  'notIn'?: (number)[];
  'ignoreEmpty'?: (boolean);
}
