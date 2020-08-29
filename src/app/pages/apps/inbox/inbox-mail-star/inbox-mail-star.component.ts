import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'fury-inbox-mail-star',
  templateUrl: './inbox-mail-star.component.html',
  styleUrls: ['./inbox-mail-star.component.scss'],
})
export class InboxMailStarComponent {
  @Input() isStarred: boolean;
  @Output() starred = new EventEmitter();

  emitClick() {
    this.starred.emit();
  }
}
