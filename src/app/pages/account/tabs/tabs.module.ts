import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

import { MaterialModule } from '../../../../@fury/shared/material-components.module';

import { ContactUsComponent } from './contact-us/contact-us.component';
import { FaqComponent } from './faq/faq.component';
import { PersonalizationComponent } from './personalization/personalization.component';
import { InterestsComponent } from './components/interests/interests.component';
import { WishlistComponent } from './wishlist/wishlist.component';

import { OrderByPipe } from '../../../pipes/order-by.pipe';

const components = [ContactUsComponent, FaqComponent, PersonalizationComponent, WishlistComponent, InterestsComponent, OrderByPipe];

@NgModule({
  declarations: [...components, InterestsComponent],
  imports: [ReactiveFormsModule, MaterialModule, CommonModule, MatExpansionModule],
  exports: [...components],
})
export class TabsModule {}
