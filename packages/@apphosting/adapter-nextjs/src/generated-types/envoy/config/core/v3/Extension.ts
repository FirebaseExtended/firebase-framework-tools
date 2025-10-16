// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { BuildVersion as _envoy_config_core_v3_BuildVersion, BuildVersion__Output as _envoy_config_core_v3_BuildVersion__Output } from './BuildVersion.js';

export interface Extension {
  'name'?: (string);
  'category'?: (string);
  'typeDescriptor'?: (string);
  'version'?: (_envoy_config_core_v3_BuildVersion | null);
  'disabled'?: (boolean);
  'typeUrls'?: (string)[];
}

export interface Extension__Output {
  'name'?: (string);
  'category'?: (string);
  'typeDescriptor'?: (string);
  'version'?: (_envoy_config_core_v3_BuildVersion__Output);
  'disabled'?: (boolean);
  'typeUrls'?: (string)[];
}
