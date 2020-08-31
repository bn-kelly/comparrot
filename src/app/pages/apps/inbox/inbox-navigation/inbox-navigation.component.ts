import { Component, Input } from '@angular/core';

@Component({
  selector: 'fury-inbox-navigation',
  templateUrl: './inbox-navigation.component.html',
  styleUrls: ['./inbox-navigation.component.scss'],
})
export class InboxNavigationComponent {
  @Input() responsive: boolean;
}
