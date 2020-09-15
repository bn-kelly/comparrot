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
import { AuthService, User } from '../authentication/services/auth.service';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { EmailAlert } from './email-alert.model';
import { CategoryOfInterest } from './category-of-interest.model';
import { FAQ } from './faq.model';
import { Offer } from '../dashboard/offer.model';
import { Project } from '../../layout/project.model';
import { PersonalizationData } from './personalization-data.model';

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
  categoriesOfInterest: CategoryOfInterest[];
  personalizationData: PersonalizationData;
  faqList: FAQ[];
  wishList: Offer[];
  user: User;
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
  panelOpenState = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private afs: AngularFirestore,
  ) {
    this.isGeneralProfileUpdated = false;
    this.isGeneralProfileFormSubmitting = false;
    this.isPhotoURLFileChanged = false;
  }

  ngOnInit() {
    this.afs
      .collection('emailAlerts')
      .valueChanges()
      .subscribe((emailAlerts: EmailAlert[]) => {
        this.emailAlerts = emailAlerts;
        if (
          this.user &&
          !Array.isArray(this.user.emailAlerts) &&
          Array.isArray(this.emailAlerts)
        ) {
          const userEmailAlerts = this.emailAlerts.map(alert => alert.id);
          this.updateUserEmailAlerts(userEmailAlerts);
        }
      });

    this.afs
      .collection('categoriesOfInterest')
      .valueChanges()
      .subscribe((categoriesOfInterest: CategoryOfInterest[]) => {
        this.categoriesOfInterest = categoriesOfInterest;
        if (
          this.user &&
          !Array.isArray(this.user.categoriesOfInterest) &&
          Array.isArray(this.categoriesOfInterest)
        ) {
          const userCategoriesOfInterest = this.categoriesOfInterest.map(
            category => category.id,
          );
          this.updateUserCategoriesOfInterest(userCategoriesOfInterest);
        }
      });

    this.afs
      .collection('personalizationData')
      .doc('latest')
      .valueChanges()
      .subscribe((data: PersonalizationData) => {
        this.personalizationData = data;
        if (this.user) {
          const userPersonalizationData = this.personalizationData.data.reduce(
            (typesAcc, type) => {
              typesAcc = {
                ...typesAcc,
                [type.id]: type.categories.reduce((categoriesAcc, category) => {
                  categoriesAcc = {
                    ...categoriesAcc,
                    [category.id]: category.sizes.reduce((sizesAcc, size) => {
                      const values =
                        this.user.personalizationData &&
                        this.user.personalizationData[type.id] &&
                        this.user.personalizationData[type.id][category.id] &&
                        this.user.personalizationData[type.id][category.id][
                          size.id
                        ] &&
                        !!this.user.personalizationData[type.id][category.id][
                          size.id
                        ].length
                          ? this.user.personalizationData[type.id][category.id][
                              size.id
                            ]
                          : [];

                      sizesAcc = {
                        ...sizesAcc,
                        [size.id]: values,
                      };
                      return sizesAcc;
                    }, {}),
                  };
                  return categoriesAcc;
                }, {}),
              };
              return typesAcc;
            },
            {},
          );

          this.updateUserPersonalizationData(userPersonalizationData);
        }
      });

    this.auth.user.subscribe(user => {
      this.user = user;

      if (user) {
        this.afs
          .collection('offers')
          .doc(user.uid)
          .collection('latest')
          .valueChanges()
          .subscribe((offers: Offer[]) => {
            this.wishList = offers
              .filter(offer => this.user.wishList.includes(offer.id))
              .sort((a, b) => b.created - a.created);
          });
      }

      if (user && user.projectName) {
        this.afs
          .collection('projects')
          .doc(user.projectName)
          .valueChanges()
          .subscribe((project: Project) => {
            this.faqList = project.faq || [];
          });
      } else {
        this.faqList = [];
      }

      this.initialGeneralProfileFormData = {
        firstName: user.firstName,
        lastName: user.lastName,
        photoURL: user.photoURL,
      };
      this.buildForm(this.user);
    });
    this.toggleExpandIframe(true);
  }

  ngOnDestroy() {
    this.toggleExpandIframe(false);
  }

  buildForm(user) {
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

    window.chrome.tabs.getSelected(null, tab => {
      window.chrome.tabs.sendMessage(tab.id, {
        action: 'toggle-expand-iframe-width',
        isOpen,
      });
    });
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
    if (this.user.emailAlerts) {
      if (checked && !this.user.emailAlerts.includes(id)) {
        const emailAlerts = [...this.user.emailAlerts, id].sort();
        this.updateUserEmailAlerts(emailAlerts);
      }

      if (!checked && this.user.emailAlerts.includes(id)) {
        const emailAlerts = this.user.emailAlerts.filter(alert => alert !== id);
        this.updateUserEmailAlerts(emailAlerts);
      }
    }
  }

  toggleSelectCategoryOfInterest(id) {
    const categoriesOfInterest = this.user.categoriesOfInterest.includes(id)
      ? this.user.categoriesOfInterest.filter(category => category !== id)
      : [...this.user.categoriesOfInterest, id].sort();

    this.updateUserCategoriesOfInterest(categoriesOfInterest);
  }

  toggleSelectPersonalizationData({ type, category, size, value }) {
    const personalizationData = this.user.personalizationData[type.id][
      category.id
    ][size.id].includes(value.id)
      ? {
          ...this.user.personalizationData,
          [type.id]: {
            ...this.user.personalizationData[type.id],
            [category.id]: {
              ...this.user.personalizationData[type.id][category.id],
              [size.id]: this.user.personalizationData[type.id][category.id][
                size.id
              ].filter(item => item !== value.id),
            },
          },
        }
      : {
          ...this.user.personalizationData,
          [type.id]: {
            ...this.user.personalizationData[type.id],
            [category.id]: {
              ...this.user.personalizationData[type.id][category.id],
              [size.id]: [
                ...this.user.personalizationData[type.id][category.id][size.id],
                value.id,
              ].sort((a, b) => a - b),
            },
          },
        };

    this.updateUserPersonalizationData(personalizationData);
  }

  updateUserEmailAlerts(emailAlerts = []) {
    this.afs.collection('users').doc(this.user.uid).update({ emailAlerts });
  }

  updateUserCategoriesOfInterest(categoriesOfInterest = []) {
    this.afs
      .collection('users')
      .doc(this.user.uid)
      .update({ categoriesOfInterest });
  }

  updateUserPersonalizationData(personalizationData) {
    this.afs
      .collection('users')
      .doc(this.user.uid)
      .update({ personalizationData });
  }

  deleteItemFromWishList(event, id) {
    event.preventDefault();
    const wishList = this.wishList
      .filter(item => item.id !== id)
      .map(item => item.id)
      .sort();

    this.afs.collection('users').doc(this.user.uid).update({ wishList });
  }
}
