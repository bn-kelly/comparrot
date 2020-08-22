import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

import { AuthService } from '../services/auth.service';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../layout/project.model';

@Component({
  selector: 'fury-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  logoUrl: string;
  project: Project;
  themeName: string;
  user: any;

  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private themeService: ThemeService,
    ) { }

  ngOnInit(): void {
    this.user = this.authService.currentUser;

    const isExtension = !!window.chrome && !!window.chrome.extension;

    this.themeService.theme$.subscribe(([prevTheme, currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.authService.user.subscribe(user => {
      if (user && user.projectName) {
        this.afs.collection('projects').doc(user.projectName).valueChanges().subscribe((project: Project) => {
          this.project = project;
          this.handleLogoUrl();

          if (project && !isExtension) {
            Array.from(document.getElementsByTagName('link'))
                .forEach(link => {
                  if (link.getAttribute('rel') === 'icon') {
                    const favicon = link.getAttribute('href');
                    if (!!project.favicon && favicon !== project.favicon) {
                      link.setAttribute('href', project.favicon);
                    }
                  }
                });
          }
        });
      } else {
        this.logoUrl = 'assets/img/logo.svg';
        if (!isExtension) {
          Array.from(document.getElementsByTagName('link'))
              .forEach(link => {
                if (link.getAttribute('rel') === 'icon') {
                  link.setAttribute('href', 'favicon.ico');
                }
              });
        }
      }
    });

  }

  handleLogoUrl(): void {
    this.logoUrl = this.project && this.project.logoUrl
        ? this.project.logoUrl[this.themeName] || this.project.logoUrl.default
        : '';
  }

  sendVerificationMail() {
    return this.authService.sendVerificationMail();
  }

}
