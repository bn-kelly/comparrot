import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../@fury/shared/material-components.module';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageCropperModule } from 'ngx-image-cropper';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';

@NgModule({
    imports: [
        CommonModule,
        AccountRoutingModule,
        MaterialModule,
        MatTabsModule,
        ReactiveFormsModule,
        ImageCropperModule,
    ],
    declarations: [
        AccountComponent,
    ],
})
export class AccountModule {
}
