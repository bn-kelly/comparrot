import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import {
  MessageService,
  SetUserId,
  PerformGoogleSearch,
} from '../../services/message.service';
import { ScraperService, Product } from '../../services/scraper.service';
import {
  AuthService,
  User,
} from '../../pages/authentication/services/auth.service';
import { Project } from '../../layout/project.model';

@Component({
  selector: 'fury-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  user: User;
  projectName: string;
  isLoggedIn: boolean;
  products: Product[];

  constructor(
    private auth: AuthService,
    private afs: AngularFirestore,
    private message: MessageService,
    private scraper: ScraperService,
  ) {}

  deleteOffer(id) {
    this.afs
      .collection('offers')
      .doc(this.user.uid)
      .collection('latest')
      .doc(id)
      .delete();
  }

  onBuyButtonClick(event, url) {
    event.preventDefault();
    window.chrome.tabs.create({ url });
  }

  toggleAddToWishlist(id) {
    const wishList = this.user.wishList.includes(id)
      ? this.user.wishList.filter(category => category !== id)
      : [...this.user.wishList, id];

    this.afs
      .collection('users')
      .doc(this.user.uid)
      .update({ wishList: wishList.sort() });
  }

  showExtension() {
    window.chrome.tabs.getSelected(null, tab => {
      window.chrome.tabs.sendMessage(tab.id, {
        action: 'show-iframe',
      });
    });
  }

  async signInWithUid() {
    const uid = window.localStorage.getItem('uid');

    if (!uid) {
      return;
    }

    if (uid === 'null' && this.auth.isAuthenticated()) {
      this.auth.signOut();
      return;
    }

    if (uid !== 'null' && !this.auth.isAuthenticated()) {
      const data: any = await this.auth.getCustomToken(uid);

      if (data.token) {
        this.auth.signInWithCustomToken(data.token);
      }
    }
  }

  /**
   * Everything implemented here is purely for Demo-Demonstration and can be removed and replaced with your implementation
   */
  ngOnInit() {
    this.auth.user.subscribe(async user => {
      this.user = user;

      this.signInWithUid();
      this.message.handleMessage(SetUserId, message => {
        window.localStorage.setItem('uid', message.uid);
      });
      this.message.handleMessage(PerformGoogleSearch, async message => {
        const product = message.data as Product;
        if (!product && !this.auth.isAuthenticated()) {
          return;
        }
        console.log('message.data', product);
        const googleResult = await this.scraper.searchGoogle(product);
        const scrapedResult = await this.scraper.getProducts(product);
        if (scrapedResult.length === 0) {
          this.scraper.triggerScraper(product);
        }
        console.log('scrapedResult:', scrapedResult);
        this.products = [...googleResult, ...scrapedResult].filter(p => {
          return p.retailer !== product.retailer;
        });
        console.log('products:', this.products);
      });

      if (!user) {
        this.isLoggedIn = false;
        await this.auth.anonymousLogin();
        return;
      }

      const { isAnonymous, projectName } = user;

      if (!!projectName) {
        this.afs
          .collection('projects')
          .doc(user.projectName)
          .valueChanges()
          .subscribe((project: Project) => {
            this.projectName =
              project && project.name
                ? project.name.charAt(0).toUpperCase() + project.name.slice(1)
                : '';
          });
      }

      this.isLoggedIn = !isAnonymous;

      if (!isAnonymous && !Array.isArray(user.wishList)) {
        this.afs
          .collection('users')
          .doc(this.user.uid)
          .update({ wishList: [] });
      }
    });
  }
}
