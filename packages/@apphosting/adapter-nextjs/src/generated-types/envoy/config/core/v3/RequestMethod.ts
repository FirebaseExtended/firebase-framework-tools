// Original file: ../../../envoy/api/envoy/config/core/v3/base.proto

export const RequestMethod = {
  METHOD_UNSPECIFIED: 0,
  GET: 1,
  HEAD: 2,
  POST: 3,
  PUT: 4,
  DELETE: 5,
  CONNECT: 6,
  OPTIONS: 7,
  TRACE: 8,
  PATCH: 9,
} as const;

export type RequestMethod =
  | 'METHOD_UNSPECIFIED'
  | 0
  | 'GET'
  | 1
  | 'HEAD'
  | 2
  | 'POST'
  | 3
  | 'PUT'
  | 4
  | 'DELETE'
  | 5
  | 'CONNECT'
  | 6
  | 'OPTIONS'
  | 7
  | 'TRACE'
  | 8
  | 'PATCH'
  | 9

export type RequestMethod__Output = typeof RequestMethod[keyof typeof RequestMethod]
