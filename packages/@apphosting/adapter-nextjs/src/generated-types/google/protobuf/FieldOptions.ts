// Original file: null

import type { FeatureSet as _google_protobuf_FeatureSet, FeatureSet__Output as _google_protobuf_FeatureSet__Output } from './FeatureSet.js';
import type { UninterpretedOption as _google_protobuf_UninterpretedOption, UninterpretedOption__Output as _google_protobuf_UninterpretedOption__Output } from './UninterpretedOption.js';
import type { FieldRules as _validate_FieldRules, FieldRules__Output as _validate_FieldRules__Output } from '../../validate/FieldRules.js';
import type { FieldMigrateAnnotation as _udpa_annotations_FieldMigrateAnnotation, FieldMigrateAnnotation__Output as _udpa_annotations_FieldMigrateAnnotation__Output } from '../../udpa/annotations/FieldMigrateAnnotation.js';
import type { FieldStatusAnnotation as _xds_annotations_v3_FieldStatusAnnotation, FieldStatusAnnotation__Output as _xds_annotations_v3_FieldStatusAnnotation__Output } from '../../xds/annotations/v3/FieldStatusAnnotation.js';
import type { Edition as _google_protobuf_Edition, Edition__Output as _google_protobuf_Edition__Output } from './Edition.js';

// Original file: null

export const _google_protobuf_FieldOptions_CType = {
  STRING: 0,
  CORD: 1,
  STRING_PIECE: 2,
} as const;

export type _google_protobuf_FieldOptions_CType =
  | 'STRING'
  | 0
  | 'CORD'
  | 1
  | 'STRING_PIECE'
  | 2

export type _google_protobuf_FieldOptions_CType__Output = typeof _google_protobuf_FieldOptions_CType[keyof typeof _google_protobuf_FieldOptions_CType]

export interface _google_protobuf_FieldOptions_EditionDefault {
  'edition'?: (_google_protobuf_Edition);
  'value'?: (string);
}

export interface _google_protobuf_FieldOptions_EditionDefault__Output {
  'edition'?: (_google_protobuf_Edition__Output);
  'value'?: (string);
}

export interface _google_protobuf_FieldOptions_FeatureSupport {
  'editionIntroduced'?: (_google_protobuf_Edition);
  'editionDeprecated'?: (_google_protobuf_Edition);
  'deprecationWarning'?: (string);
  'editionRemoved'?: (_google_protobuf_Edition);
}

export interface _google_protobuf_FieldOptions_FeatureSupport__Output {
  'editionIntroduced'?: (_google_protobuf_Edition__Output);
  'editionDeprecated'?: (_google_protobuf_Edition__Output);
  'deprecationWarning'?: (string);
  'editionRemoved'?: (_google_protobuf_Edition__Output);
}

// Original file: null

export const _google_protobuf_FieldOptions_JSType = {
  JS_NORMAL: 0,
  JS_STRING: 1,
  JS_NUMBER: 2,
} as const;

export type _google_protobuf_FieldOptions_JSType =
  | 'JS_NORMAL'
  | 0
  | 'JS_STRING'
  | 1
  | 'JS_NUMBER'
  | 2

export type _google_protobuf_FieldOptions_JSType__Output = typeof _google_protobuf_FieldOptions_JSType[keyof typeof _google_protobuf_FieldOptions_JSType]

// Original file: null

export const _google_protobuf_FieldOptions_OptionRetention = {
  RETENTION_UNKNOWN: 0,
  RETENTION_RUNTIME: 1,
  RETENTION_SOURCE: 2,
} as const;

export type _google_protobuf_FieldOptions_OptionRetention =
  | 'RETENTION_UNKNOWN'
  | 0
  | 'RETENTION_RUNTIME'
  | 1
  | 'RETENTION_SOURCE'
  | 2

export type _google_protobuf_FieldOptions_OptionRetention__Output = typeof _google_protobuf_FieldOptions_OptionRetention[keyof typeof _google_protobuf_FieldOptions_OptionRetention]

// Original file: null

