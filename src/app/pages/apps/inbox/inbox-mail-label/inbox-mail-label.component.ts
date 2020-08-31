import { Component, Input } from '@angular/core';

@Component({
  selector: 'fury-inbox-mail-label',
  templateUrl: './inbox-mail-label.component.html',
  styleUrls: ['./inbox-mail-label.component.scss'],
})
export class InboxMailLabelComponent {
  @Input() color: string;
}
