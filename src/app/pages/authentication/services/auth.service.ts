import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import firebase from 'firebase/app';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { NotifyService } from './notify.service';
import { environment } from '../../../../environments/environment';
import { MessageService } from '../../../services/message.service';
import { SiteForceLogin } from '../../../constants';
import { User } from '../../../models/user.model';
import { Credential } from '../../../models/credential.model';
import { AnalyticsService } from 'src/app/services/analytics.service';

@Injectable()
export class AuthService {
  user: Observable<User | null>;
  uid: string;
  authState: any = null;

  user$: BehaviorSubject<any>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router,
    private notify: NotifyService,
    private http: HttpClient,
    private message: MessageService,
    private ngZone: NgZone,
    private analyticsService: AnalyticsService
  ) {
    this.user = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          this.uid = user.uid;
          return this.afs.doc<User>(`user/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      }),
      tap(user => {
        this.currentUser = user;
      })
    );

    this.user$ = new BehaviorSubject(null);

    this.afAuth.onAuthStateChanged(async user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.uid = user.uid;
      const doc = await this.getUserDocByUid(user.uid);
      const data: any = doc.data();

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

  set currentUser(user: any) {
    this.user$.next(user);
  }

  get currentUser() {
    return this.user$.value;
  }

  loadUserData(): Observable<any> {
    return this.afAuth.authState.pipe(
      switchMap((auth) => (auth && !auth.isAnonymous ? this.afs.doc<User>(`user/${auth.uid}`).valueChanges() : of(null))),
      take(1),
      map((user) => {
        return (this.currentUser = user);
      })
    );
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

  emailSignUp({ email, password, firstName, lastName }: any): Promise<any> {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then(credential => {
        this.notify.update('Welcome new user!', 'success');
        this.updateUserData({
          ...credential.user,
          firstName,
          lastName,
        }, true);
        window.localStorage.setItem('uid', credential.user.uid);
        this.router.navigate(['/']);
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
        window.localStorage.setItem('uid', result.user.uid);
        this.message.postMessage(
          SiteForceLogin,
          {
            uid: result.user.uid,
          }
        );

        this.notify.update('Welcome back!', 'success');
        this.router.navigate(['/']);
      })
      .catch(error => this.handleError(error));
  }

  resetPassword(email: string) {
    return this.afAuth
      .sendPasswordResetEmail(email)
      .then(() => this.notify.update('Password update email sent', 'info'))
      .catch(error => this.handleError(error));
  }

  isAuthenticated(): boolean {
    return this.authState !== null && this.currentUser && !this.currentUser.isAnonymous;
  }

  signOut() {
    return new Promise(resolve => {
      this.afAuth.signOut().then(async () => {
        resolve(true);
      });
    });
  }

  getCustomToken(uid: string) {
    return this.http
      .get(environment.cloudFunctions + '/createToken?uid=' + uid)
      .toPromise();
  }

  async signInWithCustomToken(token: string) {
    await this.afAuth.signInWithCustomToken(token);
  }

  async signInWithUid(uid: string) {
    if (!uid) {
      return;
    }

    if (uid === 'null' && this.isAuthenticated()) {
      await this.signOut();
      return;
    }

    if (uid !== 'null' && !this.isAuthenticated()) {
      const data: any = await this.getCustomToken(uid);

      if (data.token) {
        await this.signInWithCustomToken(data.token);
      }
    }
  }

  private handleError(error: Error) {
    this.notify.update(error.message, 'error');
    return error;
  }

  public getUserDocByUid(uid: string) {
    if (!uid) {
      return;
    }
    return this.afs.collection('user').doc(uid).get().toPromise();
  }

  public async updateUserData(user: Credential, isFirstSignIn = false) {
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(
      `user/${user.uid}`,
    );

    if (isFirstSignIn) {
      await this.analyticsService.logEvent('new_user', {
        user: user.uid,
      });
    }

    const data: User = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      phoneNumber: user.phoneNumber || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      photoURL: user.photoURL || '',
      isAnonymous: user.isAnonymous,
      isFirstSignIn,
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
