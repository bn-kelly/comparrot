import {
  Component,
  ViewChild,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { AuthService } from '../authentication/services/auth.service';
import { User } from '../../models/user.model';
import { EmailAlert } from '../../models/email-alert.model';
import { CategoryOfInterest } from '../../models/category-of-interest.model';
import { Offer } from '../../models/offer.model';
import { Project } from '../../models/project.model';
import { PersonalizationData } from '../../models/personalization-data.model';
import { MessageService } from '../../services/message.service';
import { ToggleExpandIframeWidth } from '../../constants';
import { FirebaseService } from '@coturiv/firebase/app';
import { take } from 'rxjs/operators';

type Fields = 'firstName' | 'lastName' | 'photoURL';
type FormErrors = { [u in Fields]: string };

@Component({
  selector: 'fury-account-settings-component',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AccountComponent implements OnInit, OnDestroy {
  @ViewChild(MatAccordion) accordion: MatAccordion;

  initialGeneralProfileFormData: {
    firstName: string;
    lastName: string;
    photoURL: string;
  };
  isGeneralProfileUpdated: boolean;
  isGeneralProfileFormSubmitting: boolean;
  isPhotoURLFileChanged: boolean;
  emailAlerts: EmailAlert[];
  wishList: Offer[];
  user: User;
  projectName: string;
  form: FormGroup;
  formErrors: FormErrors = {
    firstName: '',
    lastName: '',
    photoURL: '',
  };
  validationMessages = {
    firstName: {
      required: 'First name is required.',
      minlength: 'First name must be at least 2 characters long.',
      maxlength: 'First name cannot be more than 255 characters long.',
    },
    lastName: {
      required: 'Last name is required.',
      minlength: 'Last name must be at least 2 characters long.',
      maxlength: 'Last name cannot be more than 255 characters long.',
    },
  };
  imageChangedEvent: any = '';
  croppedImage: any = '';

  userInterests = [];
  userSizes = [];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private afs: AngularFirestore,
    private message: MessageService,
    private firebaseService: FirebaseService
  ) {
    this.isGeneralProfileUpdated = false;
    this.isGeneralProfileFormSubmitting = false;
    this.isPhotoURLFileChanged = false;
  }

  async ngOnInit() {
    this.user = this.auth.currentUser;
    const { projectName, firstName, lastName, photoURL, uid} = this.user;
    this.projectName = projectName;

    this.buildForm(this.user);
    this.toggleExpandIframe(true);

    const { interests, sizes } = await this.firebaseService.docAsPromise(`user_context/${uid}`);

    this.userInterests = interests;
    this.userSizes = sizes;

    if (
      this.projectName &&
      !this.emailAlerts
    ) {
      this.afs
        .collection('project')
        .doc(this.projectName)
        .valueChanges()
        .subscribe((project: Project) => {
          this.emailAlerts = project.emailAlerts || [];

          if (
            !this.user.emailAlerts ||
            (!Array.isArray(this.user.emailAlerts[this.projectName]) &&
              Array.isArray(this.emailAlerts))
          ) {
            const userEmailAlerts = this.emailAlerts.map(alert => alert.id);
            this.updateUserEmailAlerts(userEmailAlerts);
          }
        });
        
      }
      this.initialGeneralProfileFormData = {firstName, lastName, photoURL};
      
  }

  ngOnDestroy() {
    this.toggleExpandIframe(false);
  }

  buildForm(user) {
    if (!user) {
      return;
    }
    this.form = this.fb.group({
      firstName: [
        user.firstName,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(225),
        ],
      ],
      lastName: [
        user.lastName,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(225),
        ],
      ],
      photoURL: [user.photoURL],
    });

    this.form.valueChanges.subscribe(() => this.onValueChanged());
  }

  onValueChanged() {
    if (!this.form) {
      return;
    }
    const form = this.form;
    for (const field in this.formErrors) {
      if (
        Object.prototype.hasOwnProperty.call(this.formErrors, field) &&
        ['firstName', 'lastName'].includes(field)
      ) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          if (control.errors) {
            for (const key in control.errors) {
              if (
                Object.prototype.hasOwnProperty.call(control.errors, key) &&
                messages[key]
              ) {
                this.formErrors[field] += `${
                  (messages as { [key: string]: string })[key]
                } `;
              }
            }
          }
        }
      }
    }
  }

  toggleExpandIframe(isOpen) {
    if (!window.chrome || !window.chrome.tabs) {
      return;
    }

    this.message.sendMessageToTab(
      {
        action: ToggleExpandIframeWidth,
        isOpen,
      },
      null,
    );
  }

  areGeneralProfileFormButtonsDisabled = () =>
    this.form.pristine || this.isGeneralProfileFormSubmitting;

  changeUserPhotoURL(event: any): void {
    this.imageChangedEvent = event;
    this.isPhotoURLFileChanged = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
    this.form.patchValue({ photoURL: this.croppedImage });
    this.form.markAsDirty();
  }

  updateGeneralProfile() {
    if (!this.form.valid) {
      return;
    }

    const { firstName, lastName, photoURL } = this.form.value;
    const data = {
      ...this.user,
      firstName,
      lastName,
      photoURL,
    };

    this.isGeneralProfileFormSubmitting = true;

    this.auth.updateUserData(data).then(() => {
      this.isGeneralProfileFormSubmitting = false;
      this.isGeneralProfileUpdated = true;
      this.isPhotoURLFileChanged = false;

      setTimeout(() => {
        this.isGeneralProfileUpdated = false;
      }, 3000);
    });
  }

  resetGeneralProfile() {
    const userPhotoURLFileInput = document.getElementById(
      'userPhotoURL',
    ) as HTMLInputElement;
    if (userPhotoURLFileInput) {
      userPhotoURLFileInput.value = '';
    }
    this.isPhotoURLFileChanged = false;
    this.buildForm(this.initialGeneralProfileFormData);
  }

  emailAlertChange({ id, checked }) {
    if (
      this.user.emailAlerts &&
      Array.isArray(this.user.emailAlerts[this.projectName])
    ) {
      if (checked && !this.user.emailAlerts[this.projectName].includes(id)) {
        const emailAlerts = [
          ...this.user.emailAlerts[this.projectName],
          id,
        ].sort();
        this.updateUserEmailAlerts(emailAlerts);
      }

      if (!checked && this.user.emailAlerts[this.projectName].includes(id)) {
        const emailAlerts = this.user.emailAlerts[this.projectName].filter(
          alert => alert !== id,
        );
        this.updateUserEmailAlerts(emailAlerts);
      }
    }
  }

  async updateUserInterests(interests: string[]) {
    await this.firebaseService.set(`user_context/${this.user.uid}`, { interests }, true);
  }

  async updateSizingPreference(sizes: any[]) {
    await this.firebaseService.set(`user_context/${this.user.uid}`, { sizes }, true);
  }

  updateUserEmailAlerts(emailAlerts = []) {
    this.afs
      .collection('user')
      .doc(this.user.uid)
      .set(
        { emailAlerts: { [this.projectName]: emailAlerts } },
        { merge: true },
      );
  }

  deleteItemFromWishList(event, id) {
    event.preventDefault();
    const wishList = this.wishList
      .filter(item => item.id !== id)
      .map(item => item.id)
      .sort();

    this.afs.collection('user').doc(this.user.uid).update({ wishList });
  }
}
