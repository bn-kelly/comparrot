import {Component, EventEmitter, OnInit, Output } from '@angular/core';
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
  isLoggedIn: boolean;

  @Output() openQuickPanel = new EventEmitter();

  constructor(
      private router: Router,
      private afs: AngularFirestore,
      public auth: AuthService
  ) { }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  signOut() {
    this.auth.signOut();
    this.isOpen = false;
  }

  ngOnInit() {
    this.auth.user.subscribe(user => {
      this.user = user || {};
      this.isLoggedIn = !!user && !user.isAnonymous;
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  onClickOutside() {
    this.isOpen = false;
  }

}
