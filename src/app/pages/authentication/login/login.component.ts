import {
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AngularFireAuth } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'src/app/services/message.service';
import firebase from 'firebase/app';
import { SiteForceLogin } from 'src/app/constants';

@Component({
  selector: 'fury-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeInUpAnimation],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit {

  constructor(private afAuth: AngularFireAuth, private auth: AuthService, private router: Router, private message: MessageService) {
  }



  ngOnInit() {
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
    this.message.postMessage(SiteForceLogin,  { uid: data.uid });
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
