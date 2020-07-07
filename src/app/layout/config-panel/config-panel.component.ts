import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Theme, ThemeService } from '../../../@fury/services/theme.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatRadioChange } from '@angular/material/radio';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SidenavService } from '../sidenav/sidenav.service';
import { map } from 'rxjs/operators';
import { Project } from '../../layout/project.model';
import { AuthService, User } from '../../pages/authentication/services/auth.service';

@Component({
  selector: 'fury-config-panel',
  templateUrl: './config-panel.component.html',
  styleUrls: ['./config-panel.component.scss']
})
export class ConfigPanelComponent implements OnInit {

  activeTheme$ = this.themeService.activeTheme$;
  navigation$ = this.themeService.config$.pipe(map(config => config.navigation));
  sidenavOpen$ = this.sidenavService.open$;
  sidenavCollapsed$ = this.sidenavService.collapsed$;
  sidenavUserVisible$ = this.themeService.config$.pipe(map(config => config.sidenavUserVisible));
  toolbarVisible$ = this.themeService.config$.pipe(map(config => config.toolbarVisible));
  toolbarPosition$ = this.themeService.config$.pipe(map(config => config.toolbarPosition));
  footerVisible$ = this.themeService.config$.pipe(map(config => config.footerVisible));
  footerPosition$ = this.themeService.config$.pipe(map(config => config.footerPosition));
  projects: Project[] = [];
  user: User;

  constructor(private themeService: ThemeService,
              private sidenavService: SidenavService,
              private afs: AngularFirestore,
              private auth: AuthService,
  ) { }

  ngOnInit() {
    this.auth.user.subscribe(user => {
      this.user = user;
    });
    this.afs.collection('projects').valueChanges().subscribe((projects: Project[]) => {
      this.projects = projects;
    });
  }

  projectChange(change: MatRadioChange) {
    if (this.user && this.user.uid) {
      this.afs.collection('users').doc(this.user.uid).update({ projectName: change.value });
    }
  }

  setActiveTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  navigationChange(change: MatRadioChange) {
    this.themeService.setNavigation(change.value);
  }

  sidenavOpenChange(change: MatSlideToggleChange) {
    change.checked ? this.sidenavService.open() : this.sidenavService.close();
  }

  sidenavCollapsedChange(change: MatCheckboxChange) {
    this.sidenavService.setCollapsed(change.checked);
  }

  sidenavUserChange(change: MatCheckboxChange) {
    this.themeService.setSidenavUserVisible(change.checked);
  }

  toolbarVisibleChange(change: MatSlideToggleChange) {
    this.themeService.setToolbarVisible(change.checked);
  }

  toolbarPositionChange(change: MatRadioChange) {
    this.themeService.setToolbarPosition(change.value);
  }

  footerVisibleChange(change: MatSlideToggleChange) {
    this.themeService.setFooterVisible(change.checked);
  }

  footerPositionChange(change: MatRadioChange) {
    this.themeService.setFooterPosition(change.value);
  }
}
