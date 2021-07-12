import { Component, NgZone, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import sha1 from 'sha1';
import { MessageService } from '../../services/message.service';
import { ScraperService } from '../../services/scraper.service';
import { UtilService } from '../../services/util.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../pages/authentication/services/auth.service';
import { User } from '../../models/user.model';
import { Product } from '../../models/product.model';
import { UserContext } from 'src/app/models/user-context.model';
import { GetUserId, ShowIframe, TryToScrapeData, StartSpinExtensionIcon, StopSpinExtensionIcon, ChangeIframeStyle, AddClass, RemoveClass, SetUserId } from '../../constants';
import { FirebaseService } from '@coturiv/firebase/app';

@Component({
  selector: 'fury-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  user: User;
  isLoggedIn: boolean;
  products: Product[];
  showResult: Boolean;
  userContext: UserContext;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private auth: AuthService,
    private afs: AngularFirestore,
    private spinner: NgxSpinnerService,
    private message: MessageService,
    private scraper: ScraperService,
    private util: UtilService,
    private storage: StorageService,
    private firebaseService: FirebaseService
  ) {}

  onDeleteClick(product: Product) {
    this.products = this.products.filter(p => {
      return p.sku !== product.sku;
    });

    if (this.products.length === 0) {
      this.products = null;
    }
  }

  onShareClick(event: any, product: Product) {
    event?.stopPropagation();
    const url = `mailto:?body=${encodeURIComponent(product.url)}`;
    window.chrome.tabs.create({ url });
  }

  onProductClick(event: any, product: Product) {
    event.preventDefault();
    window.chrome.tabs.create({ url: product.url });
  }

  async toggleAddToWishlist(event: any, product: Product) {
    event?.stopPropagation();

    if (this.userContext && this.userContext.wishlist) {
      this.userContext.wishlist = this.userContext.wishlist.includes(product.sku)
        ? this.userContext.wishlist.filter(s => s !== product.sku)
        : [...this.userContext.wishlist, product.sku];
    } else {
      this.userContext = { wishlist: [product.sku] };
    }

    await this.firebaseService.set(`product/${product.sku}`, {...product, ...{id: product.sku}}, true);
    await this.firebaseService.set(`user_context/${this.user.uid}`, this.userContext, true);
  }

  async addSavings(sku: string, amount: number) {
    amount = Math.round(amount * 100) / 100;

    const savings = this.userContext?.savings || {};
    savings[sku] = amount;

    await this.firebaseService.set(`user_context/${this.user.uid}`, { savings }, true);
  }

  showExtension(url: string) {
    this.message.sendMessageToTab(
      {
        action: ShowIframe,
      },
      null,
      url,
    );
  }

  async signInWithUid() {
    const uid = window.localStorage.getItem('uid');
    await this.auth.signInWithUid(uid);
  }

  async startSpinning() {
    this.showResult = false;
    this.message.sendMessage(
      {
        action: StartSpinExtensionIcon,
      }
    );
    await this.spinner.show();
  }

  async stopSpinning() {
    this.showResult = true;
    this.message.sendMessage(
      {
        action: StopSpinExtensionIcon,
      }
    );
    await this.spinner.hide();
  }

  async ngOnInit() {
    this.user = this.auth.currentUser;

    this.message.handleMessage(SetUserId, async message => {
      window.localStorage.setItem('uid', message.data);
      await this.signInWithUid();
    });

    this.message.handleMessage(GetUserId, (message, sender, sendResponse) => {
      const uid = window.localStorage.getItem('uid');
      sendResponse(uid);
    });

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    await this.signInWithUid();

    this.userContext = await this.firebaseService.docAsPromise(`user_context/${this.user.uid}`);

    const retailers: any[] = await this.storage.getValue('retailers');
    const tab = await this.util.getSeletedTab();
    const retailer = retailers.find(r => {
      return tab.url.includes(r.url);
    });
    
    if (!retailer) {
      this.showResult = true;
      return;
    }

    await this.startSpinning();

    this.message.sendMessageToTab(
      {
        action: TryToScrapeData,
        url: tab.url,
        retailer,
      },
      async (product: Product) => {
        console.log('Product:', product);
        if (!product) {
          await this.stopSpinning();
          return;
        }

        if (product.sku === '') {
          product.sku = sha1(`${product.title}${product.retailer}`);
        }
  
        this.ngZone.run(async () => {
          // Todo: We need to store a product to firebase before scraping
          this.products = await this.scraper.getProducts(product);
  
          console.log('products:', this.products);
  
          if (this.products.length === 0) {
            this.message.sendMessageToTab(
              {
                action: ChangeIframeStyle,
                class: 'notification',
                type: AddClass,
              }
            );
          } else {
            await this.addSavings(product.sku, product.price - this.products[0].price);
          }
  
          this.showExtension(tab.url);
          await this.stopSpinning();
        });
      }
    );
  }

  ngOnDestroy() {
    this.message.sendMessageToTab(
      {
        action: ChangeIframeStyle,
        class: 'notification',
        type: RemoveClass,
      }
    );
  }
}
