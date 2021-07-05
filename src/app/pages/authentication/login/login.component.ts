import firebase from 'firebase/app';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/firestore';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../models/project.model';

type UserFields = 'email' | 'password' | 'rememberMe';
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
  email: '';
  password: '';
  rememberMe: false;
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
    rememberMe: '',
  };
  validationMessages = {
    email: {
      required: 'Please enter your email',
      email: 'Must be a valid email',
    },
    password: {
      required: 'Please enter your password',
    },
  };

  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private afs: AngularFirestore,
    private authService: AuthService,
    private themeService: ThemeService,
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.buildForm();

    this.themeService.theme$.subscribe(([currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.afs
      .collection('project')
      .doc('comparrot')
      .valueChanges()
      .subscribe((project: Project) => {
        this.project = project;
        this.handleLogoUrl();
      });
  }

  handleLogoUrl() {
    this.logoUrl =
      this.project && this.project.logoUrl
        ? this.project.logoUrl[this.themeName] || this.project.logoUrl.default
        : '';
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

  rememberUser() {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  }

  login() {
    if (!this.form.valid) {
      return;
    }

    this.email = this.form.value['email'];
    this.password = this.form.value['password'];
    this.rememberMe = this.form.value['rememberMe'];

    this.authService.emailLogin(this.email, this.password).then(response => {
      const data: any = response ? { ...response } : {};
      const { code, message } = data;

      if (['auth/wrong-password', 'auth/too-many-requests'].includes(code)) {
        this.form.controls.password.setErrors({ password: message });
        this.formErrors.password = message;
      }

      if (['auth/user-not-found'].includes(code)) {
        this.form.controls.email.setErrors({ email: message });
        this.formErrors.email = message;
      }

      if (!response && this.rememberMe) {
        this.rememberUser();
      }
    });
  }

  resetPassword() {
    this.authService
      .resetPassword(this.form.value['email'])
      .then(() => (this.passReset = true));
  }

  buildForm() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
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
