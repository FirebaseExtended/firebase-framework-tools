// Original file: null

import type { FeatureSet as _google_protobuf_FeatureSet, FeatureSet__Output as _google_protobuf_FeatureSet__Output } from './FeatureSet.js';
import type { UninterpretedOption as _google_protobuf_UninterpretedOption, UninterpretedOption__Output as _google_protobuf_UninterpretedOption__Output } from './UninterpretedOption.js';

export interface _google_protobuf_ExtensionRangeOptions_Declaration {
  'number'?: (number);
  'fullName'?: (string);
  'type'?: (string);
  'reserved'?: (boolean);
  'repeated'?: (boolean);
}

export interface _google_protobuf_ExtensionRangeOptions_Declaration__Output {
  'number'?: (number);
  'fullName'?: (string);
  'type'?: (string);
  'reserved'?: (boolean);
  'repeated'?: (boolean);
}

// Original file: null

export const _google_protobuf_ExtensionRangeOptions_VerificationState = {
  DECLARATION: 0,
  UNVERIFIED: 1,
} as const;

export type _google_protobuf_ExtensionRangeOptions_VerificationState =
  | 'DECLARATION'
  | 0
  | 'UNVERIFIED'
  | 1

export type _google_protobuf_ExtensionRangeOptions_VerificationState__Output = typeof _google_protobuf_ExtensionRangeOptions_VerificationState[keyof typeof _google_protobuf_ExtensionRangeOptions_VerificationState]

export interface ExtensionRangeOptions {
  'declaration'?: (_google_protobuf_ExtensionRangeOptions_Declaration)[];
  'verification'?: (_google_protobuf_ExtensionRangeOptions_VerificationState);
  'features'?: (_google_protobuf_FeatureSet | null);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption)[];
}

export interface ExtensionRangeOptions__Output {
  'declaration'?: (_google_protobuf_ExtensionRangeOptions_Declaration__Output)[];
  'verification'?: (_google_protobuf_ExtensionRangeOptions_VerificationState__Output);
  'features'?: (_google_protobuf_FeatureSet__Output);
  'uninterpretedOption'?: (_google_protobuf_UninterpretedOption__Output)[];
}
