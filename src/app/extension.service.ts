import { Injectable } from '@angular/core';

/**
 * @class ExtensionService
 * Service to manage messages between content script and iframe.
 */

declare const chrome: any;

@Injectable({
  providedIn: 'root',
})
export class ExtensionService {
  get isExtension() {
    return !!chrome && !!chrome.extension;
  }

  sendMessage(data: any, cb: (data: any) => void) {
    if (!this.isExtension) {
      return cb({});
    }

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
    if (!this.isExtension) {
      return handler({}, {}, null);
    }

    chrome.runtime.onMessage.addListener(
      (message: any, sender: any, sendResponse: (data: any) => void) =>
        action === message.action && handler(message, sender, sendResponse),
    );
  }
}

export const ExtensionForceLogin = 'extension-force-login';
export const ExtensionForceLogout = 'extension-force-logout';
export const SiteForceLogin = 'site-force-login';
export const SiteForceLogout = 'site-force-logout';
export const GetUser = 'get-user';
export const GetCustomToken = 'get-custom-token';
