// Original file: null

import type { MethodDescriptorProto as _google_protobuf_MethodDescriptorProto, MethodDescriptorProto__Output as _google_protobuf_MethodDescriptorProto__Output } from './MethodDescriptorProto.js';
import type { ServiceOptions as _google_protobuf_ServiceOptions, ServiceOptions__Output as _google_protobuf_ServiceOptions__Output } from './ServiceOptions.js';

export interface ServiceDescriptorProto {
  'name'?: (string);
  'method'?: (_google_protobuf_MethodDescriptorProto)[];
  'options'?: (_google_protobuf_ServiceOptions | null);
}

export interface ServiceDescriptorProto__Output {
  'name'?: (string);
  'method'?: (_google_protobuf_MethodDescriptorProto__Output)[];
  'options'?: (_google_protobuf_ServiceOptions__Output);
}
