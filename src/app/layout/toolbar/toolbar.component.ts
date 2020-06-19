import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { map } from 'rxjs/operators';
import { ThemeService } from '../../../@fury/services/theme.service';
import { AuthService } from '../../pages/authentication/services/auth.service';
import DocumentData = firebase.firestore.DocumentData;

@Component({
  selector: 'fury-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  @Input()
  @HostBinding('class.no-box-shadow')
  hasNavigation: boolean;
  isExtension: boolean;
  isLoggedIn: boolean;
  logoUrl: string;
  themeName: string;
  user: DocumentData;

  @Output() openSidenav = new EventEmitter();

  topNavigation$ = this.themeService.config$.pipe(map(config => config.navigation === 'top'));

  constructor(private themeService: ThemeService,
              public auth: AuthService) {
  }

  ngOnInit() {
    this.isExtension = !!window.chrome && !!window.chrome.extension;

    this.themeService.theme$.subscribe(([prevTheme, currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.auth.user.subscribe(user => {
      this.user = user;
      this.handleLogoUrl();
      this.isLoggedIn = !!user && !user.isAnonymous;
    });
  }

  handleLogoUrl() {
    this.logoUrl = this.user && this.user.project && this.user.project.logoUrl
        ? this.user.project.logoUrl[this.themeName] || this.user.project.logoUrl.default
        : 'assets/img/logo_mobile.svg';
  }

}
