// Original file: null

import type { FieldOptions as _google_protobuf_FieldOptions, FieldOptions__Output as _google_protobuf_FieldOptions__Output } from './FieldOptions.js';

// Original file: null

export const _google_protobuf_FieldDescriptorProto_Label = {
  LABEL_OPTIONAL: 1,
  LABEL_REPEATED: 3,
  LABEL_REQUIRED: 2,
} as const;

export type _google_protobuf_FieldDescriptorProto_Label =
  | 'LABEL_OPTIONAL'
  | 1
  | 'LABEL_REPEATED'
  | 3
  | 'LABEL_REQUIRED'
  | 2

export type _google_protobuf_FieldDescriptorProto_Label__Output = typeof _google_protobuf_FieldDescriptorProto_Label[keyof typeof _google_protobuf_FieldDescriptorProto_Label]

// Original file: null

export const _google_protobuf_FieldDescriptorProto_Type = {
  TYPE_DOUBLE: 1,
  TYPE_FLOAT: 2,
  TYPE_INT64: 3,
  TYPE_UINT64: 4,
  TYPE_INT32: 5,
  TYPE_FIXED64: 6,
  TYPE_FIXED32: 7,
  TYPE_BOOL: 8,
  TYPE_STRING: 9,
  TYPE_GROUP: 10,
  TYPE_MESSAGE: 11,
  TYPE_BYTES: 12,
  TYPE_UINT32: 13,
  TYPE_ENUM: 14,
  TYPE_SFIXED32: 15,
  TYPE_SFIXED64: 16,
  TYPE_SINT32: 17,
  TYPE_SINT64: 18,
} as const;

export type _google_protobuf_FieldDescriptorProto_Type =
  | 'TYPE_DOUBLE'
  | 1
  | 'TYPE_FLOAT'
  | 2
  | 'TYPE_INT64'
  | 3
  | 'TYPE_UINT64'
  | 4
  | 'TYPE_INT32'
  | 5
  | 'TYPE_FIXED64'
  | 6
  | 'TYPE_FIXED32'
  | 7
  | 'TYPE_BOOL'
  | 8
  | 'TYPE_STRING'
  | 9
  | 'TYPE_GROUP'
  | 10
  | 'TYPE_MESSAGE'
  | 11
  | 'TYPE_BYTES'
  | 12
  | 'TYPE_UINT32'
  | 13
  | 'TYPE_ENUM'
  | 14
  | 'TYPE_SFIXED32'
  | 15
  | 'TYPE_SFIXED64'
  | 16
  | 'TYPE_SINT32'
  | 17
  | 'TYPE_SINT64'
  | 18

export type _google_protobuf_FieldDescriptorProto_Type__Output = typeof _google_protobuf_FieldDescriptorProto_Type[keyof typeof _google_protobuf_FieldDescriptorProto_Type]

export interface FieldDescriptorProto {
  'name'?: (string);
  'extendee'?: (string);
  'number'?: (number);
  'label'?: (_google_protobuf_FieldDescriptorProto_Label);
  'type'?: (_google_protobuf_FieldDescriptorProto_Type);
  'typeName'?: (string);
  'defaultValue'?: (string);
  'options'?: (_google_protobuf_FieldOptions | null);
  'oneofIndex'?: (number);
  'jsonName'?: (string);
  'proto3Optional'?: (boolean);
}

export interface FieldDescriptorProto__Output {
  'name'?: (string);
  'extendee'?: (string);
  'number'?: (number);
  'label'?: (_google_protobuf_FieldDescriptorProto_Label__Output);
  'type'?: (_google_protobuf_FieldDescriptorProto_Type__Output);
  'typeName'?: (string);
  'defaultValue'?: (string);
  'options'?: (_google_protobuf_FieldOptions__Output);
  'oneofIndex'?: (number);
  'jsonName'?: (string);
  'proto3Optional'?: (boolean);
}
