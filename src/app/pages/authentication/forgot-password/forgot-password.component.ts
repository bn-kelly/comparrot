import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AngularFirestore } from '@angular/fire/firestore';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../layout/project.model';
import { AuthService } from '../services/auth.service';

type UserFields = 'email';
type FormErrors = { [u in UserFields]: string };

@Component({
  selector: 'fury-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  animations: [fadeInUpAnimation]
})
export class ForgotPasswordComponent implements OnInit {

  form: FormGroup;
  formErrors: FormErrors = {
    'email': '',
  };
  validationMessages = {
    'email': {
      'required': 'We can\'t recover your password, without your email',
      'email': 'Email must be a valid email',
    },
  };
  logoUrl: string;
  project: Project;
  themeName: string;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private afs: AngularFirestore,
    private auth: AuthService,
    private themeService: ThemeService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    const isExtension = !!window.chrome && !!window.chrome.extension;

    this.buildForm();

    this.themeService.theme$.subscribe(([prevTheme, currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.auth.user.subscribe(user => {
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
        this.logoUrl = 'assets/img/logo_mobile.svg';
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

  handleLogoUrl() {
    this.logoUrl = this.project && this.project.logoUrl
        ? this.project.logoUrl[this.themeName] || this.project.logoUrl.default
        : '';
  }

  sendRecoveryLink() {
    if (!this.form.valid) {
      return;
    }

    this.auth.resetPassword(this.form.value.email).then(response => {
      const data: any  = response ? { ...response } : {};
      const { code, message } = data;

      if (['auth/user-not-found'].includes(code)) {
        this.form.controls.email.setErrors({ email: message });
        this.formErrors.email = message;
      }

      if (!response) {
        const snackBarRef = this.snackBar.open('Instructions have been successfully sent to you email', 'Go to login', {
          duration: 5000,
        });

        snackBarRef.afterDismissed().subscribe(() => this.router.navigate(['/login']));
      }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      'email': ['', [
        Validators.required,
        Validators.email,
      ]]
    });

    this.form.valueChanges.subscribe((data) => this.onValueChanged(data));
    this.onValueChanged(); // reset validation messages
  }

  onValueChanged(data?: any) {
    if (!this.form) { return; }
    const form = this.form;
    for (const field in this.formErrors) {
      if (Object.prototype.hasOwnProperty.call(this.formErrors, field) && ['email'].includes(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          if (control.errors) {
            for (const key in control.errors) {
              if (Object.prototype.hasOwnProperty.call(control.errors, key) && messages[key]) {
                this.formErrors[field] += `${(messages as {[key: string]: string})[key]} `;
              }
            }
          }
        }
      }
    }
  }
}
