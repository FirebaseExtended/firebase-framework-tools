// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

import type { WatchedDirectory as _envoy_config_core_v3_WatchedDirectory, WatchedDirectory__Output as _envoy_config_core_v3_WatchedDirectory__Output } from './WatchedDirectory.js';

export interface DataSource {
  'filename'?: (string);
  'inlineBytes'?: (Buffer | Uint8Array | string);
  'inlineString'?: (string);
  'environmentVariable'?: (string);
  'watchedDirectory'?: (_envoy_config_core_v3_WatchedDirectory | null);
  'specifier'?: "filename"|"inlineBytes"|"inlineString"|"environmentVariable";
}

export interface DataSource__Output {
  'filename'?: (string);
  'inlineBytes'?: (Buffer);
  'inlineString'?: (string);
  'environmentVariable'?: (string);
  'watchedDirectory'?: (_envoy_config_core_v3_WatchedDirectory__Output);
}
