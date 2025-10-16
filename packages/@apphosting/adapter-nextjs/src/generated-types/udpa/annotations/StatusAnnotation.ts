// Original file: ../../../udpa/udpa/annotations/status.proto

import type { PackageVersionStatus as _udpa_annotations_PackageVersionStatus, PackageVersionStatus__Output as _udpa_annotations_PackageVersionStatus__Output } from './PackageVersionStatus.js';

export interface StatusAnnotation {
  'workInProgress'?: (boolean);
  'packageVersionStatus'?: (_udpa_annotations_PackageVersionStatus);
}

export interface StatusAnnotation__Output {
  'workInProgress'?: (boolean);
  'packageVersionStatus'?: (_udpa_annotations_PackageVersionStatus__Output);
}
