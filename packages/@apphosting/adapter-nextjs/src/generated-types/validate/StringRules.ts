// Original file: ../../../protoc-gen-validate/validate/validate.proto

import type { KnownRegex as _validate_KnownRegex, KnownRegex__Output as _validate_KnownRegex__Output } from './KnownRegex.js';
import type { Long } from '@grpc/proto-loader';

export interface StringRules {
  'const'?: (string);
  'minLen'?: (number | string | Long);
  'maxLen'?: (number | string | Long);
  'minBytes'?: (number | string | Long);
  'maxBytes'?: (number | string | Long);
  'pattern'?: (string);
  'prefix'?: (string);
  'suffix'?: (string);
  'contains'?: (string);
  'in'?: (string)[];
  'notIn'?: (string)[];
  'email'?: (boolean);
  'hostname'?: (boolean);
  'ip'?: (boolean);
  'ipv4'?: (boolean);
  'ipv6'?: (boolean);
  'uri'?: (boolean);
  'uriRef'?: (boolean);
  'len'?: (number | string | Long);
  'lenBytes'?: (number | string | Long);
  'address'?: (boolean);
  'uuid'?: (boolean);
  'notContains'?: (string);
  'wellKnownRegex'?: (_validate_KnownRegex);
  'strict'?: (boolean);
  'ignoreEmpty'?: (boolean);
  'wellKnown'?: "email"|"hostname"|"ip"|"ipv4"|"ipv6"|"uri"|"uriRef"|"address"|"uuid"|"wellKnownRegex";
}

export interface StringRules__Output {
  'const'?: (string);
  'minLen'?: (Long);
  'maxLen'?: (Long);
  'minBytes'?: (Long);
  'maxBytes'?: (Long);
  'pattern'?: (string);
  'prefix'?: (string);
  'suffix'?: (string);
  'contains'?: (string);
  'in'?: (string)[];
  'notIn'?: (string)[];
  'email'?: (boolean);
  'hostname'?: (boolean);
  'ip'?: (boolean);
  'ipv4'?: (boolean);
  'ipv6'?: (boolean);
  'uri'?: (boolean);
  'uriRef'?: (boolean);
  'len'?: (Long);
  'lenBytes'?: (Long);
  'address'?: (boolean);
  'uuid'?: (boolean);
  'notContains'?: (string);
  'wellKnownRegex'?: (_validate_KnownRegex__Output);
  'strict'?: (boolean);
  'ignoreEmpty'?: (boolean);
}
