// Original file: ../../../protoc-gen-validate/validate/validate.proto

import type { FloatRules as _validate_FloatRules, FloatRules__Output as _validate_FloatRules__Output } from './FloatRules.js';
import type { DoubleRules as _validate_DoubleRules, DoubleRules__Output as _validate_DoubleRules__Output } from './DoubleRules.js';
import type { Int32Rules as _validate_Int32Rules, Int32Rules__Output as _validate_Int32Rules__Output } from './Int32Rules.js';
import type { Int64Rules as _validate_Int64Rules, Int64Rules__Output as _validate_Int64Rules__Output } from './Int64Rules.js';
import type { UInt32Rules as _validate_UInt32Rules, UInt32Rules__Output as _validate_UInt32Rules__Output } from './UInt32Rules.js';
import type { UInt64Rules as _validate_UInt64Rules, UInt64Rules__Output as _validate_UInt64Rules__Output } from './UInt64Rules.js';
import type { SInt32Rules as _validate_SInt32Rules, SInt32Rules__Output as _validate_SInt32Rules__Output } from './SInt32Rules.js';
import type { SInt64Rules as _validate_SInt64Rules, SInt64Rules__Output as _validate_SInt64Rules__Output } from './SInt64Rules.js';
import type { Fixed32Rules as _validate_Fixed32Rules, Fixed32Rules__Output as _validate_Fixed32Rules__Output } from './Fixed32Rules.js';
import type { Fixed64Rules as _validate_Fixed64Rules, Fixed64Rules__Output as _validate_Fixed64Rules__Output } from './Fixed64Rules.js';
import type { SFixed32Rules as _validate_SFixed32Rules, SFixed32Rules__Output as _validate_SFixed32Rules__Output } from './SFixed32Rules.js';
import type { SFixed64Rules as _validate_SFixed64Rules, SFixed64Rules__Output as _validate_SFixed64Rules__Output } from './SFixed64Rules.js';
import type { BoolRules as _validate_BoolRules, BoolRules__Output as _validate_BoolRules__Output } from './BoolRules.js';
import type { StringRules as _validate_StringRules, StringRules__Output as _validate_StringRules__Output } from './StringRules.js';
import type { BytesRules as _validate_BytesRules, BytesRules__Output as _validate_BytesRules__Output } from './BytesRules.js';
import type { EnumRules as _validate_EnumRules, EnumRules__Output as _validate_EnumRules__Output } from './EnumRules.js';
import type { MessageRules as _validate_MessageRules, MessageRules__Output as _validate_MessageRules__Output } from './MessageRules.js';
import type { RepeatedRules as _validate_RepeatedRules, RepeatedRules__Output as _validate_RepeatedRules__Output } from './RepeatedRules.js';
import type { MapRules as _validate_MapRules, MapRules__Output as _validate_MapRules__Output } from './MapRules.js';
import type { AnyRules as _validate_AnyRules, AnyRules__Output as _validate_AnyRules__Output } from './AnyRules.js';
import type { DurationRules as _validate_DurationRules, DurationRules__Output as _validate_DurationRules__Output } from './DurationRules.js';
import type { TimestampRules as _validate_TimestampRules, TimestampRules__Output as _validate_TimestampRules__Output } from './TimestampRules.js';

export interface FieldRules {
  'float'?: (_validate_FloatRules | null);
  'double'?: (_validate_DoubleRules | null);
  'int32'?: (_validate_Int32Rules | null);
  'int64'?: (_validate_Int64Rules | null);
  'uint32'?: (_validate_UInt32Rules | null);
  'uint64'?: (_validate_UInt64Rules | null);
  'sint32'?: (_validate_SInt32Rules | null);
  'sint64'?: (_validate_SInt64Rules | null);
  'fixed32'?: (_validate_Fixed32Rules | null);
  'fixed64'?: (_validate_Fixed64Rules | null);
  'sfixed32'?: (_validate_SFixed32Rules | null);
  'sfixed64'?: (_validate_SFixed64Rules | null);
  'bool'?: (_validate_BoolRules | null);
  'string'?: (_validate_StringRules | null);
  'bytes'?: (_validate_BytesRules | null);
  'enum'?: (_validate_EnumRules | null);
  'message'?: (_validate_MessageRules | null);
  'repeated'?: (_validate_RepeatedRules | null);
  'map'?: (_validate_MapRules | null);
  'any'?: (_validate_AnyRules | null);
  'duration'?: (_validate_DurationRules | null);
  'timestamp'?: (_validate_TimestampRules | null);
  'type'?: "float"|"double"|"int32"|"int64"|"uint32"|"uint64"|"sint32"|"sint64"|"fixed32"|"fixed64"|"sfixed32"|"sfixed64"|"bool"|"string"|"bytes"|"enum"|"repeated"|"map"|"any"|"duration"|"timestamp";
}

export interface FieldRules__Output {
  'float'?: (_validate_FloatRules__Output);
  'double'?: (_validate_DoubleRules__Output);
  'int32'?: (_validate_Int32Rules__Output);
  'int64'?: (_validate_Int64Rules__Output);
  'uint32'?: (_validate_UInt32Rules__Output);
  'uint64'?: (_validate_UInt64Rules__Output);
  'sint32'?: (_validate_SInt32Rules__Output);
  'sint64'?: (_validate_SInt64Rules__Output);
  'fixed32'?: (_validate_Fixed32Rules__Output);
  'fixed64'?: (_validate_Fixed64Rules__Output);
  'sfixed32'?: (_validate_SFixed32Rules__Output);
  'sfixed64'?: (_validate_SFixed64Rules__Output);
  'bool'?: (_validate_BoolRules__Output);
  'string'?: (_validate_StringRules__Output);
  'bytes'?: (_validate_BytesRules__Output);
  'enum'?: (_validate_EnumRules__Output);
  'message'?: (_validate_MessageRules__Output);
  'repeated'?: (_validate_RepeatedRules__Output);
  'map'?: (_validate_MapRules__Output);
  'any'?: (_validate_AnyRules__Output);
  'duration'?: (_validate_DurationRules__Output);
  'timestamp'?: (_validate_TimestampRules__Output);
}
