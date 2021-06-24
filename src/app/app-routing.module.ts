import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './pages/authentication/services/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/authentication/login/login.module').then(
        m => m.LoginModule,
      ),
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./pages/authentication/register/register.module').then(
        m => m.RegisterModule,
      ),
  },
  {
    path: 'forgot-password',
    loadChildren: () =>
      import(
        './pages/authentication/forgot-password/forgot-password.module'
      ).then(m => m.ForgotPasswordModule),
  },
  {
    path: 'verify-email',
    loadChildren: () =>
      import('./pages/authentication/verify-email/verify-email.module').then(
        m => m.VerifyEmailModule,
      ),
  },
  {
    path: 'coming-soon',
    loadChildren: () =>
      import('./pages/coming-soon/coming-soon.module').then(
        m => m.ComingSoonModule,
      ),
  },
  {
    path: '',
    // canActivate: [AuthGuard],
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/dashboard.module').then(
            m => m.DashboardModule,
          ),
        // pathMatch: 'full',
      },
      {
        path: '',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./pages/account/account.module').then(m => m.AccountModule),
          pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
    initialNavigation: 'enabled',
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    relativeLinkResolution: 'legacy'
}),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
