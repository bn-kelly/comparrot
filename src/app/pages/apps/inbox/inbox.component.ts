import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InboxComposeComponent } from './inbox-compose/inbox-compose.component';

@Component({
  selector: 'fury-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss'],
})
export class InboxComponent {
  constructor(private dialog: MatDialog) {}

  openCompose() {
    this.dialog.open(InboxComposeComponent);
  }
}
