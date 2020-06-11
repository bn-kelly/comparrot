import { NgModule } from '@angular/core';

import { AccountSettingsRoutingModule } from './settings-routing.module';
import { AccountSettingsComponent } from './settings.component';

@NgModule({
    imports: [AccountSettingsRoutingModule],
    declarations: [AccountSettingsComponent]
})
export class AccountSettingsModule {
}
