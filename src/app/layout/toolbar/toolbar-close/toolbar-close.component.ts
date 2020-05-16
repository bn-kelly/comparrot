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
    window.chrome.tabs.getSelected(null, tab => {
      window.chrome.tabs.sendMessage(tab.id, {
        action: 'hide-iframe'
      });
    });
  }
}
