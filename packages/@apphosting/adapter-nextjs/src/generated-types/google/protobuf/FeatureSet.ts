// Original file: null


// Original file: null

export const _google_protobuf_FeatureSet_VisibilityFeature_DefaultSymbolVisibility = {
  DEFAULT_SYMBOL_VISIBILITY_UNKNOWN: 0,
  EXPORT_ALL: 1,
  EXPORT_TOP_LEVEL: 2,
  LOCAL_ALL: 3,
  STRICT: 4,
} as const;

export type _google_protobuf_FeatureSet_VisibilityFeature_DefaultSymbolVisibility =
  | 'DEFAULT_SYMBOL_VISIBILITY_UNKNOWN'
  | 0
  | 'EXPORT_ALL'
  | 1
  | 'EXPORT_TOP_LEVEL'
  | 2
  | 'LOCAL_ALL'
  | 3
  | 'STRICT'
  | 4

export type _google_protobuf_FeatureSet_VisibilityFeature_DefaultSymbolVisibility__Output = typeof _google_protobuf_FeatureSet_VisibilityFeature_DefaultSymbolVisibility[keyof typeof _google_protobuf_FeatureSet_VisibilityFeature_DefaultSymbolVisibility]

// Original file: null

export const _google_protobuf_FeatureSet_EnforceNamingStyle = {
  ENFORCE_NAMING_STYLE_UNKNOWN: 0,
  STYLE2024: 1,
  STYLE_LEGACY: 2,
} as const;

export type _google_protobuf_FeatureSet_EnforceNamingStyle =
  | 'ENFORCE_NAMING_STYLE_UNKNOWN'
  | 0
  | 'STYLE2024'
  | 1
  | 'STYLE_LEGACY'
  | 2

export type _google_protobuf_FeatureSet_EnforceNamingStyle__Output = typeof _google_protobuf_FeatureSet_EnforceNamingStyle[keyof typeof _google_protobuf_FeatureSet_EnforceNamingStyle]

// Original file: null

export const _google_protobuf_FeatureSet_EnumType = {
  ENUM_TYPE_UNKNOWN: 0,
  OPEN: 1,
  CLOSED: 2,
} as const;

export type _google_protobuf_FeatureSet_EnumType =
  | 'ENUM_TYPE_UNKNOWN'
  | 0
  | 'OPEN'
  | 1
  | 'CLOSED'
  | 2

export type _google_protobuf_FeatureSet_EnumType__Output = typeof _google_protobuf_FeatureSet_EnumType[keyof typeof _google_protobuf_FeatureSet_EnumType]

// Original file: null

export const _google_protobuf_FeatureSet_FieldPresence = {
  FIELD_PRESENCE_UNKNOWN: 0,
  EXPLICIT: 1,
  IMPLICIT: 2,
  LEGACY_REQUIRED: 3,
} as const;

export type _google_protobuf_FeatureSet_FieldPresence =
  | 'FIELD_PRESENCE_UNKNOWN'
  | 0
  | 'EXPLICIT'
  | 1
  | 'IMPLICIT'
  | 2
  | 'LEGACY_REQUIRED'
  | 3

export type _google_protobuf_FeatureSet_FieldPresence__Output = typeof _google_protobuf_FeatureSet_FieldPresence[keyof typeof _google_protobuf_FeatureSet_FieldPresence]

// Original file: null

export const _google_protobuf_FeatureSet_JsonFormat = {
  JSON_FORMAT_UNKNOWN: 0,
  ALLOW: 1,
  LEGACY_BEST_EFFORT: 2,
} as const;

export type _google_protobuf_FeatureSet_JsonFormat =
  | 'JSON_FORMAT_UNKNOWN'
  | 0
  | 'ALLOW'
  | 1
  | 'LEGACY_BEST_EFFORT'
  | 2

export type _google_protobuf_FeatureSet_JsonFormat__Output = typeof _google_protobuf_FeatureSet_JsonFormat[keyof typeof _google_protobuf_FeatureSet_JsonFormat]

