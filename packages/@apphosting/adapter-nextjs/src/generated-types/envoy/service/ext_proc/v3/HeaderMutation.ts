// Original file: ../../../envoy/api/envoy/service/ext_proc/v3/external_processor.proto

import type { HeaderValueOption as _envoy_config_core_v3_HeaderValueOption, HeaderValueOption__Output as _envoy_config_core_v3_HeaderValueOption__Output } from '../../../config/core/v3/HeaderValueOption.js';

export interface HeaderMutation {
  'setHeaders'?: (_envoy_config_core_v3_HeaderValueOption)[];
  'removeHeaders'?: (string)[];
}

export interface HeaderMutation__Output {
  'setHeaders'?: (_envoy_config_core_v3_HeaderValueOption__Output)[];
  'removeHeaders'?: (string)[];
}
