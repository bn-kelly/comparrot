import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NotifyService } from './notify.service';
import { environment } from '../../../../environments/environment';
import { MessageService } from '../../../services/message.service';
import { SiteForceLogin } from '../../../constants';
import { User } from '../../../models/user.model';
import { Credential } from '../../../models/credential.model';

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
    private message: MessageService,
    private ngZone: NgZone,
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

    this.afAuth.onAuthStateChanged(async user => {
      if (!user) {
        await this.anonymousLogin();
        return;
      }

      this.uid = user.uid;
      const doc = await this.getUserDocByUid(user.uid);
      const data = doc.data();

      if (data) {
        const dataToUpdate = user.isAnonymous ? user : { ...user, ...data };
        this.currentUser = dataToUpdate;
        await this.updateUserData(dataToUpdate);
        await this.ngZone.run(() => this.router.navigate(['/']));
      }
    });

    this.afAuth.authState.subscribe(authState => {
      this.authState = authState;
    });
  }

  id() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.oAuthLogin(provider);
  }

  googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.oAuthLogin(provider);
  }

  githubLogin() {
    const provider = new firebase.auth.GithubAuthProvider();
    return this.oAuthLogin(provider);
  }

  facebookLogin() {
    const provider = new firebase.auth.FacebookAuthProvider();
    return this.oAuthLogin(provider);
  }

  twitterLogin() {
    const provider = new firebase.auth.TwitterAuthProvider();
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
      .then(async response => {
        // access granted for anonymous user
        this.notify.update('Welcome to Firestarter, anonymous!!!', 'success');
        await this.updateUserData(response.user);
      })
      .catch(async error => {
        this.handleError(error);
        // access denied
        await this.router.navigate(['/login']);
      });
  }

  emailSignUp({ email, password, firstName, lastName }: any): Promise<any> {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
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

  emailLogin(email: string, password: string): Promise<any> {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then(result => {
        if (!result || !result.user) {
          return;
        }
        if (result.user.emailVerified) {
          window.localStorage.setItem('uid', result.user.uid);
          this.message.sendMessage(
            {
              action: SiteForceLogin,
              uid: result.user.uid,
            },
            null,
          );

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
      this.afAuth.signOut().then(async () => {
        // signed out
        await this.anonymousLogin();
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
