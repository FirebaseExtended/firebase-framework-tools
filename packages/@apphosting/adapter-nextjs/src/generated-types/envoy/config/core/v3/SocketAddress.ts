// Original file: ../../../envoy/api/envoy/config/core/v3/address.proto


// Original file: ../../../envoy/api/envoy/config/core/v3/address.proto

export const _envoy_config_core_v3_SocketAddress_Protocol = {
  TCP: 0,
  UDP: 1,
} as const;

export type _envoy_config_core_v3_SocketAddress_Protocol =
  | 'TCP'
  | 0
  | 'UDP'
  | 1

export type _envoy_config_core_v3_SocketAddress_Protocol__Output = typeof _envoy_config_core_v3_SocketAddress_Protocol[keyof typeof _envoy_config_core_v3_SocketAddress_Protocol]

export interface SocketAddress {
  'protocol'?: (_envoy_config_core_v3_SocketAddress_Protocol);
  'address'?: (string);
  'portValue'?: (number);
  'namedPort'?: (string);
  'resolverName'?: (string);
  'ipv4Compat'?: (boolean);
  'networkNamespaceFilepath'?: (string);
  'portSpecifier'?: "portValue"|"namedPort";
}

export interface SocketAddress__Output {
  'protocol'?: (_envoy_config_core_v3_SocketAddress_Protocol__Output);
  'address'?: (string);
  'portValue'?: (number);
  'namedPort'?: (string);
  'resolverName'?: (string);
  'ipv4Compat'?: (boolean);
  'networkNamespaceFilepath'?: (string);
}
