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
import { FAQ } from '../../models/faq.model';
import { Offer } from '../../models/offer.model';
import { Project } from '../../models/project.model';
import { PersonalizationData } from '../../models/personalization-data.model';
import { MessageService } from '../../services/message.service';
import { ToggleExpandIframeWidth } from '../../constants';

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
  categorySizesDivider = ', ';
  faqList: FAQ[];
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
  panelOpenState = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private afs: AngularFirestore,
    private message: MessageService,
  ) {
    this.isGeneralProfileUpdated = false;
    this.isGeneralProfileFormSubmitting = false;
    this.isPhotoURLFileChanged = false;
  }

  ngOnInit() {
    this.auth.user.subscribe(user => {
      this.user = user;

      if (user) {
        // this.afs
        //   .collection('offers')
        //   .doc(user.uid)
        //   .collection('latest')
        //   .valueChanges()
        //   .subscribe((offers: Offer[]) => {
        //     this.wishList = offers
        //       .filter(offer => this.user.wishList.includes(offer.id))
        //       .sort((a, b) => b.created - a.created);
        //   });
        this.projectName = user.projectName;
      }

      if (
        user &&
        this.projectName &&
        !this.faqList &&
        !this.categoriesOfInterest &&
        !this.emailAlerts &&
        !this.personalizationData
      ) {
        this.afs
          .collection('project')
          .doc(this.projectName)
          .valueChanges()
          .subscribe((project: Project) => {
            this.faqList = project.faq || [];
            this.categoriesOfInterest = project.categoriesOfInterest || [];
            this.emailAlerts = project.emailAlerts || [];
            this.personalizationData = project.personalizationData || {
              types: [],
            };

            if (
              !this.user.categoriesOfInterest ||
              (!Array.isArray(
                this.user.categoriesOfInterest[this.projectName],
              ) &&
                Array.isArray(this.categoriesOfInterest))
            ) {
              this.updateUserCategoriesOfInterest([]);
            }

            if (
              !this.user.emailAlerts ||
              (!Array.isArray(this.user.emailAlerts[this.projectName]) &&
                Array.isArray(this.emailAlerts))
            ) {
              const userEmailAlerts = this.emailAlerts.map(alert => alert.id);
              this.updateUserEmailAlerts(userEmailAlerts);
            }

            if (
              !this.user.personalizationData ||
              !this.user.personalizationData[this.projectName] ||
              (!Array.isArray(
                this.user.personalizationData[this.projectName].types,
              ) &&
                this.personalizationData &&
                Array.isArray(this.personalizationData.types))
            ) {
              const userPersonalizationData = this.personalizationData.types.reduce(
                (typesAcc, type) => {
                  typesAcc = {
                    ...typesAcc,
                    [type.id]: type.categories.reduce(
                      (categoriesAcc, category) => {
                        categoriesAcc = {
                          ...categoriesAcc,
                          [category.id]: category.sizes.reduce(
                            (sizesAcc, size) => {
                              const values =
                                this.user.personalizationData &&
                                this.user.personalizationData[
                                  this.projectName
                                ] &&
                                this.user.personalizationData[this.projectName][
                                  type.id
                                ] &&
                                this.user.personalizationData[this.projectName][
                                  type.id
                                ][category.id] &&
                                this.user.personalizationData[this.projectName][
                                  type.id
                                ][category.id][size.id] &&
                                !!this.user.personalizationData[
                                  this.projectName
                                ][type.id][category.id][size.id].length
                                  ? this.user.personalizationData[
                                      this.projectName
                                    ][type.id][category.id][size.id]
                                  : [];

                              sizesAcc = {
                                ...sizesAcc,
                                [size.id]: values,
                              };
                              return sizesAcc;
                            },
                            {},
                          ),
                        };
                        return categoriesAcc;
                      },
                      {},
                    ),
                  };
                  return typesAcc;
                },
                {},
              );

              const categoriesDescriptions = this.personalizationData.types.reduce(
                (typesAcc, type) => {
                  typesAcc = {
                    ...typesAcc,
                    [type.id]: type.categories.reduce(
                      (categoriesAcc, category) => {
                        categoriesAcc = {
                          ...categoriesAcc,
                          [category.id]:
                            this.user.personalizationData &&
                            this.user.personalizationData[this.projectName] &&
                            this.user.personalizationData[this.projectName][
                              type.id
                            ] &&
                            this.user.personalizationData[this.projectName][
                              type.id
                            ][category.id]
                              ? category.sizes.reduce((result, size) => {
                                  const values =
                                    this.user.personalizationData &&
                                    this.user.personalizationData[
                                      this.projectName
                                    ][type.id][category.id][size.id]
                                      ? size.values
                                          .filter(value =>
                                            this.user.personalizationData[
                                              this.projectName
                                            ][type.id][category.id][
                                              size.id
                                            ].includes(value.id),
                                          )
                                          .map(value => value.title)
                                      : [];

                                  result = result
                                    ? [
                                        ...result.split(
                                          this.categorySizesDivider,
                                        ),
                                        ...values,
                                      ].join(this.categorySizesDivider)
                                    : values.join(this.categorySizesDivider);

                                  return result;
                                }, '')
                              : '',
                        };
                        return categoriesAcc;
                      },
                      {},
                    ),
                  };

                  return typesAcc;
                },
                {},
              );

              this.updateUserPersonalizationData(userPersonalizationData);
              this.updateUserCategoriesDescriptions(categoriesDescriptions);
            }
          });

        this.initialGeneralProfileFormData = {
          firstName: user.firstName,
          lastName: user.lastName,
          photoURL: user.photoURL,
        };
      }
      this.buildForm(this.user);
    });
    this.toggleExpandIframe(true);
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

    this.message.sendMessage(
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

  toggleSelectCategoryOfInterest(id) {
    const categoriesOfInterest = this.user.categoriesOfInterest[
      this.projectName
    ].includes(id)
      ? this.user.categoriesOfInterest[this.projectName].filter(
          category => category !== id,
        )
      : [...this.user.categoriesOfInterest[this.projectName], id].sort();

    this.updateUserCategoriesOfInterest(categoriesOfInterest);
  }

  toggleSelectPersonalizationData({ type, category, size, value }) {
    const personalizationData = this.user.personalizationData[this.projectName][
      type.id
    ][category.id][size.id].includes(value.id)
      ? {
          ...this.user.personalizationData[this.projectName],
          [type.id]: {
            ...this.user.personalizationData[this.projectName][type.id],
            [category.id]: {
              ...this.user.personalizationData[this.projectName][type.id][
                category.id
              ],
              [size.id]: this.user.personalizationData[this.projectName][
                type.id
              ][category.id][size.id].filter(item => item !== value.id),
            },
          },
        }
      : {
          ...this.user.personalizationData[this.projectName],
          [type.id]: {
            ...this.user.personalizationData[this.projectName][type.id],
            [category.id]: {
              ...this.user.personalizationData[this.projectName][type.id][
                category.id
              ],
              [size.id]: [
                ...this.user.personalizationData[this.projectName][type.id][
                  category.id
                ][size.id],
                value.id,
              ].sort((a, b) => a - b),
            },
          },
        };

    const categoriesDescriptions = {
      ...this.user.categoriesDescriptions[this.projectName],
      [type.id]: {
        ...this.user.categoriesDescriptions[this.projectName][type.id],
        [category.id]: this.toggleCategorySizes({
          typeId: type.id,
          categoryId: category.id,
          sizeValueTitle: value.title,
        }),
      },
    };

    this.updateUserPersonalizationData(personalizationData);
    this.updateUserCategoriesDescriptions(categoriesDescriptions);
  }

  toggleCategorySizes({ typeId, categoryId, sizeValueTitle }) {
    const values = this.user.categoriesDescriptions[this.projectName][typeId][
      categoryId
    ].split(this.categorySizesDivider);

    const isValueExist = values.includes(sizeValueTitle);

    return isValueExist
      ? values
          .filter(value => value !== sizeValueTitle)
          .join(this.categorySizesDivider)
      : [...values.filter(Boolean), sizeValueTitle].join(
          this.categorySizesDivider,
        );
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

  updateUserCategoriesOfInterest(categoriesOfInterest = []) {
    this.afs
      .collection('user')
      .doc(this.user.uid)
      .set(
        { categoriesOfInterest: { [this.projectName]: categoriesOfInterest } },
        { merge: true },
      );
  }

  updateUserPersonalizationData(personalizationData) {
    this.afs
      .collection('user')
      .doc(this.user.uid)
      .set(
        {
          personalizationData: { [this.projectName]: personalizationData },
        },
        { merge: true },
      );
  }

  updateUserCategoriesDescriptions(categoriesDescriptions) {
    this.afs
      .collection('user')
      .doc(this.user.uid)
      .set(
        {
          categoriesDescriptions: {
            [this.projectName]: categoriesDescriptions,
          },
        },
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
