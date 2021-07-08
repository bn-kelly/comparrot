import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginWithComponent } from './login-with.component';
import { CodeInputModule } from 'angular-code-input';
import { MaterialModule } from 'src/@fury/shared/material-components.module';
import { ReactiveFormsModule } from '@angular/forms';
import { OAuthModule } from 'src/app/layout/oauth/oauth.module';

const routes: Routes = [
  {
    path: '',
    component: LoginWithComponent,
  },
];

@NgModule({
  declarations: [
    LoginWithComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    CodeInputModule,
    MaterialModule,
    ReactiveFormsModule,
    OAuthModule,
  ]
})
export class LoginWithModule { }
