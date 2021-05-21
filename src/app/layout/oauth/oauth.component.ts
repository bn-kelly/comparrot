import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AuthService } from '../../pages/authentication/services/auth.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ExtensionService, SiteForceLogin } from '../../services/extension.service';

@Component({
  selector: 'fury-oauth-component',
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.scss'],
})
export class OAuthComponent {
  constructor(
    public afAuth: AngularFireAuth,
    public auth: AuthService,
    public router: Router,
    private extension: ExtensionService,
  ) {}

  handleResponse = response => {
    const [firstNameFromDisplayName, lastNameFromDisplayName] = (
      response.user.displayName || ''
    ).split(' ');
    const data = {
      ...response.user,
      firstName: response.user.firstName || firstNameFromDisplayName || '',
      lastName: response.user.lastName || lastNameFromDisplayName || '',
    };

    if (this.extension.isExtension) {
      window.localStorage.setItem('uid', data.uid);
      this.extension.sendMessage(
        {
          action: SiteForceLogin,
          uid: data.uid,
        },
        null,
      );
    }

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
