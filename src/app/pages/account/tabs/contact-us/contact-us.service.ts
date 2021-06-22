import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import firebase from "firebase/app";

import { AuthService } from '../../../authentication/services/auth.service';
import { environment } from '../../../../../environments/environment';

export interface ContactUsData {
  topic?: string;
  message?: string;
}

export interface EmailData extends ContactUsData {
  displayName: string;
  email: string;
}

export interface MailTemplate {
  name: string;
  data: EmailData;
}

export interface Email {
  to: [string];
  template: MailTemplate;
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
      .collection(`projects`)
      .doc(environment.projectName)
      .get()
      .then(doc => {
        this.adminEmails = doc.exists ? doc.data().contactUsEmails : [];
      })
      .catch(e => console.error('Error get to mails: ', e));
  }

  createEmailData(data: ContactUsData): EmailData {
    return {
      displayName: this.auth.currentUser.displayName || '',
      email: this.auth.currentUser.email,
      ...data,
    } as EmailData;
  }

  sendEmail(data: ContactUsData): Promise<string> {
    if (
      this.auth.currentUser &&
      this.auth.currentUser.email &&
      this.adminEmails
    ) {
      const mailTemplate: MailTemplate = {
        name: 'report',
        data: this.createEmailData(data),
      };

      const email: Email = {
        template: mailTemplate,
        to: this.adminEmails,
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
