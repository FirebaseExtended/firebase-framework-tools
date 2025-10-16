// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

export const RoutingPriority = {
  DEFAULT: 0,
  HIGH: 1,
} as const;

export type RoutingPriority =
  | 'DEFAULT'
  | 0
  | 'HIGH'
  | 1

export type RoutingPriority__Output = typeof RoutingPriority[keyof typeof RoutingPriority]
