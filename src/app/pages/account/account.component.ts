import {
  Component,
  ViewChild,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { AuthService } from '../authentication/services/auth.service';
import { User } from '../../models/user.model';
import { MessageService } from '../../services/message.service';
import { ToggleExpandIframeWidth } from '../../constants';
import { FirebaseService } from '@coturiv/firebase/app';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

type Fields = 'firstName' | 'lastName' | 'photoURL';
@Component({
  selector: 'fury-account-settings-component',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AccountComponent implements OnInit, OnDestroy {
  @ViewChild(MatAccordion) accordion: MatAccordion;

  user: User;

  totalSavings: number;

  constructor(
    private auth: AuthService,
    private message: MessageService,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.user = this.auth.currentUser;
    const { uid} = this.user;

    this.toggleExpandIframe(true);

    const { savings } = await this.firebaseService.docAsPromise(`user_context/${uid}`);

    this.totalSavings = 0;

    if (savings) {
      Object.keys(savings).forEach(k => {
        this.totalSavings += savings[k];
      });
    }
  }

  ngOnDestroy() {
    this.toggleExpandIframe(false);
  }

  toggleExpandIframe(isOpen) {
    if (!window.chrome || !window.chrome.tabs) {
      return;
    }

    this.message.sendMessageToTab(
      {
        action: ToggleExpandIframeWidth,
        isOpen,
      }
    );
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
