import {
  ApplicationConfig,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideWindow } from '@ngx-templates/shared/services';
import { provideDataSources } from './data/utils';

// TODO(Georgi): Investigate why hydration breaks due to
// dynamically-loaded widgets.
export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideDataSources(),
    provideWindow(),
  ],
};
