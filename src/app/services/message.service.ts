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
  sendMessage(data: any, cb?: (data: any) => void) {
    chrome.runtime.sendMessage(data, cb);
  }

  sendMessageToTab(data: any, cb?: (data: any) => void, url?: string) {
    if (!url) {
      chrome.tabs.getSelected(null, (tab: any) => {
        chrome.tabs.sendMessage(tab.id, data, cb);
      });
    } else {
      chrome.tabs.query({}, (tabs: any[]) => {
        tabs = tabs.filter(t => t.url === url);
        console.log('tabs', tabs);
        if (tabs.length > 0) {
          for (const tab of tabs) {
            chrome.tabs.sendMessage(tab.id, data, cb);
          }
        }
      });
    }
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
  }
}
