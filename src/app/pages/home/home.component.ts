import { Component, NgZone, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import sha1 from 'sha1';
import { MessageService } from '../../services/message.service';
import { ScraperService } from '../../services/scraper.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../pages/authentication/services/auth.service';
import { User } from '../../models/user.model';
import { Product } from '../../models/product.model';
import { UserContext } from 'src/app/models/user-context.model';
import {
  ShowIframe,
  TryToScrapeData,
  StartSpinExtensionIcon,
  StopSpinExtensionIcon,
  ChangeIframeStyle,
  AddClass,
  RemoveClass,
  ExtensionHomeLoaded,
  GetProductURL,
  HideIframe,
} from '../../constants';
import { FirebaseService } from '@coturiv/firebase/app';
import { AnalyticsService } from 'src/app/services/analytics.service';

@Component({
  selector: 'fury-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  user: User;
  isLoggedIn: boolean;
  products: Product[];
  showResult: boolean;
  userContext: UserContext;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private auth: AuthService,
    private spinner: NgxSpinnerService,
    private message: MessageService,
    private scraper: ScraperService,
    private storage: StorageService,
    private firebaseService: FirebaseService,
    private analyticsService: AnalyticsService,
  ) {}

  async onDeleteClick(product: Product) {
    this.products = this.products.filter(p => {
      return p.sku !== product.sku;
    });

    if (this.products.length === 0) {
      this.products = null;
    }

    await this.analyticsService.logEvent('Product', 'product_remove', {
      sku: product.sku,
      url: product.url,
    });
  }

  async onShareClick(event: any, product: Product) {
    event?.stopPropagation();
    const url = `mailto:?body=${encodeURIComponent(product.url)}`;
    window.chrome.tabs.create({ url });

    await this.analyticsService.logEvent('Product', 'product_share', {
      sku: product.sku,
      url: product.url,
    });
  }

  async onProductClick(event: any, product: Product) {
    event.preventDefault();
    window.chrome.tabs.create({ url: product.url });

    await this.analyticsService.logEvent('Product', 'product_click', {
      sku: product.sku,
      url: product.url,
    });
  }

  async toggleAddToWishlist(event: any, product: Product) {
    event?.stopPropagation();

    if (this.userContext && this.userContext.wishlist) {
      this.userContext.wishlist = this.userContext.wishlist.includes(
        product.sku,
      )
        ? this.userContext.wishlist.filter(s => s !== product.sku)
        : [...this.userContext.wishlist, product.sku];
    } else {
      this.userContext = { wishlist: [product.sku] };
    }

    await this.firebaseService.set(
      `product/${product.sku}`,
      { ...product, ...{ id: product.sku } },
      true,
    );
    await this.firebaseService.set(
      `user_context/${this.user.uid}`,
      this.userContext,
      true,
    );

    await this.analyticsService.logEvent('Product', 'product_add_to_wishlist', {
      sku: product.sku,
      url: product.url,
    });
  }

  async addSavings(sku: string, amount: number) {
    amount = Math.round(amount * 100) / 100;

    const savings = this.userContext?.savings || {};
    savings[sku] = amount;

    await this.firebaseService.set(
      `user_context/${this.user.uid}`,
      { savings },
      true,
    );

    await this.analyticsService.logEvent('Product', 'product_savings', {
      sku,
      amount,
    });
  }

  async signInWithUid() {
    const uid = window.localStorage.getItem('uid');
    await this.auth.signInWithUid(uid);
  }

  async startSpinning() {
    this.showResult = false;
    this.message.sendMessage({
      action: StartSpinExtensionIcon,
    });
    await this.spinner.show();
  }

  async stopSpinning() {
    this.showResult = true;
    this.message.sendMessage({
      action: StopSpinExtensionIcon,
    });
    await this.spinner.hide();
  }

  async ngOnInit() {
    this.user = this.auth.currentUser;

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    await this.signInWithUid();

    this.userContext = await this.firebaseService.docAsPromise(
      `user_context/${this.user.uid}`,
    );

    const retailers: any[] = await this.storage.getValue('retailers');

    this.message.handleMessage(
      TryToScrapeData,
      async ({ product, retailer }) => {
        console.log('Product:', product);
        if (!product) {
          this.showResult = true;
          return;
        }

        if (product.sku === '') {
          product.sku = sha1(`${product.title}${product.retailer}`);
        }

        await this.startSpinning();
        this.ngZone.run(async () => {
          // Todo: We need to store a product to firebase before scraping
          this.products = await this.scraper.getProducts(product, retailer);

          console.log('products:', this.products);

          if (this.products.length === 0) {
            this.message.postMessage(ChangeIframeStyle, {
              class: 'notification',
              type: AddClass,
            });
          } else {
            await this.addSavings(
              product.sku,
              product.price - this.products[0].price,
            );
          }

          this.message.postMessage(ShowIframe);
          await this.stopSpinning();
        });
      },
    );
    this.message.handleMessage(GetProductURL, async ({ productUrl }) => {
      console.log('GetProductURL', productUrl);
      const retailer = retailers.find(r => {
        return productUrl.includes(r.url);
      });

      if (!retailer) {
        this.showResult = true;
        return;
      }

      this.message.postMessage(ChangeIframeStyle, {
        class: 'notification',
        type: RemoveClass,
      });
      this.message.postMessage(TryToScrapeData, {
        url: productUrl,
        retailer,
      });
    });
    this.message.postMessage(ExtensionHomeLoaded);
  }

  ngOnDestroy() {
    this.message.postMessage(ChangeIframeStyle, {
      class: 'notification',
      type: RemoveClass,
    });
  }
}
