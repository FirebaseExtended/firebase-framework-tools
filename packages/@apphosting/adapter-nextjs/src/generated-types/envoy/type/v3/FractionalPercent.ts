// Original file: ../../../envoy/api/envoy/type/v3/percent.proto


// Original file: ../../../envoy/api/envoy/type/v3/percent.proto

export const _envoy_type_v3_FractionalPercent_DenominatorType = {
  HUNDRED: 0,
  TEN_THOUSAND: 1,
  MILLION: 2,
} as const;

export type _envoy_type_v3_FractionalPercent_DenominatorType =
  | 'HUNDRED'
  | 0
  | 'TEN_THOUSAND'
  | 1
  | 'MILLION'
  | 2

export type _envoy_type_v3_FractionalPercent_DenominatorType__Output = typeof _envoy_type_v3_FractionalPercent_DenominatorType[keyof typeof _envoy_type_v3_FractionalPercent_DenominatorType]

export interface FractionalPercent {
  'numerator'?: (number);
  'denominator'?: (_envoy_type_v3_FractionalPercent_DenominatorType);
}

export interface FractionalPercent__Output {
  'numerator'?: (number);
  'denominator'?: (_envoy_type_v3_FractionalPercent_DenominatorType__Output);
}
