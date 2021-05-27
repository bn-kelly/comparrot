import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

/**
 * @class UtilService
 * Service for utility functions.
 */

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  constructor(private sanitizer: DomSanitizer, private http: HttpClient) {}

  getXPathString(doc: Document, xpath: string) {
    if (!xpath) return '';
    xpath = `normalize-space(${xpath})`;
    const result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
    return this.clean(result.stringValue);
  }

  getXPathArray(doc: Document, xpath: string): any {
    if (xpath === undefined || xpath === '') return [];
    const result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
    return result;
  }

  /**
   * Trip spaces and remove html entities
   * @param {string} str
   */
  clean(str: string): string {
    return str
      ? str
          .replace(/&nbsp;/g, '')
          .replace(/&amp;/g, '')
          .replace(/^\s+|\s+$/g, '')
      : '';
  }

  extractGUrl(url: string): string {
    const vars = {};
    url.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
      vars[key] = value;
      return value;
    });

    return vars['adurl'] ? vars['adurl'] : url;
  }

  async getDocFromUrl(url: string): Promise<Document> {
    const responseText = await this.http
      .get(url, { responseType: 'text' })
      .toPromise();
    const doc = document.implementation.createHTMLDocument('');
    doc.documentElement.innerHTML = this.sanitizer.bypassSecurityTrustHtml(
      responseText,
    ) as string;
    return doc;
  }

  validURL(url: string) {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(url);
  }
}