export const _google_protobuf_FieldOptions_OptionTargetType = {
  TARGET_TYPE_UNKNOWN: 0,
  TARGET_TYPE_FILE: 1,
  TARGET_TYPE_EXTENSION_RANGE: 2,
  TARGET_TYPE_MESSAGE: 3,
  TARGET_TYPE_FIELD: 4,
  TARGET_TYPE_ONEOF: 5,
  TARGET_TYPE_ENUM: 6,
  TARGET_TYPE_ENUM_ENTRY: 7,
  TARGET_TYPE_SERVICE: 8,
  TARGET_TYPE_METHOD: 9,
} as const;

export type _google_protobuf_FieldOptions_OptionTargetType =
  | 'TARGET_TYPE_UNKNOWN'
  | 0
  | 'TARGET_TYPE_FILE'
  | 1
  | 'TARGET_TYPE_EXTENSION_RANGE'
  | 2
  | 'TARGET_TYPE_MESSAGE'
  | 3
  | 'TARGET_TYPE_FIELD'
  | 4
  | 'TARGET_TYPE_ONEOF'
  | 5
  | 'TARGET_TYPE_ENUM'
  | 6
  | 'TARGET_TYPE_ENUM_ENTRY'
  | 7
  | 'TARGET_TYPE_SERVICE'
  | 8
  | 'TARGET_TYPE_METHOD'
  | 9

export type _google_protobuf_FieldOptions_OptionTargetType__Output = typeof _google_protobuf_FieldOptions_OptionTargetType[keyof typeof _google_protobuf_FieldOptions_OptionTargetType]

export interface FieldOptions {
  'ctype'?: (_google_protobuf_FieldOptions_CType);
  'packed'?: (boolean);
  'deprecated'?: (boolean);
  'lazy'?: (boolean);
  'jstype'?: (_google_protobuf_FieldOptions_JSType);
  'weak'?: (boolean);
  'unverifiedLazy'?: (boolean);
  'debugRedact'?: (boolean);
  'retention'?: (_google_protobuf_FieldOptions_OptionRetention);
  'targets'?: (_google_protobuf_FieldOptions_OptionTargetType)[];
  'editionDefaults'?: (_google_protobuf_FieldOptions_EditionDefault)[];
  'features'?: (_google_protobuf_FeatureSet | null);
  'featureSupport'?: (_google_protobuf_FieldOptions_FeatureSupport | null);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption)[];
  '.validate.rules'?: (_validate_FieldRules | null);
  '.envoy.annotations.deprecatedAtMinorVersion'?: (string);
  '.udpa.annotations.fieldMigrate'?: (_udpa_annotations_FieldMigrateAnnotation | null);
  '.envoy.annotations.disallowedByDefault'?: (boolean);
  '.xds.annotations.v3.fieldStatus'?: (_xds_annotations_v3_FieldStatusAnnotation | null);
}

export interface FieldOptions__Output {
  'ctype'?: (_google_protobuf_FieldOptions_CType__Output);
  'packed'?: (boolean);
  'deprecated'?: (boolean);
  'lazy'?: (boolean);
  'jstype'?: (_google_protobuf_FieldOptions_JSType__Output);
  'weak'?: (boolean);
  'unverifiedLazy'?: (boolean);
  'debugRedact'?: (boolean);
  'retention'?: (_google_protobuf_FieldOptions_OptionRetention__Output);
  'targets'?: (_google_protobuf_FieldOptions_OptionTargetType__Output)[];
  'editionDefaults'?: (_google_protobuf_FieldOptions_EditionDefault__Output)[];
  'features'?: (_google_protobuf_FeatureSet__Output);
  'featureSupport'?: (_google_protobuf_FieldOptions_FeatureSupport__Output);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption__Output)[];
  '.validate.rules'?: (_validate_FieldRules__Output);
  '.envoy.annotations.deprecatedAtMinorVersion'?: (string);
  '.udpa.annotations.fieldMigrate'?: (_udpa_annotations_FieldMigrateAnnotation__Output);
  '.envoy.annotations.disallowedByDefault'?: (boolean);
  '.xds.annotations.v3.fieldStatus'?: (_xds_annotations_v3_FieldStatusAnnotation__Output);
}
