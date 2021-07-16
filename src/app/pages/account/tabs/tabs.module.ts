import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

import { MaterialModule } from '../../../../@fury/shared/material-components.module';

import { ContactUsComponent } from './contact-us/contact-us.component';
import { FaqComponent } from './faq/faq.component';
import { PersonalizationComponent } from './personalization/personalization.component';
import { InterestsComponent } from './components/interests/interests.component';
import { PipesModule } from 'src/app/pipes/pipes.module';

const components = [ContactUsComponent, FaqComponent, PersonalizationComponent, InterestsComponent];

@NgModule({
  declarations: [...components, InterestsComponent],
  imports: [ReactiveFormsModule, MaterialModule, CommonModule, MatExpansionModule, PipesModule],
  exports: [...components],
})
export class TabsModule {}
