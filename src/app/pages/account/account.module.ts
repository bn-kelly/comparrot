import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MaterialModule } from '../../../@fury/shared/material-components.module';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageCropperModule } from 'ngx-image-cropper';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';

import { TabsModule } from './tabs/tabs.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    AccountRoutingModule,
    MaterialModule,
    MatTabsModule,
    ReactiveFormsModule,
    ImageCropperModule,
    MatExpansionModule,
    TabsModule,
    PipesModule,
  ],
  declarations: [AccountComponent],
})
export class AccountModule {}
