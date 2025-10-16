// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { Struct as _google_protobuf_Struct, Struct__Output as _google_protobuf_Struct__Output } from '../../../../google/protobuf/Struct.js';
import type { Locality as _envoy_config_core_v3_Locality, Locality__Output as _envoy_config_core_v3_Locality__Output } from './Locality.js';
import type { BuildVersion as _envoy_config_core_v3_BuildVersion, BuildVersion__Output as _envoy_config_core_v3_BuildVersion__Output } from './BuildVersion.js';
import type { Extension as _envoy_config_core_v3_Extension, Extension__Output as _envoy_config_core_v3_Extension__Output } from './Extension.js';
import type { Address as _envoy_config_core_v3_Address, Address__Output as _envoy_config_core_v3_Address__Output } from './Address.js';
import type { ContextParams as _xds_core_v3_ContextParams, ContextParams__Output as _xds_core_v3_ContextParams__Output } from '../../../../xds/core/v3/ContextParams.js';

export interface Node {
  'id'?: (string);
  'cluster'?: (string);
  'metadata'?: (_google_protobuf_Struct | null);
  'locality'?: (_envoy_config_core_v3_Locality | null);
  'userAgentName'?: (string);
  'userAgentVersion'?: (string);
  'userAgentBuildVersion'?: (_envoy_config_core_v3_BuildVersion | null);
  'extensions'?: (_envoy_config_core_v3_Extension)[];
  'clientFeatures'?: (string)[];
  'listeningAddresses'?: (_envoy_config_core_v3_Address)[];
  'dynamicParameters'?: ({[key: string]: _xds_core_v3_ContextParams});
  'userAgentVersionType'?: "userAgentVersion"|"userAgentBuildVersion";
}

export interface Node__Output {
  'id'?: (string);
  'cluster'?: (string);
  'metadata'?: (_google_protobuf_Struct__Output);
  'locality'?: (_envoy_config_core_v3_Locality__Output);
  'userAgentName'?: (string);
  'userAgentVersion'?: (string);
  'userAgentBuildVersion'?: (_envoy_config_core_v3_BuildVersion__Output);
  'extensions'?: (_envoy_config_core_v3_Extension__Output)[];
  'clientFeatures'?: (string)[];
  'listeningAddresses'?: (_envoy_config_core_v3_Address__Output)[];
  'dynamicParameters'?: ({[key: string]: _xds_core_v3_ContextParams__Output});
}
