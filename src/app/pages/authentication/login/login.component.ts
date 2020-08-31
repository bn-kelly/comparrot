import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AuthService } from '../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../layout/project.model';

type UserFields = 'email' | 'password';
type FormErrors = { [u in UserFields]: string };

@Component({
  selector: 'fury-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeInUpAnimation],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  inputType = 'password';
  visible = false;
  logoUrl: string;
  project: Project;
  themeName: string;

  userForm: FormGroup;
  newUser = true; // to toggle login or signup form
  passReset = false; // set to true when password reset is triggered
  formErrors: FormErrors = {
    email: '',
    password: '',
  };
  validationMessages = {
    email: {
      required: 'Email is required.',
      email: 'Email must be a valid email',
    },
    password: {
      required: 'Password is required.',
      pattern: 'Password must be include at one letter and one number.',
      minlength: 'Password must be at least 4 characters long.',
      maxlength: 'Password cannot be more than 40 characters long.',
    },
  };

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar,
    private afs: AngularFirestore,
    private auth: AuthService,
    private themeService: ThemeService,
  ) {}

  ngOnInit() {
    const isExtension = !!window.chrome && !!window.chrome.extension;

    this.buildForm();

    this.themeService.theme$.subscribe(([currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.auth.user.subscribe(user => {
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

  send() {
    this.router.navigate(['/']);
    this.snackbar.open(
      "Lucky you! Looks like you didn't need a password or email address! For a real application we provide validators to prevent this. ;)",
      'LOL THANKS',
      {
        duration: 10000,
      },
    );
  }

  toggleVisibility() {
    if (this.visible) {
      this.inputType = 'password';
      this.visible = false;
      this.cd.markForCheck();
    } else {
      this.inputType = 'text';
      this.visible = true;
      this.cd.markForCheck();
    }
  }

  toggleForm() {
    this.newUser = !this.newUser;
  }

  login() {
    if (!this.form.valid) {
      return;
    }

    this.auth
      .emailLogin(this.form.value['email'], this.form.value['password'])
      .then(response => {
        const data: any = response ? { ...response } : {};
        const { code, message } = data;

        if (['auth/user-not-found'].includes(code)) {
          this.form.controls.email.setErrors({ email: message });
          this.formErrors.email = message;
        }

        if (['auth/wrong-password', 'auth/too-many-requests'].includes(code)) {
          this.form.controls.password.setErrors({ password: message });
          this.formErrors.password = message;
        }
      });
  }

  resetPassword() {
    this.auth
      .resetPassword(this.form.value['email'])
      .then(() => (this.passReset = true));
  }

  buildForm() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$'),
          Validators.minLength(6),
          Validators.maxLength(25),
        ],
      ],
    });

    this.form.valueChanges.subscribe(() => this.onValueChanged());
    this.onValueChanged(); // reset validation messages
  }

  // Updates validation state on form changes.
  onValueChanged() {
    if (!this.form) {
      return;
    }
    const form = this.form;
    for (const field in this.formErrors) {
      if (
        Object.prototype.hasOwnProperty.call(this.formErrors, field) &&
        ['email', 'password'].includes(field)
      ) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          if (control.errors) {
            for (const key in control.errors) {
              if (
                Object.prototype.hasOwnProperty.call(control.errors, key) &&
                messages[key]
              ) {
                this.formErrors[field] += `${
                  (messages as { [key: string]: string })[key]
                } `;
              }
            }
          }
        }
      }
    }
  }
}
