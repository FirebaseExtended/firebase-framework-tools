// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type { HeaderMap as _envoy_config_core_v3_HeaderMap, HeaderMap__Output as _envoy_config_core_v3_HeaderMap__Output } from '../../../config/core/v3/HeaderMap.js';
import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from '../../../../google/protobuf/Struct.js';

export interface HttpHeaders {
  'headers'?: (_envoy_config_core_v3_HeaderMap | null);
  'attributes'?: ({[key: string]: _google_protobuf_Struct});
  'endOfStream'?: (boolean);
}

export interface HttpHeaders__Output {
  'headers'?: (_envoy_config_core_v3_HeaderMap__Output);
  'attributes'?: ({[key: string]: _google_protobuf_Struct__Output});
  'endOfStream'?: (boolean);
}
