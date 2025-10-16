// Original file: ../../../envoy/api/envoy/config/core/v3/address.proto

import type { SocketAddress as _envoy_config_core_v3_SocketAddress, SocketAddress__Output as _envoy_config_core_v3_SocketAddress__Output } from './SocketAddress.js';
import type { BoolValue as _google_protobuf_BoolValue, BoolValue__Output as _google_protobuf_BoolValue__Output } from '../../../../google/protobuf/BoolValue.js';
import type { SocketOption as _envoy_config_core_v3_SocketOption, SocketOption__Output as _envoy_config_core_v3_SocketOption__Output } from './SocketOption.js';
import type { ExtraSourceAddress as _envoy_config_core_v3_ExtraSourceAddress, ExtraSourceAddress__Output as _envoy_config_core_v3_ExtraSourceAddress__Output } from './ExtraSourceAddress.js';
import type { TypedExtensionConfig as _envoy_config_core_v3_TypedExtensionConfig, TypedExtensionConfig__Output as _envoy_config_core_v3_TypedExtensionConfig__Output } from './TypedExtensionConfig.js';

export interface BindConfig {
  'sourceAddress'?: (_envoy_config_core_v3_SocketAddress | null);
  'freebind'?: (_google_protobuf_BoolValue | null);
  'socketOptions'?: (_envoy_config_core_v3_SocketOption)[];
  'additionalSourceAddresses'?: (_envoy_config_core_v3_SocketAddress)[];
  'extraSourceAddresses'?: (_envoy_config_core_v3_ExtraSourceAddress)[];
  'localAddressSelector'?: (_envoy_config_core_v3_TypedExtensionConfig | null);
}

export interface BindConfig__Output {
  'sourceAddress'?: (_envoy_config_core_v3_SocketAddress__Output);
  'freebind'?: (_google_protobuf_BoolValue__Output);
  'socketOptions'?: (_envoy_config_core_v3_SocketOption__Output)[];
  'additionalSourceAddresses'?: (_envoy_config_core_v3_SocketAddress__Output)[];
  'extraSourceAddresses'?: (_envoy_config_core_v3_ExtraSourceAddress__Output)[];
  'localAddressSelector'?: (_envoy_config_core_v3_TypedExtensionConfig__Output);
}
