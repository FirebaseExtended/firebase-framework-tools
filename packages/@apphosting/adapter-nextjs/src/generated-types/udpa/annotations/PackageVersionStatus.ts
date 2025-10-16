// Original file: ../../../udpa/udpa/annotations/status.proto

export const PackageVersionStatus = {
  UNKNOWN: 0,
  FROZEN: 1,
  ACTIVE: 2,
  NEXT_MAJOR_VERSION_CANDIDATE: 3,
} as const;

export type PackageVersionStatus =
  | 'UNKNOWN'
  | 0
  | 'FROZEN'
  | 1
  | 'ACTIVE'
  | 2
  | 'NEXT_MAJOR_VERSION_CANDIDATE'
  | 3

export type PackageVersionStatus__Output = typeof PackageVersionStatus[keyof typeof PackageVersionStatus]
