// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from '../../../../google/protobuf/Struct.js';
import type { Any as _google_protobuf_Any, Any__Output as _google_protobuf_Any__Output } from '../../../../google/protobuf/Any.js';

export interface Metadata {
  'filterMetadata'?: ({[key: string]: _google_protobuf_Struct});
  'typedFilterMetadata'?: ({[key: string]: _google_protobuf_Any});
}

export interface Metadata__Output {
  'filterMetadata'?: ({[key: string]: _google_protobuf_Struct__Output});
  'typedFilterMetadata'?: ({[key: string]: _google_protobuf_Any__Output});
}
