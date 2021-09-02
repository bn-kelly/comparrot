import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { QueryBuilder } from '@coturiv/firebase';
import { FirebaseService, leftJoin } from '@coturiv/firebase/app';
import { take } from 'rxjs/operators';
import { User } from 'src/app/models/user.model';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from '../authentication/services/auth.service';

@Component({
  selector: 'fury-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
})
export class WishlistComponent implements OnInit {
  user: User;
  wishlist = [];

  constructor(
    private firebaseService: FirebaseService,
    private auth: AuthService,
    private analyticsService: AnalyticsService,
  ) {}

  async onProductClick(event: any, url: string) {
    event.preventDefault();
    window.chrome.tabs.create({ url });

    await this.analyticsService.logEvent('Product', 'product_search', {
      url: url,
    });
  }

  async ngOnInit() {
    this.user = this.auth.currentUser;
    const { wishlist } =
      (await this.firebaseService.docAsPromise(
        `user_context/${this.user.uid}`,
      )) || [];

    if (!wishlist || wishlist.length === 0) {
      return;
    }

    const qb = new QueryBuilder();
    qb.where(['id', 'in', wishlist]);
    this.wishlist = await this.firebaseService.collectionAsPromise(
      'product',
      qb,
    );
  }

  async deleteItem(id: string) {
    this.wishlist = this.wishlist.filter(p => p.id !== id);
    const ids = this.wishlist.map(p => p.id);
    await this.firebaseService.set(
      `user_context/${this.user.uid}`,
      { wishlist: ids },
      true,
    );

    await this.analyticsService.logEvent(
      'Product',
      'product_remove_from_wishlist',
      {
        sku: id,
      },
    );
  }
}
