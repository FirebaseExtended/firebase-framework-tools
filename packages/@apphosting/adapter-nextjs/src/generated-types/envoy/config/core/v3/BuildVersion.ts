// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { SemanticVersion as _envoy_type_v3_SemanticVersion, SemanticVersion__Output as _envoy_type_v3_SemanticVersion__Output } from '../../../type/v3/SemanticVersion.js';
import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from '../../../../google/protobuf/Struct.js';

export interface BuildVersion {
  'version'?: (_envoy_type_v3_SemanticVersion | null);
  'metadata'?: (_google_protobuf_Struct | null);
}

export interface BuildVersion__Output {
  'version'?: (_envoy_type_v3_SemanticVersion__Output);
  'metadata'?: (_google_protobuf_Struct__Output);
}
