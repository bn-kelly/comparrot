import { Component, HostBinding, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SidenavItem } from './sidenav-item/sidenav-item.interface';
import { SidenavService } from './sidenav.service';
import { ThemeService } from '../../../@fury/services/theme.service';
import DocumentData = firebase.firestore.DocumentData;
import { Project } from '../project.model';
import { AngularFirestore } from '@angular/fire/firestore';

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
  project: Project;
  projectName: string;
  themeName: string;
  user: DocumentData;

  items$: Observable<SidenavItem[]>;

  constructor(private afs: AngularFirestore,
              private router: Router,
              private sidenavService: SidenavService,
              private themeService: ThemeService,
              public sanitizer: DomSanitizer,
  ) {
  }

  ngOnInit() {
    this.themeService.theme$.subscribe(([prevTheme, currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.afs.collection('projects').doc('comparrot').valueChanges().subscribe((project: Project) => {
      this.project = project;
      this.projectName = project && project.name ? project.name : '';
      this.handleLogoUrl();
    });

    this.items$ = this.sidenavService.items$.pipe(
      map((items: SidenavItem[]) => this.sidenavService.sortRecursive(items, 'position'))
    );
  }

  handleLogoUrl() {
    this.logoUrl = this.project && this.project.logoUrl
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

  ngOnDestroy() {
  }
}
