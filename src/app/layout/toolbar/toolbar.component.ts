import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { DomSanitizer } from '@angular/platform-browser';
import { map } from 'rxjs/operators';
import { ThemeService } from '../../../@fury/services/theme.service';
import { AuthService } from '../../pages/authentication/services/auth.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'fury-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  @Input()
  @HostBinding('class.no-box-shadow')
  hasNavigation: boolean;
  isLoggedIn: boolean;
  logoUrl: string;
  themeName: string;
  project: Project;

  @Output() openSidenav = new EventEmitter();

  topNavigation$ = this.themeService.config$.pipe(
    map(config => config.navigation === 'top'),
  );

  constructor(
    private themeService: ThemeService,
    public auth: AuthService,
    private afs: AngularFirestore,
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.themeService.theme$.subscribe(([currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.auth.user.subscribe(user => {
      if (user && user.projectName) {
        this.afs
          .collection('project')
          .doc(user.projectName)
          .valueChanges()
          .subscribe((project: Project) => {
            this.project = project;
            this.handleLogoUrl();
          });
      } else {
        this.logoUrl = 'assets/img/logo_mobile.svg';
      }
    });
  }

  handleLogoUrl() {
    this.logoUrl =
      this.project && this.project.logoUrl
        ? this.project.logoUrl[this.themeName] || this.project.logoUrl.default
        : '';
  }
}
