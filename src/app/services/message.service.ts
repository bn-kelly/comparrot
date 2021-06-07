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
        action === message.action && handler(message, sender, sendResponse),
    );
  }
}

export const SiteForceLogin = 'site-force-login';
export const SiteForceLogout = 'site-force-logout';
export const SetUserId = 'set-user-id';
export const PerformGoogleSearch = 'perform-google-search';
