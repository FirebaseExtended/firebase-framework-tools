// Original file: null

import type { EnumValueDescriptorProto as _google_protobuf_EnumValueDescriptorProto, EnumValueDescriptorProto__Output as _google_protobuf_EnumValueDescriptorProto__Output } from './EnumValueDescriptorProto.js';
import type { EnumOptions as _google_protobuf_EnumOptions, EnumOptions__Output as _google_protobuf_EnumOptions__Output } from './EnumOptions.js';
import type { SymbolVisibility as _google_protobuf_SymbolVisibility, SymbolVisibility__Output as _google_protobuf_SymbolVisibility__Output } from './SymbolVisibility.js';

export interface _google_protobuf_EnumDescriptorProto_EnumReservedRange {
  'start'?: (number);
  'end'?: (number);
}

export interface _google_protobuf_EnumDescriptorProto_EnumReservedRange__Output {
  'start'?: (number);
  'end'?: (number);
}

export interface EnumDescriptorProto {
  'name'?: (string);
  'value'?: (_google_protobuf_EnumValueDescriptorProto)[];
  'options'?: (_google_protobuf_EnumOptions | null);
  'reservedRange'?: (_google_protobuf_EnumDescriptorProto_EnumReservedRange)[];
  'reservedName'?: (string)[];
  'visibility'?: (_google_protobuf_SymbolVisibility);
}

export interface EnumDescriptorProto__Output {
  'name'?: (string);
  'value'?: (_google_protobuf_EnumValueDescriptorProto__Output)[];
  'options'?: (_google_protobuf_EnumOptions__Output);
  'reservedRange'?: (_google_protobuf_EnumDescriptorProto_EnumReservedRange__Output)[];
  'reservedName'?: (string)[];
  'visibility'?: (_google_protobuf_SymbolVisibility__Output);
}
