import { CommonModule } from '@angular/common';
import { CodeInputModule } from 'angular-code-input';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../@fury/shared/material-components.module';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { OAuthModule } from '../../../layout/oauth/oauth.module';

@NgModule({
  imports: [
    CommonModule,
    CodeInputModule,
    LoginRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    OAuthModule,
  ],
  declarations: [LoginComponent],
})
export class LoginModule {}
