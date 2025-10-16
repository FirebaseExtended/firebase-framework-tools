// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { HttpUri as _envoy_config_core_v3_HttpUri, HttpUri__Output as _envoy_config_core_v3_HttpUri__Output } from './HttpUri.js';
import type { RetryPolicy as _envoy_config_core_v3_RetryPolicy, RetryPolicy__Output as _envoy_config_core_v3_RetryPolicy__Output } from './RetryPolicy.js';

export interface RemoteDataSource {
  'httpUri'?: (_envoy_config_core_v3_HttpUri | null);
  'sha256'?: (string);
  'retryPolicy'?: (_envoy_config_core_v3_RetryPolicy | null);
}

export interface RemoteDataSource__Output {
  'httpUri'?: (_envoy_config_core_v3_HttpUri__Output);
  'sha256'?: (string);
  'retryPolicy'?: (_envoy_config_core_v3_RetryPolicy__Output);
}
