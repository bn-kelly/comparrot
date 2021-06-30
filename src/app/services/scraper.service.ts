import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import sha1 from 'sha1';
import { environment } from '../../environments/environment';
import { UtilService } from './util.service';
import { StorageService } from './storage.service';
import { GoogleXPaths } from '../constants';
import { Product } from '../models/product.model';

/**
 * @class ScraperService
 * Service to manage scraping from google shopping.
 */

@Injectable({
  providedIn: 'root',
})
export class ScraperService {
  private map = new Map<string, any>();

  constructor(
    private util: UtilService,
    private storage: StorageService,
    private http: HttpClient,
  ) {}

  async searchGoogle(product: Product): Promise<Product[]> {
    if (!product) {
      return [];
    }

    const search = product.upc || product.title;
    const url = `https://www.google.com/search?tbm=shop&tbs=vw:1,price:1,ppr_max:${product.price}&q=${search}`;
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
        const url = `https://www.google.com${arrUrls[i]}`;
        const title = arrTitles[i];
        const price = this.util.getNumberFromString(this.util.clean(arrPrices[i])).toFixed(2);
        const retailer = this.util.clean(arrRetailers[i]);

        data.push({
          url,
          title,
          price,
          retailer,
          sku: sha1(`${title}${retailer}`),
        });
      }
    } else {
      const id = href.split('product/')[1].split('?')[0];
      data = await this.getGooglePrices(id, search);
    }

    data = data.filter(p => {
      return p.price < product.price;
    });

    for (let i = 0; i < data.length; i++) {
      if (!this.util.validURL(data[i].url)) {
        continue;
      }

      try {
        const doc = await this.util.getDocFromUrl(data[i].url);
        const retailers = await this.storage.getValue('retailers');
        const retailer = retailers.find(r => {
          return data[i].retailer === r.name;
        });

        if (!retailer) {
          continue;
        }

        const image = this.util.getXPathContent(doc, retailer.selectors?.product?.image);
        const sku = this.util.getXPathContent(doc, retailer.selectors?.product?.sku);
        
        data[i].image = image || data[i].image;
        data[i].sku = sku || data[i].sku;
      } catch (_) {
        continue;
      }
    }

    return data;
  }

  private async getGooglePrices(id: string, search: string) {
    let url = GoogleXPaths.g_prod_url;
    url = url.replace(/xxxxx/g, id);
    url = url.replace(/qqqqq/g, search);
    console.log('getGooglePrices:', url);
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
    const image = this.util.getXPathString(
      doc,
      GoogleXPaths.g_step2_image_xpath,
    );
    const data = [];

    for (let i = 0; i < arrRetailers.length; i++) {
      const url = `https://www.google.com${this.util.extractGUrl(arrUrls[i])}`;
      const price = this.util.getNumberFromString(this.util.clean(arrPrices[i])).toFixed(2);
      const retailer = this.util.clean(arrRetailers[i]);

      data.push({
        url,
        title,
        price,
        image,
        retailer,
        sku: sha1(`${title}${retailer}`),
      });
    }

    return data;
  }

  triggerScraper(product: Product) {
    return this.http
      .post(environment.cloudFunctions + '/scrape', { product })
      .toPromise();
  }

  async getScrapedProducts(product: Product): Promise<Product[]> {
    const response: any = await this.http
      .post(environment.cloudFunctions + '/products', { product })
      .toPromise();
    return response.products as [Product];
  }

  async getProducts(product: Product) {
    const key = product.sku;
    let products = this.map.get(key);
    
    if (!products) {

      const googleResult = await this.searchGoogle(product);
      const scrapedResult = await this.getScrapedProducts(product);

      if (scrapedResult.length === 0) {
        this.triggerScraper(product);
      }

      products = [...googleResult, ...scrapedResult]
        .filter(p => {
          return p.price < product.price;
        })
        .filter((p, index, self ) => {
          return index === self.findIndex((t) => t.sku === p.sku && t.price === p.price);
        })
        .sort((a, b) => {
          return a.price - b.price;
        });

      this.map.set(key, products);
    }

    return products;
  }
}
