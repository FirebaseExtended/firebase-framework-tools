// Original file: null

import type { DescriptorProto as _google_protobuf_DescriptorProto, DescriptorProto__Output as _google_protobuf_DescriptorProto__Output } from './DescriptorProto.js';
import type { EnumDescriptorProto as _google_protobuf_EnumDescriptorProto, EnumDescriptorProto__Output as _google_protobuf_EnumDescriptorProto__Output } from './EnumDescriptorProto.js';
import type { ServiceDescriptorProto as _google_protobuf_ServiceDescriptorProto, ServiceDescriptorProto__Output as _google_protobuf_ServiceDescriptorProto__Output } from './ServiceDescriptorProto.js';
import type { FieldDescriptorProto as _google_protobuf_FieldDescriptorProto, FieldDescriptorProto__Output as _google_protobuf_FieldDescriptorProto__Output } from './FieldDescriptorProto.js';
import type { FileOptions as _google_protobuf_FileOptions, FileOptions__Output as _google_protobuf_FileOptions__Output } from './FileOptions.js';
import type { SourceCodeInfo as _google_protobuf_SourceCodeInfo, SourceCodeInfo__Output as _google_protobuf_SourceCodeInfo__Output } from './SourceCodeInfo.js';
import type { Edition as _google_protobuf_Edition, Edition__Output as _google_protobuf_Edition__Output } from './Edition.js';

export interface FileDescriptorProto {
  'name'?: (string);
  'package'?: (string);
  'dependency'?: (string)[];
  'messageType'?: (_google_protobuf_DescriptorProto)[];
  'enumType'?: (_google_protobuf_EnumDescriptorProto)[];
  'service'?: (_google_protobuf_ServiceDescriptorProto)[];
  'extension'?: (_google_protobuf_FieldDescriptorProto)[];
  'options'?: (_google_protobuf_FileOptions | null);
  'sourceCodeInfo'?: (_google_protobuf_SourceCodeInfo | null);
  'publicDependency'?: (number)[];
  'weakDependency'?: (number)[];
  'syntax'?: (string);
  'edition'?: (_google_protobuf_Edition);
  'optionDependency'?: (string)[];
}

export interface FileDescriptorProto__Output {
  'name'?: (string);
  'package'?: (string);
  'dependency'?: (string)[];
  'messageType'?: (_google_protobuf_DescriptorProto__Output)[];
  'enumType'?: (_google_protobuf_EnumDescriptorProto__Output)[];
  'service'?: (_google_protobuf_ServiceDescriptorProto__Output)[];
  'extension'?: (_google_protobuf_FieldDescriptorProto__Output)[];
  'options'?: (_google_protobuf_FileOptions__Output);
  'sourceCodeInfo'?: (_google_protobuf_SourceCodeInfo__Output);
  'publicDependency'?: (number)[];
  'weakDependency'?: (number)[];
  'syntax'?: (string);
  'edition'?: (_google_protobuf_Edition__Output);
  'optionDependency'?: (string)[];
}
