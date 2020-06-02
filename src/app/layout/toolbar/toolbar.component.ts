import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { map } from 'rxjs/operators';
import { ThemeService } from '../../../@fury/services/theme.service';
import { AuthService } from '../../pages/authentication/services/auth.service';

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

  @Output() openSidenav = new EventEmitter();
  @Output() openQuickPanel = new EventEmitter();

  topNavigation$ = this.themeService.config$.pipe(map(config => config.navigation === 'top'));

  constructor(private themeService: ThemeService,
              public auth: AuthService) {
  }

  ngOnInit() {
    this.isExtension = !!window.chrome && !!window.chrome.extension;

    this.auth.user.subscribe(user => {
      this.isLoggedIn = !!user && !user.isAnonymous;
    });
  }


}
