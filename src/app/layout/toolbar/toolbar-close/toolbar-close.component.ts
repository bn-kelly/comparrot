import { Component } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { HideIframe } from '../../../constants';

@Component({
  selector: 'fury-toolbar-close',
  templateUrl: './toolbar-close.component.html',
  styleUrls: ['./toolbar-close.component.scss'],
})
export class ToolbarCloseComponent {
  constructor(
    private message: MessageService,
  ) {}

  hideExtension() {
    if (!window.chrome || !window.chrome.tabs) {
      return;
    }

    this.message.sendMessageToTab(
      {
        action: HideIframe
      }
    );
  }
}
