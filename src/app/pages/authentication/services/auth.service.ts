import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { auth } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import { NotifyService } from './notify.service';

import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ExtensionService, SiteForceLogin } from '../../../services/extension.service';

export interface User {
  displayName?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  photoURL?: string;
  ui: {
    navigation: 'side' | 'top';
    sidenavUserVisible: boolean;
    toolbarVisible: boolean;
    toolbarPosition: any;
    footerVisible: boolean;
    footerPosition: any;
    theme: 'fury-default' | 'fury-light' | 'fury-dark' | 'fury-flat';
    title: string;
    search: string;
  };
  extension?: {
    show: boolean;
    lastShown: number;
  };
  projectName?: string;
  uid: string;
  isAnonymous: boolean;
  isAdmin?: boolean;
  isBot?: boolean;
  emailAlerts?: any;
  categoriesOfInterest?: any;
  wishList?: string[];
  personalizationData?: any;
  categoriesDescriptions?: any;
  filters?: {
    offersDefaultSelected?: number;
  };
}

export interface Credential {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  ui?: any;
  extension?: {
    show: boolean;
    lastShown: number;
  };
  projectName?: string;
  isAnonymous: boolean;
  isAdmin?: boolean;
  isBot?: boolean;
  emailAlerts?: any;
  categoriesOfInterest?: any;
  wishList?: string[];
  personalizationData?: any;
  categoriesDescriptions?: any;
}

@Injectable()
export class AuthService {
  user: Observable<User | null>;
  uid: string;
  currentUser: any;
  authState: any = null;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private notify: NotifyService,
    private http: HttpClient,
    private extension: ExtensionService,
  ) {
    this.user = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          this.uid = user.uid;
          this.currentUser = user;
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      }),
    );

    this.afAuth.onAuthStateChanged(user => {
      const isBot = navigator.webdriver;
      if (!user && !isBot) {
        this.anonymousLogin();
      }

      if (user) {
        if (isBot) {
          auth().signOut();
        }

        this.uid = user.uid;
        this.getUserDocByUid(user.uid).then(doc => {
          const data = doc.data();
          if (data) {
            const dataToUpdate = user.isAnonymous ? user : { ...user, ...data };
            this.currentUser = dataToUpdate;
            this.updateUserData(dataToUpdate);
            this.router.navigate(['/']);
          }
        });
      }
    });

    this.afAuth.authState.subscribe(authState => {
      this.authState = authState;
    });
  }

  id() {
    const provider = new auth.GoogleAuthProvider();
    return this.oAuthLogin(provider);
  }

  googleLogin() {
    const provider = new auth.GoogleAuthProvider();
    return this.oAuthLogin(provider);
  }

  githubLogin() {
    const provider = new auth.GithubAuthProvider();
    return this.oAuthLogin(provider);
  }

  facebookLogin() {
    const provider = new auth.FacebookAuthProvider();
    return this.oAuthLogin(provider);
  }

  twitterLogin() {
    const provider = new auth.TwitterAuthProvider();
    return this.oAuthLogin(provider);
  }

  private oAuthLogin(provider: any) {
    return this.afAuth
      .signInWithPopup(provider)
      .then(credential => {
        this.notify.update('Welcome to Firestarter!!!', 'success');
        return this.updateUserData(credential.user);
      })
      .catch(error => this.handleError(error));
  }

  anonymousLogin() {
    return this.afAuth
      .signInAnonymously()
      .then(response => {
        // access granted for anonymous user
        this.notify.update('Welcome to Firestarter, anonymous!!!', 'success');
        this.updateUserData(response.user);
      })
      .catch(error => {
        this.handleError(error);
        // access denied
        this.router.navigate(['/login']);
      });
  }

  signInWithPhoneNumber(phoneNumber: string, recaptchaContainerId?: string) {
    window.recaptchaVerifier = new auth.RecaptchaVerifier(
      recaptchaContainerId || 'recaptcha-container',
    );

    window.recaptchaVerifier.render();

    const appVerifier = window.recaptchaVerifier;
    return this.afAuth
      .signInWithPhoneNumber(phoneNumber, appVerifier)
      .then(confirmationResult => confirmationResult)
      .catch(error => this.handleError(error));
  }

  phoneOrEmailSignUp({
    emailOrPhone,
    password,
    firstName,
    lastName,
  }: any): Promise<any> {
    if (emailOrPhone.includes('@')) {
      return this.afAuth
        .createUserWithEmailAndPassword(emailOrPhone, password)
        .then(credential => {
          this.notify.update('Welcome new user!', 'success');
          this.updateUserData({
            ...credential.user,
            firstName,
            lastName,
          });
          this.sendVerificationMail();
          this.router.navigate(['/verify-email']);
        })
        .catch(error => this.handleError(error));
    }

    return this.signInWithPhoneNumber(emailOrPhone);
  }

  phoneOrEmailLogin(emailOrPhone: string, password: string): Promise<any> {
    if (emailOrPhone.includes('@')) {
      return this.afAuth
        .signInWithEmailAndPassword(emailOrPhone, password)
        .then(result => {
          if (!result || !result.user) {
            return;
          }
          if (result.user.emailVerified) {
            if (this.extension.isExtension) {
              window.localStorage.setItem('uid', result.user.uid);
              this.extension.sendMessage(
                {
                  action: SiteForceLogin,
                  uid: result.user.uid,
                },
                null,
              );
            }

            this.notify.update('Welcome back!', 'success');
            this.router.navigate(['/']);
          } else {
            this.sendVerificationMail();
            this.notify.update(
              'Please validate your email address. Kindly check your inbox.',
              'error',
            );
            this.router.navigate(['/verify-email']);
          }
        })
        .catch(error => this.handleError(error));
    }

    return this.signInWithPhoneNumber(emailOrPhone);
  }

  async sendVerificationMail() {
    if (!this.currentUser.emailVerified) {
      return (await this.afAuth.currentUser).sendEmailVerification();
    }
  }

  resetPassword(email: string) {
    return this.afAuth
      .sendPasswordResetEmail(email)
      .then(() => this.notify.update('Password update email sent', 'info'))
      .catch(error => this.handleError(error));
  }

  isAuthenticated(): boolean {
    return this.authState !== null && !this.currentUser.isAnonymous;
  }

  isEmailVerified(): boolean {
    return this.isAuthenticated ? this.authState.emailVerified : false;
  }

  signOut() {
    return new Promise(resolve => {
      this.afAuth.signOut().then(() => {
        // signed out
        this.anonymousLogin();
        resolve(true);
      });
    });
  }

  getCustomToken(uid: string) {
    return this.http
      .get(environment.cloudFunctions + '/createToken?uid=' + uid)
      .toPromise();
  }

  signInWithCustomToken(token: string) {
    this.afAuth.signInWithCustomToken(token);
  }

  private handleError(error: Error) {
    this.notify.update(error.message, 'error');
    return error;
  }

  public getUserDocByUid(uid: string) {
    if (!uid) {
      return;
    }
    return this.afs.collection('users').doc(uid).get().toPromise();
  }

  public updateUserData(user: Credential) {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${user.uid}`,
    );

    const data: User = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      phoneNumber: user.phoneNumber || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      photoURL: user.photoURL || '',
      projectName: user.projectName || environment.projectName,
      ui: this.currentUser && this.currentUser.ui ? this.currentUser.ui : {},
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified || false,
      extension: {
        show:
          user.extension && user.extension.show ? user.extension.show : false,
        lastShown:
          user.extension && user.extension.lastShown
            ? user.extension.lastShown
            : 0,
      },
    };

    return userRef.set(data, { merge: true });
  }
}
