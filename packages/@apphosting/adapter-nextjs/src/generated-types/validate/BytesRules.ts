// Original file: ../../../protoc-gen-validate/validate/validate.proto

import type { Long } from '@grpc/proto-loader';

export interface BytesRules {
  'const'?: (Buffer | Uint8Array | string);
  'minLen'?: (number | string | Long);
  'maxLen'?: (number | string | Long);
  'pattern'?: (string);
  'prefix'?: (Buffer | Uint8Array | string);
  'suffix'?: (Buffer | Uint8Array | string);
  'contains'?: (Buffer | Uint8Array | string);
  'in'?: (Buffer | Uint8Array | string)[];
  'notIn'?: (Buffer | Uint8Array | string)[];
  'ip'?: (boolean);
  'ipv4'?: (boolean);
  'ipv6'?: (boolean);
  'len'?: (number | string | Long);
  'ignoreEmpty'?: (boolean);
  'wellKnown'?: "ip"|"ipv4"|"ipv6";
}

export interface BytesRules__Output {
  'const'?: (Buffer);
  'minLen'?: (Long);
  'maxLen'?: (Long);
  'pattern'?: (string);
  'prefix'?: (Buffer);
  'suffix'?: (Buffer);
  'contains'?: (Buffer);
  'in'?: (Buffer)[];
  'notIn'?: (Buffer)[];
  'ip'?: (boolean);
  'ipv4'?: (boolean);
  'ipv6'?: (boolean);
  'len'?: (Long);
  'ignoreEmpty'?: (boolean);
}
