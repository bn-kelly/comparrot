import {
  Component,
  HostBinding,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SidenavItem } from './sidenav-item/sidenav-item.interface';
import { SidenavService } from './sidenav.service';
import { ThemeService } from '../../../@fury/services/theme.service';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../pages/authentication/services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'fury-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit {
  sidenavUserVisible$ = this.themeService.config$.pipe(
    map(config => config.sidenavUserVisible),
  );

  @Input()
  @HostBinding('class.collapsed')
  collapsed: boolean;

  @Input()
  @HostBinding('class.expanded')
  expanded: boolean;
  logoUrl: string;
  project: Project;
  projectName: string;
  themeName: string;
  user: User;

  items$: Observable<SidenavItem[]>;

  constructor(
    private afs: AngularFirestore,
    private sidenavService: SidenavService,
    private themeService: ThemeService,
    public sanitizer: DomSanitizer,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.themeService.theme$.subscribe(([currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.afs
      .collection('project')
      .doc(environment.projectName)
      .valueChanges()
      .subscribe((project: Project) => {
        this.project = project;
        this.projectName = project && project.name ? project.name : '';
        this.handleLogoUrl();
      });

    this.user = this.auth.currentUser;
    this.items$ = this.sidenavService.items$.pipe(
      map((items: SidenavItem[]) =>
        this.sidenavService.sortRecursive(items, 'position'),
      ),
    );
  }

  handleLogoUrl() {
    this.logoUrl =
      this.project && this.project.logoUrl
        ? this.project.logoUrl[this.themeName] || this.project.logoUrl.default
        : '';
  }

  toggleCollapsed() {
    this.sidenavService.toggleCollapsed();
  }

  @HostListener('mouseenter')
  @HostListener('touchenter')
  onMouseEnter() {
    this.sidenavService.setExpanded(true);
  }

  @HostListener('mouseleave')
  @HostListener('touchleave')
  onMouseLeave() {
    this.sidenavService.setExpanded(false);
  }
}
