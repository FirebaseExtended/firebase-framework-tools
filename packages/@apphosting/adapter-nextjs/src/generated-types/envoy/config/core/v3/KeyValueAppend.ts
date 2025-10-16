// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { KeyValue as _envoy_config_core_v3_KeyValue, KeyValue__Output as _envoy_config_core_v3_KeyValue__Output } from './KeyValue.js';
import type { KeyValuePair as _envoy_config_core_v3_KeyValuePair, KeyValuePair__Output as _envoy_config_core_v3_KeyValuePair__Output } from './KeyValuePair.js';

// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

export const _envoy_config_core_v3_KeyValueAppend_KeyValueAppendAction = {
  APPEND_IF_EXISTS_OR_ADD: 0,
  ADD_IF_ABSENT: 1,
  OVERWRITE_IF_EXISTS_OR_ADD: 2,
  OVERWRITE_IF_EXISTS: 3,
} as const;

export type _envoy_config_core_v3_KeyValueAppend_KeyValueAppendAction =
  | 'APPEND_IF_EXISTS_OR_ADD'
  | 0
  | 'ADD_IF_ABSENT'
  | 1
  | 'OVERWRITE_IF_EXISTS_OR_ADD'
  | 2
  | 'OVERWRITE_IF_EXISTS'
  | 3

export type _envoy_config_core_v3_KeyValueAppend_KeyValueAppendAction__Output = typeof _envoy_config_core_v3_KeyValueAppend_KeyValueAppendAction[keyof typeof _envoy_config_core_v3_KeyValueAppend_KeyValueAppendAction]

export interface KeyValueAppend {
  'entry'?: (_envoy_config_core_v3_KeyValue | null);
  'action'?: (_envoy_config_core_v3_KeyValueAppend_KeyValueAppendAction);
  'record'?: (_envoy_config_core_v3_KeyValuePair | null);
}

export interface KeyValueAppend__Output {
  'entry'?: (_envoy_config_core_v3_KeyValue__Output);
  'action'?: (_envoy_config_core_v3_KeyValueAppend_KeyValueAppendAction__Output);
  'record'?: (_envoy_config_core_v3_KeyValuePair__Output);
}
