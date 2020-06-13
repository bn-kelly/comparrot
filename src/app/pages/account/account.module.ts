import { NgModule } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';

@NgModule({
    imports: [AccountRoutingModule, MatTabsModule],
    declarations: [AccountComponent]
})
export class AccountModule {
}
