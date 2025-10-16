// Original file: null

import type { NullValue as _google_protobuf_NullValue, NullValue__Output as _google_protobuf_NullValue__Output } from './NullValue.js';
import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from './Struct.js';
import type { ListValue as _google_protobuf_ListValue, ListValue__Output as _google_protobuf_ListValue__Output } from './ListValue.js';

export interface Value {
  'nullValue'?: (_google_protobuf_NullValue);
  'numberValue'?: (number | string);
  'stringValue'?: (string);
  'boolValue'?: (boolean);
  'structValue'?: (_google_protobuf_Struct | null);
  'listValue'?: (_google_protobuf_ListValue | null);
  'kind'?: "nullValue"|"numberValue"|"stringValue"|"boolValue"|"structValue"|"listValue";
}

export interface Value__Output {
  'nullValue'?: (_google_protobuf_NullValue__Output);
  'numberValue'?: (number);
  'stringValue'?: (string);
  'boolValue'?: (boolean);
  'structValue'?: (_google_protobuf_Struct__Output);
  'listValue'?: (_google_protobuf_ListValue__Output);
}
