import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
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
import { environment } from 'src/environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import firebase from 'firebase/app';
import { SiteForceLogin } from 'src/app/constants';
import { MessageService } from 'src/app/services/message.service';
import { AngularFireAuth } from '@angular/fire/auth';

type UserFields =
  | 'email'
  | 'password';
type FormErrors = { [u in UserFields]: string };

@Component({
  selector: 'fury-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [fadeInUpAnimation],
  encapsulation: ViewEncapsulation.None,
})
export class RegisterComponent implements OnInit, OnDestroy {
  form: FormGroup;
  email: '';
  password: '';
  formErrors: FormErrors = {
    email: '',
    password: ''
  };
  validationMessages = {
    email: {
      required: 'Please enter your email',
      email: 'Must be a valid email',
    }
  };

  inputType = 'password';
  visible = false;
  submitted = false;

  strengthOfPassword = [];

  untilFn: Subject<any>;

  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    public sanitizer: DomSanitizer, 
    private router: Router, 
    private message: MessageService,
    private afAuth: AngularFireAuth
  ) {
    this.untilFn = new Subject();
  }

  ngOnInit() {
    this.buildForm();

    this.form.controls['password'].valueChanges.pipe(takeUntil(this.untilFn)).subscribe((value: string) => {
      this.strengthOfPassword = [];

      if (!value) {
        return;
      }

      if (value.match('^(?=.*[a-z])(?=.*[A-Z])')?.length) {
        this.strengthOfPassword.push('match-ul-case');
      }

      if (value.match('^(?=.*?[0-9])(?=.*[@$!%*#?&])')?.length) {
        this.strengthOfPassword.push('match-ds-case');
      }

      if (value.length >= 8) {
        this.strengthOfPassword.push('match-length');
      }
    });
  }

  ngOnDestroy() {
    this.untilFn.next();
    this.untilFn.complete();
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

    this.email = this.form.value['email'];
    this.password = this.form.value['password'];

    this.auth
      .emailSignUp({
        email: this.email,
        password: this.password
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
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$'),
            Validators.minLength(8)
          ],
        ]
      }
    );

    this.form.valueChanges.subscribe(() => this.onValueChanged());
    this.onValueChanged(); // reset validation messages
  }

  // Updates validation state on form changes.
  onValueChanged() {
    if (!this.form) {
      return;
    }

    this.formErrors['email'] = '';
    const emailCtr = this.form.controls['email'];
    emailCtr.valueChanges.subscribe(() => {
      const messages = this.validationMessages['email'];
          if (emailCtr.errors) {
            for (const key in emailCtr.errors) {
              if (
                Object.prototype.hasOwnProperty.call(emailCtr.errors, key) &&
                messages[key]
              ) {
                this.formErrors['email'] += `${
                  (messages as { [key: string]: string })[key]
                } `;
              }
            }
          }
    })
  }

  handleResponse = (response: any) => {
    const [firstNameFromDisplayName, lastNameFromDisplayName] = (
      response.user.displayName || ''
    ).split(' ');
    const data = {
      ...response.user,
      firstName: response.user.firstName || firstNameFromDisplayName || '',
      lastName: response.user.lastName || lastNameFromDisplayName || '',
    };

    window.localStorage.setItem('uid', data.uid);
    this.message.sendMessageToTab(
      {
        action: SiteForceLogin,
        uid: data.uid,
      }
    );

    this.auth.updateUserData(data, true);
    this.router.navigate(['/']);
  };

  doGoogleLogin() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      this.afAuth
        .signInWithPopup(provider)
        .then(response => {
          resolve(response);
          this.handleResponse(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  doFacebookLogin() {
    return new Promise<any>((resolve, reject) => {
      const provider = new firebase.auth.FacebookAuthProvider();
      this.afAuth.signInWithPopup(provider).then(
        response => {
          resolve(response);
          this.handleResponse(response);
        },
        error => {
          reject(error);
        },
      );
    });
  }
}
