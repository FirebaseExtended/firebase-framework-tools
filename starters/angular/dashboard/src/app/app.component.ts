import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ModalOutletComponent } from '@ngx-templates/shared/modal';
import { TOASTS_COMPONENTS } from '@ngx-templates/shared/toasts';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { WidgetsGridComponent } from './shared/widgets-grid/widgets-grid.component';

@Component({
  selector: 'db-root',
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    WidgetsGridComponent,
    ModalOutletComponent,
    TOASTS_COMPONENTS,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
