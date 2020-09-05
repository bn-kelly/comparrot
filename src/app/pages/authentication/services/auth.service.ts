import { Injectable } from '@angular/core';
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

export interface User {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
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
  emailAlerts?: number[];
  categoriesOfInterest?: number[];
  wishList?: string[];
  personalizationData?: any;
}

export interface Credential {
  uid: string;
  email?: string;
  displayName?: string;
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
  emailAlerts?: number[];
  categoriesOfInterest?: number[];
  wishList?: string[];
  personalizationData?: any;
}

@Injectable()
export class AuthService {
  user: Observable<User | null>;
  uid: string;
  currentUser: any;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private notify: NotifyService,
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
      if (!user) {
        this.anonymousLogin();
      } else {
        this.uid = user.uid;
        this.afs
          .collection('users')
          .doc(user.uid)
          .get()
          .subscribe(doc => {
            const data = doc.data();
            if (data) {
              const dataToUpdate = user.isAnonymous
                ? user
                : { ...user, ...data };
              this.currentUser = dataToUpdate;

              this.updateUserData(dataToUpdate);
            }
          });
      }
    });
  }

  ////// OAuth Methods /////
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

  //// Anonymous Auth ////

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

  //// Email/Password Auth ////

  emailSignUp(email: string, password: string) {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then(credential => {
        this.notify.update('Welcome new user!', 'success');
        this.updateUserData(credential.user);
        this.sendVerificationMail();
        this.router.navigate(['/verify-email']);
      })
      .catch(error => this.handleError(error));
  }

  emailLogin(email: string, password: string) {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then(result => {
        if (!result || !result.user) {
          return;
        }
        if (result.user.emailVerified) {
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

  // Send email verfificaiton when new user sign up
  async sendVerificationMail() {
    if (!this.currentUser.emailVerified) {
      return (await this.afAuth.currentUser).sendEmailVerification();
    }
  }

  // Sends email allowing user to reset password
  resetPassword(email: string) {
    return this.afAuth
      .sendPasswordResetEmail(email)
      .then(() => this.notify.update('Password update email sent', 'info'))
      .catch(error => this.handleError(error));
  }

  signOut() {
    return new Promise(resolve => {
      this.afAuth.signOut().then(() => {
        // signed out
        this.anonymousLogin();
        resolve();
      });
    });
  }

  // If error, console log and notify user
  private handleError(error: Error) {
    this.notify.update(error.message, 'error');
    return error;
  }

  // Sets user data to firestore after succesful login
  public updateUserData(user: Credential) {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `users/${user.uid}`,
    );

    const data: User = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      photoURL: user.photoURL || '',
      projectName: user.projectName || environment.projectName,
      ui: this.currentUser && this.currentUser.ui ? this.currentUser.ui : {},
      isAnonymous: user.isAnonymous,
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
