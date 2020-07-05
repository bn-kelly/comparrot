import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../authentication/services/auth.service';

type Fields = 'firstName' | 'lastName' | 'photoURL';
type FormErrors = { [u in Fields]: string };

@Component({
    selector: 'fury-account-settings-component',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit, OnDestroy {
    initialGeneralProfileFormData: {
        firstName: string,
        lastName: string,
        photoURL: string,
    };
    isGeneralProfileUpdated: boolean;
    isGeneralProfileFormSubmitting: boolean;
    user: User;
    form: FormGroup;
    formErrors: FormErrors = {
        'firstName': '',
        'lastName': '',
        'photoURL': '',
    };
    validationMessages = {
        'firstName': {
            'required': 'First name is required.',
            'minlength': 'First name must be at least 2 characters long.',
            'maxlength': 'First name cannot be more than 255 characters long.',
        },
        'lastName': {
            'required': 'Last name is required.',
            'minlength': 'Last name must be at least 2 characters long.',
            'maxlength': 'Last name cannot be more than 255 characters long.',
        },
    };

    constructor(private fb: FormBuilder,
                private auth: AuthService
    ) {
        this.isGeneralProfileUpdated = false;
        this.isGeneralProfileFormSubmitting = false;
    }

    ngOnInit() {
        this.auth.user.subscribe(user => {
            this.user = user;
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
            'firstName': [user.firstName, [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(225),
            ]],
            'lastName': [user.lastName, [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(225),
            ]],
            'photoURL': [user.photoURL],
        });

        this.form.valueChanges.subscribe(() => this.onValueChanged());
    }

    onValueChanged() {
        if (!this.form) { return; }
        const form = this.form;
        for (const field in this.formErrors) {
            if (Object.prototype.hasOwnProperty.call(this.formErrors, field) && ['firstName', 'lastName'].includes(field)) {
                // clear previous error message (if any)
                this.formErrors[field] = '';
                const control = form.get(field);
                if (control && control.dirty && !control.valid) {
                    const messages = this.validationMessages[field];
                    if (control.errors) {
                        for (const key in control.errors) {
                            if (Object.prototype.hasOwnProperty.call(control.errors, key) && messages[key]) {
                                this.formErrors[field] += `${(messages as {[key: string]: string})[key]} `;
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

    areGeneralProfileFormButtonsDisabled = () => this.form.pristine || this.isGeneralProfileFormSubmitting;

    changeUserPhotoURL(event) {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            const reader = new FileReader();
            reader.onload = e => {
                this.form.patchValue({ photoURL: reader.result });
                this.form.markAsDirty();
            };

            reader.readAsDataURL(file);
        }
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

            setTimeout(() => {
                this.isGeneralProfileUpdated = false;
            }, 3000);
        });
    }

    resetGeneralProfile() {
        const userPhotoURLFileInput = document.getElementById('userPhotoURL') as HTMLInputElement;
        if (userPhotoURLFileInput) {
            userPhotoURLFileInput.value = '';
        }
        this.buildForm(this.initialGeneralProfileFormData);
    }
}
