import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { Router } from '@angular/router';

import { ContactUsService, ContactUsData } from './contact-us.service';

@Component({
  selector: 'fury-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ContactUsComponent implements OnInit {
  formData: FormGroup;
  submitted: boolean;
  adminEmails: [string];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private cus: ContactUsService,
  ) {}

  ngOnInit(): void {
    this.formData = this.fb.group({
      topic: new FormControl(''),
      message: new FormControl('', [Validators.required]),
    });
    this.submitted = false;
  }

  send(): void {
    if (this.formData.valid) {
      const data: ContactUsData = {
        topic: this.formData.value.topic || '',
        message: this._keepHyphenationField(this.formData.value.message),
      };

      this.cus
        .sendEmail(data)
        .then(() => {
          this.submitted = true;
        })
        .catch(e => console.error('Error send mail ', e))
        .finally(() => this.formData.reset());
    }
  }

  gotoOffers(): void {
    this.router.navigate(['/']);
  }

  _keepHyphenationField(str: string): string {
    return str.replace(/\n/g, '<br>');
  }
}
