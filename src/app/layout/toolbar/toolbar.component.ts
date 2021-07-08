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
import { environment } from 'src/environments/environment';

@Component({
  selector: 'fury-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  @Input()
  @HostBinding('class.no-box-shadow')
  hasNavigation: boolean;

  @Input()
  showClose = true;

  @Input()
  showAvatar = false;

  isLoggedIn: boolean;
  themeName: string;
  project: Project;

  @Output() openSidenav = new EventEmitter();

  topNavigation$ = this.themeService.config$.pipe(
    map(config => config.navigation === 'top'),
  );

  constructor(
    private themeService: ThemeService,
    public auth: AuthService,
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
  }
}
