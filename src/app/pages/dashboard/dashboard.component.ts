import { Component, NgZone, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from '../../services/message.service';
import { ScraperService } from '../../services/scraper.service';
import { UtilService } from '../../services/util.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../pages/authentication/services/auth.service';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';
import { Product } from '../../models/product.model';
import { UserContext } from 'src/app/models/user-context.model';
import { SetUserId, PerformGoogleSearch, ShowIframe, TryToScrapeData, StartSpinExtensionIcon, StopSpinExtensionIcon, ChangeIframeStyle } from '../../constants';
import { FirebaseService } from '@coturiv/firebase/app';
import { take } from 'rxjs/operators';

@Component({
  selector: 'fury-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
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

  deleteOffer(product: Product) {
    this.products = this.products.filter(p => {
      return p.sku !== product.sku;
    });
  }

  onProductClick(event: any, url: string) {
    event.preventDefault();
    window.chrome.tabs.create({ url });
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

  showExtension() {
    this.message.sendMessageToTab(
      {
        action: ShowIframe,
      },
      null,
    );
  }

  async signInWithUid() {
    const uid = window.localStorage.getItem('uid');

    if (!uid) {
      return;
    }

    if (uid === 'null' && this.auth.isAuthenticated()) {
      await this.auth.signOut();
      return;
    }

    if (uid !== 'null' && !this.auth.isAuthenticated()) {
      const data: any = await this.auth.getCustomToken(uid);

      if (data.token) {
        await this.auth.signInWithCustomToken(data.token);
      }
    }
  }

  async startSpinning() {
    this.showResult = false;
    this.message.sendMessage(
      {
        action: StartSpinExtensionIcon,
      },
      null,
    );
    await this.spinner.show();
  }

  async stopSpinning() {
    this.showResult = true;
    this.message.sendMessage(
      {
        action: StopSpinExtensionIcon,
      },
      null,
    );
    await this.spinner.hide();
  }

  async ngOnInit() {
    this.user = this.auth.currentUser;

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    await this.signInWithUid();

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

    this.message.handleMessage(SetUserId, message => {
      window.localStorage.setItem('uid', message.uid);
    });

    this.message.handleMessage(PerformGoogleSearch, async message => {
      const product = message.data as Product;
      console.log('Product:', product);
      if (!product) {
        await this.stopSpinning();
        return;
      }

      this.ngZone.run(async () => {
        this.products = await this.scraper.getProducts(product);

        console.log('products:', this.products);

        // if (this.products.length === 0) {
        //   this.message.sendMessageToTab(
        //     {
        //       action: ChangeIframeStyle,
        //       class: 'notification',
        //     },
        //     null,
        //   );
        // }

        this.showExtension();
        await this.stopSpinning();
      });
    });

    this.message.sendMessageToTab(
      {
        action: TryToScrapeData,
        url: tab.url,
        retailer,
      },
      null,
    );

    this.userContext = await this.firebaseService.doc(`user_context/${this.user.uid}`).pipe(take(1)).toPromise();
  }
}
