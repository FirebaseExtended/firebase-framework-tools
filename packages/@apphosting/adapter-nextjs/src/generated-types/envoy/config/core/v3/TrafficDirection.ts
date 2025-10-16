// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

export const TrafficDirection = {
  UNSPECIFIED: 0,
  INBOUND: 1,
  OUTBOUND: 2,
} as const;

export type TrafficDirection =
  | 'UNSPECIFIED'
  | 0
  | 'INBOUND'
  | 1
  | 'OUTBOUND'
  | 2

export type TrafficDirection__Output = typeof TrafficDirection[keyof typeof TrafficDirection]
