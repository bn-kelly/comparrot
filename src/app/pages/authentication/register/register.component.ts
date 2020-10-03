import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AuthService } from '../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../layout/project.model';
import { MatchingValidator } from './matching.validator';
import { emailOrPasswordPattern } from '../constants';

type UserFields =
  | 'firstname'
  | 'lastname'
  | 'emailOrPhone'
  | 'password'
  | 'passwordConfirm'
  | 'acceptTerms';
type FormErrors = { [u in UserFields]: string };

const isPhoneAuthAllowed = location.protocol.startsWith('http');

@Component({
  selector: 'fury-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [fadeInUpAnimation],
  encapsulation: ViewEncapsulation.None,
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  firstName: '';
  lastName: '';
  emailOrPhone: '';
  password: '';
  isPhoneAuthAllowed: boolean;
  verificationId: '';
  phoneConfirmationResult: any;
  phoneVerificationError: '';
  formErrors: FormErrors = {
    firstname: '',
    lastname: '',
    emailOrPhone: '',
    password: '',
    passwordConfirm: '',
    acceptTerms: '',
  };
  validationMessages = {
    firstname: {
      required: 'Please enter your firstname',
    },
    lastname: {
      required: 'Please enter your lastname',
    },
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
      pattern: 'Password must be include at one letter and one number.',
      minlength: 'Password must be at least 6 characters long.',
      maxlength: 'Password cannot be more than 25 characters long.',
    },
    passwordConfirm: {
      required: 'Please confirm your password',
      matchingValidator: `Those passwords didn't match. Please try again`,
    },
  };

  inputType = 'password';
  visible = false;
  logoUrl: string;
  project: Project;
  themeName: string;
  submitted = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private afs: AngularFirestore,
    private auth: AuthService,
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

  signup() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    this.firstName = this.form.value['firstname'];
    this.lastName = this.form.value['lastname'];
    this.emailOrPhone = this.form.value['emailOrPhone'];
    this.password = this.form.value['password'];

    this.auth
      .phoneOrEmailSignUp({
        emailOrPhone: this.emailOrPhone,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
      })
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

        if (['auth/weak-password'].includes(code)) {
          this.form.controls.password.setErrors({ password: message });
          this.formErrors.password = message;
        }

        if (['auth/email-already-in-use'].includes(code)) {
          this.form.controls.emailOrPhone.setErrors({ emailOrPhone: message });
          this.formErrors.emailOrPhone = message;
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
          this.auth
            .getUserDocByUid(response.user.uid)
            .then(doc => doc.data() || {})
            .then(userDoc => {
              this.auth.updateUserData({
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

    this.auth
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

  buildForm() {
    this.form = this.fb.group(
      {
        firstname: ['', Validators.required],
        lastname: ['', Validators.required],
        emailOrPhone: [
          '',
          [
            Validators.required,
            this.isPhoneAuthAllowed
              ? Validators.pattern(emailOrPasswordPattern)
              : Validators.email,
          ],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$'),
            Validators.minLength(6),
            Validators.maxLength(25),
          ],
        ],
        passwordConfirm: ['', Validators.required],
        acceptTerms: [false, Validators.requiredTrue],
      },
      {
        validator: MatchingValidator('password', 'passwordConfirm'),
      },
    );

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
        ['name', 'emailOrPhone', 'password', 'passwordConfirm'].includes(field)
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
