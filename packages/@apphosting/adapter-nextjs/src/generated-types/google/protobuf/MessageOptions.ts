// Original file: null

import type { FeatureSet as _google_protobuf_FeatureSet, FeatureSet__Output as _google_protobuf_FeatureSet__Output } from './FeatureSet.js';
import type { UninterpretedOption as _google_protobuf_UninterpretedOption, UninterpretedOption__Output as _google_protobuf_UninterpretedOption__Output } from './UninterpretedOption.js';
import type { VersioningAnnotation as _udpa_annotations_VersioningAnnotation, VersioningAnnotation__Output as _udpa_annotations_VersioningAnnotation__Output } from '../../udpa/annotations/VersioningAnnotation.js';
import type { MigrateAnnotation as _udpa_annotations_MigrateAnnotation, MigrateAnnotation__Output as _udpa_annotations_MigrateAnnotation__Output } from '../../udpa/annotations/MigrateAnnotation.js';
import type { MessageStatusAnnotation as _xds_annotations_v3_MessageStatusAnnotation, MessageStatusAnnotation__Output as _xds_annotations_v3_MessageStatusAnnotation__Output } from '../../xds/annotations/v3/MessageStatusAnnotation.js';

export interface MessageOptions {
  'messageSetWireFormat'?: (boolean);
  'noStandardDescriptorAccessor'?: (boolean);
  'deprecated'?: (boolean);
  'mapEntry'?: (boolean);
  'deprecatedLegacyJsonFieldConflicts'?: (boolean);
  'features'?: (_google_protobuf_FeatureSet | null);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption)[];
  '.validate.disabled'?: (boolean);
  '.validate.ignored'?: (boolean);
  '.udpa.annotations.versioning'?: (_udpa_annotations_VersioningAnnotation | null);
  '.udpa.annotations.messageMigrate'?: (_udpa_annotations_MigrateAnnotation | null);
  '.xds.annotations.v3.messageStatus'?: (_xds_annotations_v3_MessageStatusAnnotation | null);
}

export interface MessageOptions__Output {
  'messageSetWireFormat'?: (boolean);
  'noStandardDescriptorAccessor'?: (boolean);
  'deprecated'?: (boolean);
  'mapEntry'?: (boolean);
  'deprecatedLegacyJsonFieldConflicts'?: (boolean);
  'features'?: (_google_protobuf_FeatureSet__Output);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption__Output)[];
  '.validate.disabled'?: (boolean);
  '.validate.ignored'?: (boolean);
  '.udpa.annotations.versioning'?: (_udpa_annotations_VersioningAnnotation__Output);
  '.udpa.annotations.messageMigrate'?: (_udpa_annotations_MigrateAnnotation__Output);
  '.xds.annotations.v3.messageStatus'?: (_xds_annotations_v3_MessageStatusAnnotation__Output);
}
