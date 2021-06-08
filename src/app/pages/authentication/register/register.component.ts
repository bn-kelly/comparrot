import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../models/project.model';
import { MatchingValidator } from './matching.validator';

type UserFields =
  | 'firstname'
  | 'lastname'
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
  firstName: '';
  lastName: '';
  email: '';
  password: '';
  formErrors: FormErrors = {
    firstname: '',
    lastname: '',
    email: '',
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
    email: {
      required: 'Please enter your email',
      email: 'Must be a valid email',
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
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
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
    this.email = this.form.value['email'];
    this.password = this.form.value['password'];

    this.auth
      .emailSignUp({
        email: this.email,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
      })
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
        firstname: ['', Validators.required],
        lastname: ['', Validators.required],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
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
