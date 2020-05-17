import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../pages/authentication/services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'fury-toolbar-user',
  templateUrl: './toolbar-user.component.html',
  styleUrls: ['./toolbar-user.component.scss']
})
export class ToolbarUserComponent implements OnInit {

  isOpen: boolean;
  user: any = {};

  constructor(
      private router: Router,
      private afs: AngularFirestore,
      public auth: AuthService
  ) { }

  signOut() {
    this.auth.signOut();
    this.isOpen = false;
  }

  ngOnInit() {
    this.auth.user.subscribe(user => this.user = user || {});
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  onClickOutside() {
    this.isOpen = false;
  }

}
