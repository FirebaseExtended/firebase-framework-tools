// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { KeyValueAppend as _envoy_config_core_v3_KeyValueAppend, KeyValueAppend__Output as _envoy_config_core_v3_KeyValueAppend__Output } from './KeyValueAppend.js';

export interface KeyValueMutation {
  'append'?: (_envoy_config_core_v3_KeyValueAppend | null);
  'remove'?: (string);
}

export interface KeyValueMutation__Output {
  'append'?: (_envoy_config_core_v3_KeyValueAppend__Output);
  'remove'?: (string);
}
