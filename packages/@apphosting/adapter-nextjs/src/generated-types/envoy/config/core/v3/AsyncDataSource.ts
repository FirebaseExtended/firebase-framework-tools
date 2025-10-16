// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { DataSource as _envoy_config_core_v3_DataSource, DataSource__Output as _envoy_config_core_v3_DataSource__Output } from './DataSource.js';
import type { RemoteDataSource as _envoy_config_core_v3_RemoteDataSource, RemoteDataSource__Output as _envoy_config_core_v3_RemoteDataSource__Output } from './RemoteDataSource.js';

export interface AsyncDataSource {
  'local'?: (_envoy_config_core_v3_DataSource | null);
  'remote'?: (_envoy_config_core_v3_RemoteDataSource | null);
  'specifier'?: "local"|"remote";
}

export interface AsyncDataSource__Output {
  'local'?: (_envoy_config_core_v3_DataSource__Output);
  'remote'?: (_envoy_config_core_v3_RemoteDataSource__Output);
}
