// Original file: null

import type { FeatureSet as _google_protobuf_FeatureSet, FeatureSet__Output as _google_protobuf_FeatureSet__Output } from './FeatureSet.js';
import type { _google_protobuf_FieldOptions_FeatureSupport, _google_protobuf_FieldOptions_FeatureSupport__Output } from './FieldOptions.js';
import type { UninterpretedOption as _google_protobuf_UninterpretedOption, UninterpretedOption__Output as _google_protobuf_UninterpretedOption__Output } from './UninterpretedOption.js';
import type { MigrateAnnotation as _udpa_annotations_MigrateAnnotation, MigrateAnnotation__Output as _udpa_annotations_MigrateAnnotation__Output } from '../../udpa/annotations/MigrateAnnotation.js';

export interface EnumValueOptions {
  'deprecated'?: (boolean);
  'features'?: (_google_protobuf_FeatureSet | null);
  'debugRedact'?: (boolean);
  'featureSupport'?: (_google_protobuf_FieldOptions_FeatureSupport | null);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption)[];
  '.envoy.annotations.disallowedByDefaultEnum'?: (boolean);
  '.udpa.annotations.enumValueMigrate'?: (_udpa_annotations_MigrateAnnotation | null);
  '.envoy.annotations.deprecatedAtMinorVersionEnum'?: (string);
}

export interface EnumValueOptions__Output {
  'deprecated'?: (boolean);
  'features'?: (_google_protobuf_FeatureSet__Output);
  'debugRedact'?: (boolean);
  'featureSupport'?: (_google_protobuf_FieldOptions_FeatureSupport__Output);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption__Output)[];
  '.envoy.annotations.disallowedByDefaultEnum'?: (boolean);
  '.udpa.annotations.enumValueMigrate'?: (_udpa_annotations_MigrateAnnotation__Output);
  '.envoy.annotations.deprecatedAtMinorVersionEnum'?: (string);
}
