import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import firebase from 'firebase/app';

import { AuthService } from '../../../authentication/services/auth.service';
import { environment } from '../../../../../environments/environment';

export interface Message {
  subject?: string;
  html?: string;
  text?: string;
}

export interface Email {
  to: [string];
  message: Message;
}

@Injectable({
  providedIn: 'root',
})
export class ContactUsService {
  currentUser: firebase.User;
  adminEmails: [string];

  constructor(private auth: AuthService, private afs: AngularFirestore) {
    this.currentUser = this.auth.currentUser;
    this.afs.firestore
      .collection(`project`)
      .doc(environment.projectName)
      .get()
      .then(doc => {
        this.adminEmails = doc.exists ? doc.data().contactUsEmails : [];
      })
      .catch(e => console.error('Error get to mails: ', e));
  }

  sendEmail(subject: string, content: string): Promise<string> {
    if (
      this.auth.currentUser &&
      this.auth.currentUser.email &&
      this.adminEmails
    ) {
      const message: Message = {
        subject: 'Comparrot Support',
        html: `From: ${this.auth.currentUser.displayName} <br> \
               Email: ${this.auth.currentUser.email} <br> \
               Subject: ${subject} <br> \
               Message: ${content}`,
      };
      const email: Email = {
        to: this.adminEmails,
        message,
      };
      return new Promise<string>(resolve => {
        this.afs
          .collection('mail')
          .add(email)
          .then(ref => resolve(ref.id));
      });
    }
    return new Promise<string>(reject => {
      reject('error: not valid data');
    });
  }
}
