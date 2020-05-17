import { Component, OnDestroy, OnInit } from '@angular/core';
import { ThemeService } from '../../../@fury/services/theme.service';
import { AuthService } from '../../pages/authentication/services/auth.service';

@Component({
  selector: 'fury-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean;

  constructor(
      private themeService: ThemeService,
      private auth: AuthService,
  ) {
  }

  ngOnInit() {
    this.auth.user.subscribe(user => {
      this.isLoggedIn = !!user && !user.isAnonymous;
    });
  }

  ngOnDestroy(): void {}
}
