// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { BackoffStrategy as _envoy_config_core_v3_BackoffStrategy, BackoffStrategy__Output as _envoy_config_core_v3_BackoffStrategy__Output } from './BackoffStrategy.js';
import type { UInt32Value as _google_protobuf_UInt32Value, UInt32Value__Output as _google_protobuf_UInt32Value__Output } from '../../../../google/protobuf/UInt32Value.js';
import type { Any as _google_protobuf_Any, Any__Output as _google_protobuf_Any__Output } from '../../../../google/protobuf/Any.js';
import type { Long } from '@grpc/proto-loader';

export interface _envoy_config_core_v3_RetryPolicy_RetryHostPredicate {
  'name'?: (string);
  'typedConfig'?: (_google_protobuf_Any | null);
  'configType'?: "typedConfig";
}

export interface _envoy_config_core_v3_RetryPolicy_RetryHostPredicate__Output {
  'name'?: (string);
  'typedConfig'?: (_google_protobuf_Any__Output);
}

export interface _envoy_config_core_v3_RetryPolicy_RetryPriority {
  'name'?: (string);
  'typedConfig'?: (_google_protobuf_Any | null);
  'configType'?: "typedConfig";
}

export interface _envoy_config_core_v3_RetryPolicy_RetryPriority__Output {
  'name'?: (string);
  'typedConfig'?: (_google_protobuf_Any__Output);
}

export interface RetryPolicy {
  'retryBackOff'?: (_envoy_config_core_v3_BackoffStrategy | null);
  'numRetries'?: (_google_protobuf_UInt32Value | null);
  'retryOn'?: (string);
  'retryPriority'?: (_envoy_config_core_v3_RetryPolicy_RetryPriority | null);
  'retryHostPredicate'?: (_envoy_config_core_v3_RetryPolicy_RetryHostPredicate)[];
  'hostSelectionRetryMaxAttempts'?: (number | string | Long);
}

export interface RetryPolicy__Output {
  'retryBackOff'?: (_envoy_config_core_v3_BackoffStrategy__Output);
  'numRetries'?: (_google_protobuf_UInt32Value__Output);
  'retryOn'?: (string);
  'retryPriority'?: (_envoy_config_core_v3_RetryPolicy_RetryPriority__Output);
  'retryHostPredicate'?: (_envoy_config_core_v3_RetryPolicy_RetryHostPredicate__Output)[];
  'hostSelectionRetryMaxAttempts'?: (Long);
}
