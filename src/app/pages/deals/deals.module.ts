import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MaterialModule } from '../../../@fury/shared/material-components.module';
import { DealsRoutingModule } from './deals-routing.module';
import { DealsComponent } from './deals.component';
import { DealsService } from './deals.service';
import { FurySharedModule } from '../../../@fury/fury-shared.module';

@NgModule({
  imports: [
    CommonModule,
    DealsRoutingModule,
    MaterialModule,
    FurySharedModule,
    NgxSpinnerModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [DealsComponent],
  providers: [DealsService],
})
export class DealsModule {}
