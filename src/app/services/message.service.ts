import { Injectable } from '@angular/core';

/**
 * @class MessageService
 * Service to manage messages between content script and iframe.
 */

declare const chrome: any;

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  sendMessage(data: any, cb: (data: any) => void) {
    chrome.runtime.sendMessage(data, cb);
  }

  sendMessageToTab(data: any, cb?: (data: any) => void, query?: any) {
    if (!query) {
      chrome.tabs.getSelected(null, (tab: any) => {
        chrome.tabs.sendMessage(tab.id, data, cb);
      });
    } else {
      chrome.tabs.query(query, (tab: any) => {
        if (tab) {
          chrome.tabs.sendMessage(tab.id, data, cb);
        }
      });
    }
  }

  handleMessage(
    action: string,
    handler: (
      message: any,
    ) => void,
  ) {
    window.addEventListener(
      'message',
      (event) => action === event.data.action && handler(event.data),
      false
    );
  }
}
