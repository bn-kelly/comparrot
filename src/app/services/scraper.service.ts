import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { FirebaseService } from '@coturiv/firebase/app';
import sha1 from 'sha1';
import { environment } from '../../environments/environment';
import { BaseAmazonURL, GoogleXPaths } from '../constants';
import { Product } from '../models/product.model';
import { 
  getXPathString,
  getXPathArray,
  extractGUrl,
  getNumberFromString,
  clean,
  getXPathContent,
} from '../shared/utils';

/**
 * @class ScraperService
 * Service to manage scraping from google shopping.
 */

@Injectable({
  providedIn: 'root',
})
export class ScraperService {
  private map = new Map<string, any>();
  private blacklist: any[] = [];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private firebaseService: FirebaseService,
  ) {
    this.firebaseService.collection('blacklist').subscribe(data => {
      this.blacklist = data.map(x => x.name);
    });
  }

  async searchGoogle(product: Product): Promise<Product[]> {
    if (!product) {
      return [];
    }

    const search = encodeURIComponent(product.upc || product.title);
    const url = `https://www.google.com/search?tbm=shop&tbs=vw:1,price:1,ppr_max:${product.price}&q=${search}`;
    const doc = await this.getDocFromUrl(url);
    let data: Product[] = [];

    const noResults = getXPathString(
      doc,
      GoogleXPaths.g_step1_no_results_xpath,
    );
    console.log('url:', url);
    console.log('noResults', noResults);
    if (parseInt(noResults)) {
      return [];
    }

    const href = getXPathString(doc, GoogleXPaths.g_step1_href_xpath);

    if (href.length === 0) {
      const urls = getXPathArray(doc, GoogleXPaths.g_step1_url_xpath);
      const arrUrls = [];
      let node = urls.iterateNext();

      if (!node) {
        return [];
      }

      while (node) {
        const url = extractGUrl(node.getAttribute('href'));
        arrUrls.push(url);
        node = urls.iterateNext();
      }

      const prices = getXPathArray(
        doc,
        GoogleXPaths.g_step1_price_xpath,
      );
      const arrPrices = [];
      node = prices.iterateNext();
      while (node) {
        arrPrices.push(node.textContent);
        node = prices.iterateNext();
      }

      const retailers = getXPathArray(
        doc,
        GoogleXPaths.g_step1_retailer_xpath,
      );
      const arrRetailers = [];
      node = retailers.iterateNext();
      while (node) {
        arrRetailers.push(node.textContent);
        node = retailers.iterateNext();
      }

      const titles = getXPathArray(
        doc,
        GoogleXPaths.g_step1_title_xpath,
      );
      const arrTitles = [];
      node = titles.iterateNext();
      while (node) {
        arrTitles.push(node.textContent);
        node = titles.iterateNext();
      }

      const images = getXPathArray(
        doc,
        GoogleXPaths.g_step1_image_xpath,
      );
      const arrImages = [];
      node = images.iterateNext();
      while (node) {
        arrImages.push(node.textContent);
        node = images.iterateNext();
      }

      for (let i = 0; i < arrRetailers.length; i++) {
        const url = `https://www.google.com${arrUrls[i]}`;
        const title = arrTitles[i];
        const price = Number(getNumberFromString(clean(arrPrices[i])).toFixed(2));
        const retailer = clean(arrRetailers[i]);
        const image = arrImages[i];

        data.push({
          url,
          title,
          price,
          image,
          retailer,
          sku: sha1(`${title}${retailer}`),
          created: Date.now(),
        });
      }
    } else {
      const id = href.split('product/')[1].split('?')[0];
      data = await this.getGooglePrices(id, search);
    }

    return data;
  }

  private async getGooglePrices(id: string, search: string) {
    let url = GoogleXPaths.g_prod_url;
    url = url.replace(/xxxxx/g, id);
    url = url.replace(/qqqqq/g, search);
    console.log('getGooglePrices:', url);
    const doc = await this.getDocFromUrl(url);

    const arrRetailers = [];
    const arrUrls = [];
    const arrPrices = [];

    const links = getXPathArray(doc, GoogleXPaths.g_step2_href_xpath);
    let node = links.iterateNext();

    while (node) {
      arrUrls.push(node.getAttribute('href'));
      arrRetailers.push(node.childNodes[0].textContent);
      node = links.iterateNext();
    }

    const prices = getXPathArray(
      doc,
      GoogleXPaths.g_step2_price_xpath,
    );
    node = prices.iterateNext();

    while (node) {
      arrPrices.push(node.textContent);
      node = prices.iterateNext();
    }

    const title = getXPathString(
      doc,
      GoogleXPaths.g_step2_title_xpath,
    );
    const image = getXPathString(
      doc,
      GoogleXPaths.g_step2_image_xpath,
    );
    const data: Product[] = [];

    for (let i = 0; i < arrRetailers.length; i++) {
      const url = `https://www.google.com${extractGUrl(arrUrls[i])}`;
      const price = Number(getNumberFromString(clean(arrPrices[i])).toFixed(2));
      const retailer = clean(arrRetailers[i]);

      data.push({
        url,
        title,
        price,
        image,
        retailer,
        sku: sha1(`${title}${retailer}`),
        created: Date.now()
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

  async getAmazonProduct(product: Product) {
    const search = encodeURIComponent(product.upc || product.title);
    const searchUrl = GoogleXPaths.a_search_url.replace('qqqqq', search);
    const doc = await this.getDocFromUrl(searchUrl);

    const url = BaseAmazonURL + getXPathString(doc, GoogleXPaths.a_asin_xpath);
    const price = Number(getXPathString(doc, GoogleXPaths.a_price_xpath));
    const title = getXPathString(doc, GoogleXPaths.a_title_xpath);
    const image = getXPathContent(doc, GoogleXPaths.a_image_xpath);

    if (url.length > BaseAmazonURL.length && price !== 0) {
      return {
        url,
        title,
        price,
        image,
        retailer: 'Amazon.com',
        sku: sha1(`${title}Amazon.com`),
        created: Date.now(),
      }
    }

    return null;
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

  async getProducts(product: Product) {
    const key = product.sku;
    let products = this.map.get(key);
    
    if (!products) {
      const googleResult = await this.searchGoogle(product);
      const amazonProduct = await this.getAmazonProduct(product);
      // const scrapedResult = await this.getScrapedProducts(product);
      console.log('amazonProduct', amazonProduct);

      products = [...googleResult];

      if (amazonProduct) {
        products.push(amazonProduct);
      }

      // if (scrapedResult.length === 0) {
      //   this.triggerScraper(product);
      // }

      products = products
        .filter(p => {
          return p.price < product.price && !this.blacklist.includes(p.retailer);
        })
        .filter((p, index, self ) => {
          return index === self.findIndex((t) => t.retailer === p.retailer && t.price === p.price);
        })
        .sort((a, b) => {
          return a.price - b.price;
        })
        .map(p => {
          p.url = `${environment.cloudFunctions}/affiliate?url=${encodeURIComponent(p.url)}`;
          return p;
        });

      this.map.set(key, products);
    }

    return products;
  }
}
