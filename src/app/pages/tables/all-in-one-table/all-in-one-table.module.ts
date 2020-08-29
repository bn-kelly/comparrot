import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsModule } from '../../../../@fury/shared/breadcrumbs/breadcrumbs.module';
import { ListModule } from '../../../../@fury/shared/list/list.module';
import { MaterialModule } from '../../../../@fury/shared/material-components.module';
import { AllInOneTableRoutingModule } from './all-in-one-table-routing.module';
import { AllInOneTableComponent } from './all-in-one-table.component';
import { BotCreateUpdateModule } from './bot-create-update-delete/bot-create-update.module';
import { BotDeleteModule } from './bot-create-update-delete/bot-delete.module';
import { FurySharedModule } from '../../../../@fury/fury-shared.module';
import { DateAgoPipe } from '../../../pipes/date-ago.pipe';

@NgModule({
  imports: [
    CommonModule,
    AllInOneTableRoutingModule,
    FormsModule,
    MaterialModule,
    FurySharedModule,

    // Core
    ListModule,
    BotCreateUpdateModule,
    BotDeleteModule,
    BreadcrumbsModule,
  ],
  declarations: [AllInOneTableComponent, DateAgoPipe],
  exports: [AllInOneTableComponent],
})
export class AllInOneTableModule {}
