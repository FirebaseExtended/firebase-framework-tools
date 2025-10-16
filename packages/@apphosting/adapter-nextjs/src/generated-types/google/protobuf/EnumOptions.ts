// Original file: null

import type { FeatureSet as _google_protobuf_FeatureSet, FeatureSet__Output as _google_protobuf_FeatureSet__Output } from './FeatureSet.js';
import type { UninterpretedOption as _google_protobuf_UninterpretedOption, UninterpretedOption__Output as _google_protobuf_UninterpretedOption__Output } from './UninterpretedOption.js';
import type { MigrateAnnotation as _udpa_annotations_MigrateAnnotation, MigrateAnnotation__Output as _udpa_annotations_MigrateAnnotation__Output } from '../../udpa/annotations/MigrateAnnotation.js';

export interface EnumOptions {
  'allowAlias'?: (boolean);
  'deprecated'?: (boolean);
  'deprecatedLegacyJsonFieldConflicts'?: (boolean);
  'features'?: (_google_protobuf_FeatureSet | null);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption)[];
  '.udpa.annotations.enumMigrate'?: (_udpa_annotations_MigrateAnnotation | null);
}

export interface EnumOptions__Output {
  'allowAlias'?: (boolean);
  'deprecated'?: (boolean);
  'deprecatedLegacyJsonFieldConflicts'?: (boolean);
  'features'?: (_google_protobuf_FeatureSet__Output);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption__Output)[];
  '.udpa.annotations.enumMigrate'?: (_udpa_annotations_MigrateAnnotation__Output);
}
