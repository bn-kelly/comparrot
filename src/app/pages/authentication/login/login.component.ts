import { auth } from 'firebase';
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
import { emailOrPasswordPattern } from '../constants';

type UserFields = 'emailOrPhone' | 'password' | 'rememberMe';
type FormErrors = { [u in UserFields]: string };

const isPhoneAuthAllowed = location.protocol.startsWith('http');

@Component({
  selector: 'fury-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeInUpAnimation],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  emailOrPhone: '';
  password: '';
  rememberMe: false;
  isPhoneAuthAllowed: boolean;
  verificationId: '';
  phoneConfirmationResult: any;
  phoneVerificationError: '';
  inputType = 'password';
  visible = false;
  logoUrl: string;
  project: Project;
  themeName: string;

  userForm: FormGroup;
  newUser = true; // to toggle login or signup form
  passReset = false; // set to true when password reset is triggered
  formErrors: FormErrors = {
    emailOrPhone: '',
    password: '',
    rememberMe: '',
  };
  validationMessages = {
    emailOrPhone: {
      required: `Please enter your email${
        isPhoneAuthAllowed ? ' or phone number' : ''
      }`,
      emailOrPhone: `Must be a valid email${
        isPhoneAuthAllowed ? ' or phone number' : ''
      }`,
    },
    password: {
      required: 'Please enter your password',
    },
  };

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar,
    private afs: AngularFirestore,
    private authService: AuthService,
    private themeService: ThemeService,
  ) {}

  ngOnInit() {
    const isExtension = !!window.chrome && !!window.chrome.extension;
    this.isPhoneAuthAllowed = isPhoneAuthAllowed;

    this.buildForm();

    this.themeService.theme$.subscribe(([currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

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

  send() {
    this.router.navigate(['/']);
    this.snackbar.open(
      `Lucky you! Looks like you didn't need a password or email address! For a real application we provide validators to prevent this. ;)`,
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

  rememberUser() {
    auth().setPersistence(auth.Auth.Persistence.LOCAL);
  }

  login() {
    if (!this.form.valid) {
      return;
    }

    this.emailOrPhone = this.form.value['emailOrPhone'];
    this.password = this.form.value['password'];
    this.rememberMe = this.form.value['rememberMe'];

    this.authService
      .phoneOrEmailLogin(this.emailOrPhone, this.password)
      .then(response => {
        const data: any = response ? { ...response } : {};
        const { code, message, verificationId } = data;

        if (verificationId) {
          this.verificationId = verificationId;
          this.phoneConfirmationResult = response;
        }

        if (['auth/wrong-password', 'auth/too-many-requests'].includes(code)) {
          this.form.controls.password.setErrors({ password: message });
          this.formErrors.password = message;
        }

        if (['auth/user-not-found'].includes(code)) {
          this.form.controls.emailOrPhone.setErrors({ emailOrPhone: message });
          this.formErrors.emailOrPhone = message;
        }

        if (!response && this.rememberMe) {
          this.rememberUser();
        }
      });
  }

  onPhoneVerificationChanged() {
    this.phoneVerificationError = '';
  }

  onPhoneVerificationCodeCompleted(confirmationCode) {
    this.phoneConfirmationResult
      .confirm(confirmationCode)
      .then(response => {
        if (response && response.user && response.user.uid) {
          if (this.rememberMe) {
            this.rememberUser();
          }
          this.authService
            .getUserDocByUid(response.user.uid)
            .then(doc => doc.data() || {})
            .then(userDoc => {
              this.authService.updateUserData({
                ...response.user,
                ...userDoc,
              });
              this.router.navigate(['/']);
            });
        }
      })
      .catch(error => {
        const { code, message } = error;

        if (['auth/invalid-verification-code'].includes(code)) {
          this.phoneVerificationError = message;
        }
      });
  }

  resendConfirmationCode() {
    const recaptchaElementId = 'recaptcha-container-code-confirmation';

    this.authService
      .signInWithPhoneNumber(this.emailOrPhone, recaptchaElementId)
      .then((response: any) => {
        this.verificationId = response.verificationId;
        this.phoneConfirmationResult = response;
        const recaptchaElement = document.getElementById(recaptchaElementId);
        if (recaptchaElement) {
          recaptchaElement.innerHTML = '';
        }
      });
  }

  resetPassword() {
    this.authService
      .resetPassword(this.form.value['emailOrPhone'])
      .then(() => (this.passReset = true));
  }

  buildForm() {
    this.form = this.fb.group({
      emailOrPhone: [
        '',
        [
          Validators.required,
          this.isPhoneAuthAllowed
            ? Validators.pattern(emailOrPasswordPattern)
            : Validators.email,
        ],
      ],
      password: ['', Validators.required],
      rememberMe: false,
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
        ['emailOrPhone', 'password'].includes(field)
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
