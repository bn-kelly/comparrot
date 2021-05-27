import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UtilService } from './util.service';
import { StorageService } from './storage.service';

/**
 * @class ScraperService
 * Service to manage scraping from google shopping.
 */

export interface Product {
  url: string;
  title?: string;
  upc?: string;
  price?: number;
  image?: string;
  created: number;
  retailer?: string;
  sku: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScraperService {
  constructor(private util: UtilService, private storage: StorageService, private http: HttpClient) {}

  async searchGoogle(product: Product): Promise<Product[]> {
    if (!product) {
      return [];
    }

    const search = product.upc || product.title;
    const url = `https://www.google.com/search?tbm=shop&tbs=vw:1,new:1,price:1,ppr_max:${product.price}&q=${search}`;
    const doc = await this.util.getDocFromUrl(url);
    let data = [];

    const noResults = this.util.getXPathString(
      doc,
      GoogleXPaths.g_step1_no_results_xpath,
    );
    console.log('url:', url);
    console.log('noResults', noResults);
    if (parseInt(noResults)) {
      return [];
    }

    const href = this.util.getXPathString(doc, GoogleXPaths.g_step1_href_xpath);

    if (href.length === 0) {
      const urls = this.util.getXPathArray(doc, GoogleXPaths.g_step1_url_xpath);
      const arrUrls = [];
      let node = urls.iterateNext();

      if (!node) {
        return [];
      }

      while (node) {
        const url = this.util.extractGUrl(node.getAttribute('href'));
        arrUrls.push(url);
        node = urls.iterateNext();
      }

      const prices = this.util.getXPathArray(
        doc,
        GoogleXPaths.g_step1_price_xpath,
      );
      const arrPrices = [];
      node = prices.iterateNext();
      while (node) {
        arrPrices.push(node.textContent);
        node = prices.iterateNext();
      }

      const retailers = this.util.getXPathArray(
        doc,
        GoogleXPaths.g_step1_retailer_xpath,
      );
      const arrRetailers = [];
      node = retailers.iterateNext();

      while (node) {
        arrRetailers.push(node.textContent);
        node = retailers.iterateNext();
      }

      const titles = this.util.getXPathArray(
        doc,
        GoogleXPaths.g_step1_title_xpath,
      );
      const arrTitles = [];
      node = titles.iterateNext();

      while (node) {
        arrTitles.push(node.textContent);
        node = titles.iterateNext();
      }

      for (let i = 0; i < arrRetailers.length; i++) {
        data.push({
          retailer: this.util.clean(arrRetailers[i]),
          url: `https://www.google.com${arrUrls[i]}`,
          price: this.util.clean(arrPrices[i]),
          title: arrTitles[i],
        });
      }
    } else {
      const id = href.split('product/')[1].split('?')[0];
      data = await this.getGooglePrices(id, search);
    }
    console.log('href:', href);
    for (let i = 0; i < data.length; i++) {
      if (!this.util.validURL(data[i].url)) {
        continue;
      }

      const doc = await this.util.getDocFromUrl(data[i].url);
      const retailers = await this.storage.getValue('retailers');
      const retailer = retailers.find(r => {
        return data[i].retailer === r.name;
      });

      if (!retailer) {
        continue;
      }

      const image = doc.querySelector(retailer.selectors?.product?.image[0]);
      console.log('image', retailer, image, retailer.selectors?.product?.image[0]);
      data[i].image = image
        ? image.getAttribute('src') && image.getAttribute('src').includes('https')
          ? image.getAttribute('src')
          : `https:${image.getAttribute('src')}`
        : '';
    }

    return data;
  }

  private async getGooglePrices(id: string, search: string) {
    let url = GoogleXPaths.g_prod_url;
    url = url.replace(/xxxxx/g, id);
    url = url.replace(/qqqqq/g, search);
    const doc = await this.util.getDocFromUrl(url);

    const arrRetailers = [];
    const arrUrls = [];
    const arrPrices = [];

    const links = this.util.getXPathArray(doc, GoogleXPaths.g_step2_href_xpath);
    let node = links.iterateNext();

    while (node) {
      arrUrls.push(node.getAttribute('href'));
      arrRetailers.push(node.childNodes[0].textContent);
      node = links.iterateNext();
    }

    const prices = this.util.getXPathArray(
      doc,
      GoogleXPaths.g_step2_price_xpath,
    );
    node = prices.iterateNext();

    while (node) {
      arrPrices.push(node.textContent);
      node = prices.iterateNext();
    }

    const title = this.util.getXPathString(
      doc,
      GoogleXPaths.g_step2_title_xpath,
    );
    const data = [];

    for (let i = 0; i < arrRetailers.length; i++) {
      data.push({
        retailer: this.util.clean(arrRetailers[i]),
        url: `https://www.google.com${this.util.extractGUrl(arrUrls[i])}`,
        price: this.util.clean(arrPrices[i]),
        title,
      });
    }

    return data;
  }

  triggerScraper(product: Product) {
    this.http
      .post(environment.cloudFunctions + '/scrape', product);
  }

  getProducts(product: Product) {
    return this.http
      .post(environment.cloudFunctions + '/products', product)
      .toPromise();
  }
}

export const GoogleXPaths = {
  g_prod_url:
    'https://www.google.com/shopping/product/xxxxx/offers?q=qqqqq&prds=cid:xxxxx,cond:1,scoring:tp',
  g_step1_href_xpath:
    "//div[contains(@class,'psmkhead')]/preceding-sibling::div//h3[@class='r']/a[contains(@href, '/shopping/product') and not(contains(@href,'product/1/')) and not(contains(@href,'product/1?'))]/@href|//div[@class='psjtitle']/a[contains(@href, '/shopping/product') and not(contains(@href,'product/1/')) and not(contains(@href,'product/1?'))]/@href|(//div[@class='psjtitle']/a[contains(@href, '/shopping/product') and not(contains(@href,'product/1/')) and not(contains(@href,'product/1?'))]/@href)|//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0 and count(div[contains(text(),'Other Matches')])=0 and count(div[contains(text(),'People also considered')])=0]//a[contains(@href, '/shopping/product') and not(contains(@href,'product/1/')) and not(contains(@href,'product/1?'))]/@href",
  g_step1_no_results_xpath:
    "string-length(//span[contains(., 'No results for') or contains(., 'Did you mean')]|//p[contains(.,'did not match')])",
  g_step1_price_xpath:
    "//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//span[@class='price']/b|//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//div[@data-sh-or='price']//div/span/span[1]",
  g_step1_retailer_xpath:
    "//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//span[@class='price']/following-sibling::text()|//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//div[@data-sh-or='price']//following-sibling::div/span",
  g_step1_ship_xpath: "//span[@class='price']/following-sibling::text()",
  g_step1_title_xpath:
    "//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//h3[contains(@class,'r')]|//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0]//a[contains(@data-what,'1')]//h3",
  g_step1_url_xpath:
    "//div[contains(@class,'psmkhead')]/preceding-sibling::div//h3[@class='r']/a|(//div[(contains(@class,'_Ked') or contains(@class,'shop-result-group')) and count(div[contains(text(),'Results for')])=0 and count(div[contains(text(),'Other Matches')])=0]//a[contains(@data-what,'1') and not(//div[contains(@class,'psmkhead')]) and not(//span[contains(text(), 'Did you mean:')]) and not(span[contains(text(), 'Shop for all')])])|(//div[@class='psgicont' and not(//div[contains(@class,'psmkhead')]) and not(//span[contains(text(), 'Did you mean:')]) and not(span[contains(text(), 'Shop for all')])]/a)",
  g_step2_href_xpath:
    "//tbody[@id='sh-osd__online-sellers-cont']/tr[@class='sh-osd__offer-row']/td[1]/div[1]/a",
  g_step2_price_xpath:
    "//tr[@class='sh-osd__offer-row']//td[contains(text(),'Item price')]/following-sibling::*",
  g_step2_ship_xpath:
    "//tr[@class='sh-osd__offer-row']//td[contains(text(),'Shipping') or contains(text(),'Delivery') ]/following-sibling::*",
  g_step2_tax_xpath:
    "//tr[@class='sh-osd__offer-row']//td//span[contains(text(),'Estimated Tax') or contains(text(),'Estimated Tax')]//parent::td/following-sibling::*",
  g_step2_title_xpath:
    "//h1[@id='product-name']|//a[contains(@class, 'title')]",
  g_step2_total_price_xpath:
    "//tr[@class='sh-osd__offer-row']//td[contains(text(),'Total price')]/following-sibling::*",
  order_confirmation_xpath:
    "count(//*[text()[contains(.,'Your order has been placed') or contains(.,'Thank you for placing your order') or contains(.,'Order complete') or contains(.,'Thank you for ordering') or contains(.,'Thanks for ordering from') or contains(.,'Thank you for your order') or contains(.,'Order receipt') or contains(.,'Purchase complete') or contains(.,'Thanks for your purchase') or contains(.,'Thank you for your purchase') or contains(.,'Your order has been placed') or contains(.,'Your Order Has Been Placed') or contains(.,'Thank You For Placing Your Order') or contains(.,'Order Complete') or contains(.,'Thank You For Ordering') or contains(.,'Thanks For Ordering From') or contains(.,'Thank You For Your Order') or contains(.,'Order Receipt') or contains(.,'Purchase Complete') or contains(.,'Thanks For Your Purchase') or contains(.,'Thank You For Your Purchase') or contains(.,'Your Order Has Been Placed') or contains(.,'your order has been placed') or contains(.,'thank you for placing your order') or contains(.,'order complete') or contains(.,'thank you for ordering') or contains(.,'thanks for ordering from') or contains(.,'thank you for your order') or contains(.,'order receipt') or contains(.,'purchase complete') or contains(.,'thanks for your purchase') or contains(.,'thank you for your purchase') or contains(.,'your order has been placed')]])",
};
