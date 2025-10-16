// Original file: ../../../envoy/api/envoy/config/core/v3/socket_option.proto

import type { Long } from '@grpc/proto-loader';

export interface _envoy_config_core_v3_SocketOption_SocketType_Datagram {
}

export interface _envoy_config_core_v3_SocketOption_SocketType_Datagram__Output {
}

// Original file: ../../../envoy/api/envoy/config/core/v3/socket_option.proto

export const _envoy_config_core_v3_SocketOption_SocketState = {
  STATE_PREBIND: 0,
  STATE_BOUND: 1,
  STATE_LISTENING: 2,
} as const;

export type _envoy_config_core_v3_SocketOption_SocketState =
  | 'STATE_PREBIND'
  | 0
  | 'STATE_BOUND'
  | 1
  | 'STATE_LISTENING'
  | 2

export type _envoy_config_core_v3_SocketOption_SocketState__Output = typeof _envoy_config_core_v3_SocketOption_SocketState[keyof typeof _envoy_config_core_v3_SocketOption_SocketState]

export interface _envoy_config_core_v3_SocketOption_SocketType {
  'stream'?: (_envoy_config_core_v3_SocketOption_SocketType_Stream | null);
  'datagram'?: (_envoy_config_core_v3_SocketOption_SocketType_Datagram | null);
}

export interface _envoy_config_core_v3_SocketOption_SocketType__Output {
  'stream'?: (_envoy_config_core_v3_SocketOption_SocketType_Stream__Output);
  'datagram'?: (_envoy_config_core_v3_SocketOption_SocketType_Datagram__Output);
}

export interface _envoy_config_core_v3_SocketOption_SocketType_Stream {
}

export interface _envoy_config_core_v3_SocketOption_SocketType_Stream__Output {
}

export interface SocketOption {
  'description'?: (string);
  'level'?: (number | string | Long);
  'name'?: (number | string | Long);
  'intValue'?: (number | string | Long);
  'bufValue'?: (Buffer | Uint8Array | string);
  'state'?: (_envoy_config_core_v3_SocketOption_SocketState);
  'type'?: (_envoy_config_core_v3_SocketOption_SocketType | null);
  'value'?: "intValue"|"bufValue";
}

export interface SocketOption__Output {
  'description'?: (string);
  'level'?: (Long);
  'name'?: (Long);
  'intValue'?: (Long);
  'bufValue'?: (Buffer);
  'state'?: (_envoy_config_core_v3_SocketOption_SocketState__Output);
  'type'?: (_envoy_config_core_v3_SocketOption_SocketType__Output);
}
