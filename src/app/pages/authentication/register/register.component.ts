import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AuthService } from '../services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { ThemeService } from '../../../../@fury/services/theme.service';
import { Project } from '../../../layout/project.model';

type UserFields = 'name' | 'email' | 'password' | 'passwordConfirm';
type FormErrors = { [u in UserFields]: string };

@Component({
  selector: 'fury-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [fadeInUpAnimation]
})
export class RegisterComponent implements OnInit {

  form: FormGroup;
  formErrors: FormErrors = {
    'name': '',
    'email': '',
    'password': '',
    'passwordConfirm': '',
  };
  validationMessages = {
    'name': {
      'required': 'Name is required',
    },
    'email': {
      'required': 'Email is required.',
      'email': 'Email must be a valid email',
    },
    'password': {
      'required': 'Password is required.',
      'pattern': 'Password must be include at one letter and one number.',
      'minlength': 'Password must be at least 4 characters long.',
      'maxlength': 'Password cannot be more than 40 characters long.',
    },
  };

  inputType = 'password';
  visible = false;
  logoUrl: string;
  project: Project;
  projectName: string;
  themeName: string;

  constructor(private router: Router,
              private fb: FormBuilder,
              private cd: ChangeDetectorRef,
              private afs: AngularFirestore,
              private auth: AuthService,
              private themeService: ThemeService,
  ) { }

  ngOnInit() {
    const isExtension = !!window.chrome && !!window.chrome.extension;

    this.buildForm();

    this.themeService.theme$.subscribe(([prevTheme, currentTheme]) => {
      this.themeName = currentTheme.replace('fury-', '');
      this.handleLogoUrl();
    });

    this.afs.collection('projects').doc('comparrot').valueChanges().subscribe((project: Project) => {
      this.project = project;
      this.projectName = project && project.name ? project.name : '';
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
  }

  handleLogoUrl() {
    this.logoUrl = this.project && this.project.logoUrl
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
    this.auth.emailSignUp(this.form.value['email'], this.form.value['password'])
        .then(response => {
          const data: any  = response ? { ...response } : {};
          const { code, message } = data;

          if (['auth/wrong-password', 'auth/too-many-requests'].includes(code)) {
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
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      passwordConfirm: ['', Validators.required],
    });

    this.form.valueChanges.subscribe((data) => this.onValueChanged(data));
    this.onValueChanged(); // reset validation messages
  }

  // Updates validation state on form changes.
  onValueChanged(data?: any) {
    if (!this.form) { return; }
    const form = this.form;
    for (const field in this.formErrors) {
      if (Object.prototype.hasOwnProperty.call(this.formErrors, field) && ['name', 'email', 'password'].includes(field)) {
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
