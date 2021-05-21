import { Injectable } from '@angular/core';

/**
 * @class StorageService
 * Service to manage browser storage.
 */

declare const chrome: any;

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  setValue(data: any): void {
    chrome.storage.local.set(data);
  }

  getValue(key: string): Promise<any> {
    return new Promise(resolve => {
      chrome.storage.local.get([key], (result: any) => {
        resolve(result[key]);
      });
    });
  }

}
