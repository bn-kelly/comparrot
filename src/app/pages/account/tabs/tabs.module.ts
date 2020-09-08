import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../../../../@fury/shared/material-components.module';

import { ContactUsComponent } from './contact-us/contact-us.component';

@NgModule({
  declarations: [ContactUsComponent],
  imports: [ReactiveFormsModule, MaterialModule, CommonModule],
  exports: [ContactUsComponent],
})
export class TabsModule {}
