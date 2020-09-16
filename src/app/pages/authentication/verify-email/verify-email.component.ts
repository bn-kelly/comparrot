import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../layout/project.model';

@Component({
  selector: 'fury-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent implements OnInit {
  logoUrl: string;
  project: Project;
  themeName: string;
  user: any;

  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private router: Router,
    private themeService: ThemeService,
  ) {}

  ngOnInit() {
    const authService = this.authService;
    this.user = authService.currentUser;
    const user = this.user;
    const router = this.router;

    const isExtension = !!window.chrome && !!window.chrome.extension;

    this.themeService.theme$.subscribe(([currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    const checkIfEmailIsVerified = () => {
      const interval = setInterval(async () => {
        await user.reload();
        const isEmailVerified = await authService.isEmailVerified();
        if (isEmailVerified) {
          clearInterval(interval);
          await router.navigate(['/']);
        }
      }, 1000);
    };

    checkIfEmailIsVerified();

    this.authService.user.subscribe(user => {
      if (user && user.projectName) {
        this.afs
          .collection('projects')
          .doc(user.projectName)
          .valueChanges()
          .subscribe((project: Project) => {
            this.project = project;
            this.handleLogoUrl();

            if (project && !isExtension) {
              Array.from(document.getElementsByTagName('link')).forEach(
                link => {
                  if (link.getAttribute('rel') === 'icon') {
                    const favicon = link.getAttribute('href');
                    if (!!project.favicon && favicon !== project.favicon) {
                      link.setAttribute('href', project.favicon);
                    }
                  }
                },
              );
            }
          });
      } else {
        this.logoUrl = 'assets/img/logo.svg';
        if (!isExtension) {
          Array.from(document.getElementsByTagName('link')).forEach(link => {
            if (link.getAttribute('rel') === 'icon') {
              link.setAttribute('href', 'favicon.ico');
            }
          });
        }
      }
    });
  }

  handleLogoUrl() {
    this.logoUrl =
      this.project && this.project.logoUrl
        ? this.project.logoUrl[this.themeName] || this.project.logoUrl.default
        : '';
  }

  sendVerificationMail() {
    return this.authService.sendVerificationMail();
  }
}
