// Original file: null

import type { FeatureSet as _google_protobuf_FeatureSet, FeatureSet__Output as _google_protobuf_FeatureSet__Output } from './FeatureSet.js';
import type { UninterpretedOption as _google_protobuf_UninterpretedOption, UninterpretedOption__Output as _google_protobuf_UninterpretedOption__Output } from './UninterpretedOption.js';
import type { FileMigrateAnnotation as _udpa_annotations_FileMigrateAnnotation, FileMigrateAnnotation__Output as _udpa_annotations_FileMigrateAnnotation__Output } from '../../udpa/annotations/FileMigrateAnnotation.js';
import type { StatusAnnotation as _udpa_annotations_StatusAnnotation, StatusAnnotation__Output as _udpa_annotations_StatusAnnotation__Output } from '../../udpa/annotations/StatusAnnotation.js';
import type { FileStatusAnnotation as _xds_annotations_v3_FileStatusAnnotation, FileStatusAnnotation__Output as _xds_annotations_v3_FileStatusAnnotation__Output } from '../../xds/annotations/v3/FileStatusAnnotation.js';

// Original file: null

export const _google_protobuf_FileOptions_OptimizeMode = {
  SPEED: 1,
  CODE_SIZE: 2,
  LITE_RUNTIME: 3,
} as const;

export type _google_protobuf_FileOptions_OptimizeMode =
  | 'SPEED'
  | 1
  | 'CODE_SIZE'
  | 2
  | 'LITE_RUNTIME'
  | 3

export type _google_protobuf_FileOptions_OptimizeMode__Output = typeof _google_protobuf_FileOptions_OptimizeMode[keyof typeof _google_protobuf_FileOptions_OptimizeMode]

export interface FileOptions {
  'javaPackage'?: (string);
  'javaOuterClassname'?: (string);
  'optimizeFor'?: (_google_protobuf_FileOptions_OptimizeMode);
  'javaMultipleFiles'?: (boolean);
  'goPackage'?: (string);
  'ccGenericServices'?: (boolean);
  'javaGenericServices'?: (boolean);
  'pyGenericServices'?: (boolean);
  'javaGenerateEqualsAndHash'?: (boolean);
  'deprecated'?: (boolean);
  'javaStringCheckUtf8'?: (boolean);
  'ccEnableArenas'?: (boolean);
  'objcClassPrefix'?: (string);
  'csharpNamespace'?: (string);
  'swiftPrefix'?: (string);
  'phpClassPrefix'?: (string);
  'phpNamespace'?: (string);
  'phpMetadataNamespace'?: (string);
  'rubyPackage'?: (string);
  'features'?: (_google_protobuf_FeatureSet | null);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption)[];
  '.udpa.annotations.fileMigrate'?: (_udpa_annotations_FileMigrateAnnotation | null);
  '.udpa.annotations.fileStatus'?: (_udpa_annotations_StatusAnnotation | null);
  '.xds.annotations.v3.fileStatus'?: (_xds_annotations_v3_FileStatusAnnotation | null);
}

export interface FileOptions__Output {
  'javaPackage'?: (string);
  'javaOuterClassname'?: (string);
  'optimizeFor'?: (_google_protobuf_FileOptions_OptimizeMode__Output);
  'javaMultipleFiles'?: (boolean);
  'goPackage'?: (string);
  'ccGenericServices'?: (boolean);
  'javaGenericServices'?: (boolean);
  'pyGenericServices'?: (boolean);
  'javaGenerateEqualsAndHash'?: (boolean);
  'deprecated'?: (boolean);
  'javaStringCheckUtf8'?: (boolean);
  'ccEnableArenas'?: (boolean);
  'objcClassPrefix'?: (string);
  'csharpNamespace'?: (string);
  'swiftPrefix'?: (string);
  'phpClassPrefix'?: (string);
  'phpNamespace'?: (string);
  'phpMetadataNamespace'?: (string);
  'rubyPackage'?: (string);
  'features'?: (_google_protobuf_FeatureSet__Output);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption__Output)[];
  '.udpa.annotations.fileMigrate'?: (_udpa_annotations_FileMigrateAnnotation__Output);
  '.udpa.annotations.fileStatus'?: (_udpa_annotations_StatusAnnotation__Output);
  '.xds.annotations.v3.fileStatus'?: (_xds_annotations_v3_FileStatusAnnotation__Output);
}
