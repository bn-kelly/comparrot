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
import { SetUserId, PerformGoogleSearch, ShowIframe, TryToScrapeData } from '../../constants';

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
  showResult: Boolean;

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
  ) {}

  deleteOffer(id) {
    // this.afs
    //   .collection('offers')
    //   .doc(this.user.uid)
    //   .collection('latest')
    //   .doc(id)
    //   .delete();
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
      .collection('user')
      .doc(this.user.uid)
      .update({ wishList: wishList.sort() });
  }

  showExtension() {
    this.message.sendMessage(
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

  ngOnInit() {
    this.showResult = false;
    this.auth.user.subscribe(async user => {
      this.user = user;

      if (!this.auth.isAuthenticated()) {
        this.router.navigate(['/login']);
        return;
      }

      await this.spinner.show();
      await this.signInWithUid();

      const retailers = await this.storage.getValue('retailers');
      const tab = await this.util.getSeletedTab();

      this.message.handleMessage(SetUserId, message => {
        window.localStorage.setItem('uid', message.uid);
      });

      this.message.handleMessage(PerformGoogleSearch, async message => {
        const product = message.data as Product;
        console.log('Product:', product);
        if (!product) {
          this.showResult = true;
          await this.spinner.hide();
          return;
        }

        this.ngZone.run(async () => {
          this.products = await this.scraper.getProducts(product);
          console.log('products:', this.products);
          this.showExtension();
          this.showResult = true;
          await this.spinner.hide();
        });
      });

      this.message.sendMessage(
        {
          action: TryToScrapeData,
          url: tab.url,
          retailers,
        },
        null,
      );

      if (!user) {
        this.isLoggedIn = false;
        await this.auth.anonymousLogin();
        return;
      }

      const { isAnonymous, projectName } = user;

      if (!!projectName) {
        this.afs
          .collection('project')
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
          .collection('user')
          .doc(this.user.uid)
          .update({ wishList: [] });
      }
    });
  }
}