// Original file: null

export const _google_protobuf_FeatureSet_MessageEncoding = {
  MESSAGE_ENCODING_UNKNOWN: 0,
  LENGTH_PREFIXED: 1,
  DELIMITED: 2,
} as const;

export type _google_protobuf_FeatureSet_MessageEncoding =
  | 'MESSAGE_ENCODING_UNKNOWN'
  | 0
  | 'LENGTH_PREFIXED'
  | 1
  | 'DELIMITED'
  | 2

export type _google_protobuf_FeatureSet_MessageEncoding__Output = typeof _google_protobuf_FeatureSet_MessageEncoding[keyof typeof _google_protobuf_FeatureSet_MessageEncoding]

// Original file: null

export const _google_protobuf_FeatureSet_RepeatedFieldEncoding = {
  REPEATED_FIELD_ENCODING_UNKNOWN: 0,
  PACKED: 1,
  EXPANDED: 2,
} as const;

export type _google_protobuf_FeatureSet_RepeatedFieldEncoding =
  | 'REPEATED_FIELD_ENCODING_UNKNOWN'
  | 0
  | 'PACKED'
  | 1
  | 'EXPANDED'
  | 2

export type _google_protobuf_FeatureSet_RepeatedFieldEncoding__Output = typeof _google_protobuf_FeatureSet_RepeatedFieldEncoding[keyof typeof _google_protobuf_FeatureSet_RepeatedFieldEncoding]

// Original file: null

export const _google_protobuf_FeatureSet_Utf8Validation = {
  UTF8_VALIDATION_UNKNOWN: 0,
  VERIFY: 2,
  NONE: 3,
} as const;

export type _google_protobuf_FeatureSet_Utf8Validation =
  | 'UTF8_VALIDATION_UNKNOWN'
  | 0
  | 'VERIFY'
  | 2
  | 'NONE'
  | 3

export type _google_protobuf_FeatureSet_Utf8Validation__Output = typeof _google_protobuf_FeatureSet_Utf8Validation[keyof typeof _google_protobuf_FeatureSet_Utf8Validation]

export interface _google_protobuf_FeatureSet_VisibilityFeature {
}

export interface _google_protobuf_FeatureSet_VisibilityFeature__Output {
}

export interface FeatureSet {
  'fieldPresence'?: (_google_protobuf_FeatureSet_FieldPresence);
  'enumType'?: (_google_protobuf_FeatureSet_EnumType);
  'repeatedFieldEncoding'?: (_google_protobuf_FeatureSet_RepeatedFieldEncoding);
  'utf8Validation'?: (_google_protobuf_FeatureSet_Utf8Validation);
  'messageEncoding'?: (_google_protobuf_FeatureSet_MessageEncoding);
  'jsonFormat'?: (_google_protobuf_FeatureSet_JsonFormat);
  'enforceNamingStyle'?: (_google_protobuf_FeatureSet_EnforceNamingStyle);
  'defaultSymbolVisibility'?: (_google_protobuf_FeatureSet_VisibilityFeature_DefaultSymbolVisibility);
}

export interface FeatureSet__Output {
  'fieldPresence'?: (_google_protobuf_FeatureSet_FieldPresence__Output);
  'enumType'?: (_google_protobuf_FeatureSet_EnumType__Output);
  'repeatedFieldEncoding'?: (_google_protobuf_FeatureSet_RepeatedFieldEncoding__Output);
  'utf8Validation'?: (_google_protobuf_FeatureSet_Utf8Validation__Output);
  'messageEncoding'?: (_google_protobuf_FeatureSet_MessageEncoding__Output);
  'jsonFormat'?: (_google_protobuf_FeatureSet_JsonFormat__Output);
  'enforceNamingStyle'?: (_google_protobuf_FeatureSet_EnforceNamingStyle__Output);
  'defaultSymbolVisibility'?: (_google_protobuf_FeatureSet_VisibilityFeature_DefaultSymbolVisibility__Output);
}
