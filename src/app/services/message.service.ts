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

  sendMessageToTab(data: any, cb: (data: any) => void) {
    chrome.tabs.getSelected(null, (tab: any) => {
      chrome.tabs.sendMessage(tab.id, data, cb);
    });
  }

  handleMessage(
    action: string,
    handler: (
      message: any,
      sender: any,
      sendResponse: (data: any) => void,
    ) => void,
  ) {
    chrome.runtime.onMessage.addListener(
      (message: any, sender: any, sendResponse: (data: any) => void) => 
        action === message.action && handler(message, sender, sendResponse)
    );
    // chrome.runtime.onMessage.addListener(
    //   function listen(message: any, sender: any, sendResponse: (data: any) => void) {
    //     chrome.runtime.onMessage.removeListener(listen);
    //     return action === message.action && handler(message, sender, sendResponse);
    //   }
    // );
  }
}
