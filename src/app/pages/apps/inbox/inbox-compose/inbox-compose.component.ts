import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'fury-inbox-compose',
  templateUrl: './inbox-compose.component.html',
  styleUrls: ['./inbox-compose.component.scss'],
})
export class InboxComposeComponent {
  constructor(public dialogRef: MatDialogRef<InboxComposeComponent>) {}
}
