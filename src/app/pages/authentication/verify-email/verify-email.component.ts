import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../models/project.model';

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
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    const authService = this.authService;
    this.user = authService.currentUser;

    this.themeService.theme$.subscribe(([currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    const checkIfEmailIsVerified = () => {
      const interval = setInterval(async () => {
        await this.user.reload();
        const isEmailVerified = authService.isEmailVerified();
        if (isEmailVerified) {
          clearInterval(interval);
          await this.router.navigate(['/']);
        }
      }, 1000);
    };

    checkIfEmailIsVerified();

    this.authService.user.subscribe(user => {
      if (user && user.projectName) {
        this.afs
          .collection('project')
          .doc(user.projectName)
          .valueChanges()
          .subscribe((project: Project) => {
            this.project = project;
            this.handleLogoUrl();
          });
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
