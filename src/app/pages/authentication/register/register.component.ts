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
import { ConfirmedValidator } from './confirmed.validator';

type UserFields =
  | 'name'
  | 'email'
  | 'password'
  | 'passwordConfirm'
  | 'acceptTerms';
type FormErrors = { [u in UserFields]: string };

@Component({
  selector: 'fury-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [fadeInUpAnimation],
  encapsulation: ViewEncapsulation.None,
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  formErrors: FormErrors = {
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    acceptTerms: '',
  };
  validationMessages = {
    name: {
      required: 'Please enter your name',
    },
    email: {
      required: 'Please enter your email',
      email: 'Email must be a valid email',
    },
    password: {
      required: 'Please enter your password',
      pattern: 'Password must be include at one letter and one number.',
      minlength: 'Password must be at least 6 characters long.',
      maxlength: 'Password cannot be more than 25 characters long.',
    },
    passwordConfirm: {
      required: 'Please confirm your password',
      confirmedValidator: 'Those passwords didn\'t match. Please try again',
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
    this.auth
      .emailSignUp(this.form.value['email'], this.form.value['password'])
      .then(response => {
        const data: any = response ? { ...response } : {};
        const { code, message } = data;

        if (['auth/wrong-password', 'auth/too-many-requests'].includes(code)) {
          this.form.controls.password.setErrors({ password: message });
          this.formErrors.password = message;
        }

        if (['auth/weak-password'].includes(code)) {
          this.form.controls.password.setErrors({ password: message });
          this.formErrors.password = message;
        }

        if (['auth/email-already-in-use'].includes(code)) {
          this.form.controls.email.setErrors({ email: message });
          this.formErrors.email = message;
        }
      });
  }

  buildForm() {
    this.form = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', Validators.required],
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
        validator: ConfirmedValidator('password', 'passwordConfirm'),
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
        ['name', 'email', 'password', 'passwordConfirm'].includes(field)
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
