// Original file: null

import type { FieldDescriptorProto as _google_protobuf_FieldDescriptorProto, FieldDescriptorProto__Output as _google_protobuf_FieldDescriptorProto__Output } from './FieldDescriptorProto.js';
import type { DescriptorProto as _google_protobuf_DescriptorProto, DescriptorProto__Output as _google_protobuf_DescriptorProto__Output } from './DescriptorProto.js';
import type { EnumDescriptorProto as _google_protobuf_EnumDescriptorProto, EnumDescriptorProto__Output as _google_protobuf_EnumDescriptorProto__Output } from './EnumDescriptorProto.js';
import type { MessageOptions as _google_protobuf_MessageOptions, MessageOptions__Output as _google_protobuf_MessageOptions__Output } from './MessageOptions.js';
import type { OneofDescriptorProto as _google_protobuf_OneofDescriptorProto, OneofDescriptorProto__Output as _google_protobuf_OneofDescriptorProto__Output } from './OneofDescriptorProto.js';
import type { SymbolVisibility as _google_protobuf_SymbolVisibility, SymbolVisibility__Output as _google_protobuf_SymbolVisibility__Output } from './SymbolVisibility.js';
import type { ExtensionRangeOptions as _google_protobuf_ExtensionRangeOptions, ExtensionRangeOptions__Output as _google_protobuf_ExtensionRangeOptions__Output } from './ExtensionRangeOptions.js';

export interface _google_protobuf_DescriptorProto_ExtensionRange {
  'start'?: (number);
  'end'?: (number);
  'options'?: (_google_protobuf_ExtensionRangeOptions | null);
}

export interface _google_protobuf_DescriptorProto_ExtensionRange__Output {
  'start'?: (number);
  'end'?: (number);
  'options'?: (_google_protobuf_ExtensionRangeOptions__Output);
}

export interface _google_protobuf_DescriptorProto_ReservedRange {
  'start'?: (number);
  'end'?: (number);
}

export interface _google_protobuf_DescriptorProto_ReservedRange__Output {
  'start'?: (number);
  'end'?: (number);
}

export interface DescriptorProto {
  'name'?: (string);
  'field'?: (_google_protobuf_FieldDescriptorProto)[];
  'nestedType'?: (_google_protobuf_DescriptorProto)[];
  'enumType'?: (_google_protobuf_EnumDescriptorProto)[];
  'extensionRange'?: (_google_protobuf_DescriptorProto_ExtensionRange)[];
  'extension'?: (_google_protobuf_FieldDescriptorProto)[];
  'options'?: (_google_protobuf_MessageOptions | null);
  'oneofDecl'?: (_google_protobuf_OneofDescriptorProto)[];
  'reservedRange'?: (_google_protobuf_DescriptorProto_ReservedRange)[];
  'reservedName'?: (string)[];
  'visibility'?: (_google_protobuf_SymbolVisibility);
}

export interface DescriptorProto__Output {
  'name'?: (string);
  'field'?: (_google_protobuf_FieldDescriptorProto__Output)[];
  'nestedType'?: (_google_protobuf_DescriptorProto__Output)[];
  'enumType'?: (_google_protobuf_EnumDescriptorProto__Output)[];
  'extensionRange'?: (_google_protobuf_DescriptorProto_ExtensionRange__Output)[];
  'extension'?: (_google_protobuf_FieldDescriptorProto__Output)[];
  'options'?: (_google_protobuf_MessageOptions__Output);
  'oneofDecl'?: (_google_protobuf_OneofDescriptorProto__Output)[];
  'reservedRange'?: (_google_protobuf_DescriptorProto_ReservedRange__Output)[];
  'reservedName'?: (string)[];
  'visibility'?: (_google_protobuf_SymbolVisibility__Output);
}
