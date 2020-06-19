import { Component, HostBinding, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SidenavItem } from './sidenav-item/sidenav-item.interface';
import { SidenavService } from './sidenav.service';
import { ThemeService } from '../../../@fury/services/theme.service';
import { AuthService } from '../../pages/authentication/services/auth.service';
import DocumentData = firebase.firestore.DocumentData;

@Component({
  selector: 'fury-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit, OnDestroy {

  sidenavUserVisible$ = this.themeService.config$.pipe(map(config => config.sidenavUserVisible));

  @Input()
  @HostBinding('class.collapsed')
  collapsed: boolean;

  @Input()
  @HostBinding('class.expanded')
  expanded: boolean;
  logoUrl: string;
  projectName: string;
  themeName: string;
  user: DocumentData;

  items$: Observable<SidenavItem[]>;

  constructor(private router: Router,
              private sidenavService: SidenavService,
              private themeService: ThemeService,
              private auth: AuthService) {
  }

  ngOnInit() {
    this.themeService.theme$.subscribe(([prevTheme, currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });
    this.auth.user.subscribe(user => {
      this.user = user;
      this.handleLogoUrl();
      this.projectName = user && user.project && user.project.name ? user.project.name : '';
    });

    this.items$ = this.sidenavService.items$.pipe(
      map((items: SidenavItem[]) => this.sidenavService.sortRecursive(items, 'position'))
    );
  }

  handleLogoUrl() {
    this.logoUrl = this.user && this.user.project && this.user.project.logoUrl
        ? this.user.project.logoUrl[this.themeName] || this.user.project.logoUrl.default
        : 'assets/img/logo_mobile.svg';
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

  ngOnDestroy() {
  }
}
