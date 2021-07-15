import { DOCUMENT } from '@angular/common';
import { Component, Inject, Renderer2 } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Platform } from '@angular/cdk/platform';
import { SplashScreenService } from '../@fury/services/splash-screen.service';
import { ThemeService } from '../@fury/services/theme.service';
import { MessageService } from './services/message.service';
import { AuthService } from './pages/authentication/services/auth.service';
import { GetUserId, SetUserId, SiteForceLogin } from './constants';

declare global {
  interface Window {
    chrome: any;
    recaptchaVerifier: any;
  }
}

@Component({
  selector: 'fury-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(
    private iconRegistry: MatIconRegistry,
    private renderer: Renderer2,
    private themeService: ThemeService,
    @Inject(DOCUMENT) private document: Document,
    private platform: Platform,
    private route: ActivatedRoute,
    private splashScreenService: SplashScreenService,
    public auth: AuthService,
    private message: MessageService,
  ) {
    this.route.queryParamMap
      .pipe(filter(queryParamMap => queryParamMap.has('style')))
      .subscribe(queryParamMap =>
        this.themeService.setStyle(queryParamMap.get('style')),
      );

    this.iconRegistry.setDefaultFontSetClass('material-icons-outlined');
    this.themeService.theme$.subscribe(theme => {
      if (theme[0]) {
        this.renderer.removeClass(this.document.body, theme[0]);
      }

      this.renderer.addClass(this.document.body, theme[1]);
    });

    if (this.platform.BLINK) {
      this.renderer.addClass(this.document.body, 'is-blink');
    }

    this.message.handleMessage(SetUserId, async ({ uid }) => {
      window.localStorage.setItem('uid', uid);
      const id = window.localStorage.getItem('uid');
      await this.auth.signInWithUid(id);
    });

    this.message.handleMessage(GetUserId, () => {
      const uid = window.localStorage.getItem('uid');
      this.message.postMessage(SiteForceLogin, { uid });
    });
  }
}
