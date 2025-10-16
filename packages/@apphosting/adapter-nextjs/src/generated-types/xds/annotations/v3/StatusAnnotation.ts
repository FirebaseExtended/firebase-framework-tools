// Original file: ../../../xds/xds/annotations/v3/status.proto

import type { PackageVersionStatus as _xds_annotations_v3_PackageVersionStatus, PackageVersionStatus__Output as _xds_annotations_v3_PackageVersionStatus__Output } from './PackageVersionStatus.js';

export interface StatusAnnotation {
  'workInProgress'?: (boolean);
  'packageVersionStatus'?: (_xds_annotations_v3_PackageVersionStatus);
}

export interface StatusAnnotation__Output {
  'workInProgress'?: (boolean);
  'packageVersionStatus'?: (_xds_annotations_v3_PackageVersionStatus__Output);
}
