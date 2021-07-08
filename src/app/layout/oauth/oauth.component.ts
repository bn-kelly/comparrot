import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import { AuthService } from '../../pages/authentication/services/auth.service';
import { MessageService } from '../../services/message.service';
import { SiteForceLogin } from '../../constants';
import { Autowire } from '@coturiv/firebase/app';

@Component({
  selector: 'fury-oauth-component',
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.scss'],
})
export class OAuthComponent {
  @Autowire()
  afAuth: AngularFireAuth;

  @Autowire()
  auth: AuthService;

  @Autowire()
  router: Router;

  @Autowire()
  private message: MessageService;

  constructor(
  ) {}

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

    this.auth.updateUserData(data);
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
