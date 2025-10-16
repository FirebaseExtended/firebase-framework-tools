// Original file: ../../../envoy/api/envoy/config/core/v3/address.proto

import type { SocketAddress as _envoy_config_core_v3_SocketAddress, SocketAddress__Output as _envoy_config_core_v3_SocketAddress__Output } from './SocketAddress.js';
import type { Pipe as _envoy_config_core_v3_Pipe, Pipe__Output as _envoy_config_core_v3_Pipe__Output } from './Pipe.js';
import type { EnvoyInternalAddress as _envoy_config_core_v3_EnvoyInternalAddress, EnvoyInternalAddress__Output as _envoy_config_core_v3_EnvoyInternalAddress__Output } from './EnvoyInternalAddress.js';

export interface Address {
  'socketAddress'?: (_envoy_config_core_v3_SocketAddress | null);
  'pipe'?: (_envoy_config_core_v3_Pipe | null);
  'envoyInternalAddress'?: (_envoy_config_core_v3_EnvoyInternalAddress | null);
  'address'?: "socketAddress"|"pipe"|"envoyInternalAddress";
}

export interface Address__Output {
  'socketAddress'?: (_envoy_config_core_v3_SocketAddress__Output);
  'pipe'?: (_envoy_config_core_v3_Pipe__Output);
  'envoyInternalAddress'?: (_envoy_config_core_v3_EnvoyInternalAddress__Output);
}
