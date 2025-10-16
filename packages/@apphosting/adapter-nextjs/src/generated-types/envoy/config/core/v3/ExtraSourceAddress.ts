// Original file: ../../../envoy/api/envoy/config/core/v3/address.proto

import type { SocketAddress as _envoy_config_core_v3_SocketAddress, SocketAddress__Output as _envoy_config_core_v3_SocketAddress__Output } from './SocketAddress.js';
import type { SocketOptionsOverride as _envoy_config_core_v3_SocketOptionsOverride, SocketOptionsOverride__Output as _envoy_config_core_v3_SocketOptionsOverride__Output } from './SocketOptionsOverride.js';

export interface ExtraSourceAddress {
  'address'?: (_envoy_config_core_v3_SocketAddress | null);
  'socketOptions'?: (_envoy_config_core_v3_SocketOptionsOverride | null);
}

export interface ExtraSourceAddress__Output {
  'address'?: (_envoy_config_core_v3_SocketAddress__Output);
  'socketOptions'?: (_envoy_config_core_v3_SocketOptionsOverride__Output);
}
