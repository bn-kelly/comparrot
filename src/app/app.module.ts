import { HttpClientModule } from '@angular/common/http';
import { Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Needed for Touch functionality of Material Components
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireAnalyticsModule, APP_NAME, APP_VERSION, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import {
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MatSnackBarConfig,
} from '@angular/material/snack-bar';
import { ApplicationContext as ComparrotApp } from '@coturiv/firebase/app';
import { CoreModule } from './pages/authentication/services/core.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutModule } from './layout/layout.module';
import { environment } from '../environments/environment';
import { PendingInterceptorModule } from '../@fury/shared/loading-indicator/pending-interceptor.module';

@NgModule({
  imports: [
    // Angular Core Module // Don't remove!
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    // Fury Core Modules
    AppRoutingModule,

    // Layout Module (Sidenav, Toolbar, Quickpanel, Content)
    LayoutModule,

    // Displays Loading Bar when a Route Request or HTTP Request is pending
    PendingInterceptorModule,

    // Register a Service Worker (optional)
    // ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })

    CoreModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    AngularFireFunctionsModule,
    AngularFireAnalyticsModule
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'fill',
      } as MatFormFieldDefaultOptions,
    },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
      } as MatSnackBarConfig,
    },
    ScreenTrackingService,
    UserTrackingService,
    {
      provide: APP_NAME, useValue: 'extension'
    },
    {
      provide: APP_VERSION, useValue: '2.8.0'
    }
  ],
})
export class AppModule {
  constructor(injector: Injector) {
    ComparrotApp.get().initialize({ injector });
  }
}
