// Original file: ../../../protoc-gen-validate/validate/validate.proto

export const KnownRegex = {
  UNKNOWN: 0,
  HTTP_HEADER_NAME: 1,
  HTTP_HEADER_VALUE: 2,
} as const;

export type KnownRegex =
  | 'UNKNOWN'
  | 0
  | 'HTTP_HEADER_NAME'
  | 1
  | 'HTTP_HEADER_VALUE'
  | 2

export type KnownRegex__Output = typeof KnownRegex[keyof typeof KnownRegex]
