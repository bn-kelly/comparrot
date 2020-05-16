import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'fury-toolbar-close',
  templateUrl: './toolbar-close.component.html',
  styleUrls: ['./toolbar-close.component.scss']
})
export class ToolbarCloseComponent {

  constructor() {
  }

  hideExtension() {
    if (!window.chrome || !window.chrome.tabs) {
      return;
    }

    window.chrome.tabs.getSelected(null, tab => {
      window.chrome.tabs.sendMessage(tab.id, {
        action: 'hide-iframe'
      });
    });
  }
}
