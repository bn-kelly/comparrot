import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { QueryBuilder } from '@coturiv/firebase';
import { FirebaseService, leftJoin } from '@coturiv/firebase/app';
import { take } from 'rxjs/operators';

@Component({
  selector: 'fury-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit {
  @Input()
  userWishlist: [];

  @Output()
  itemDelete = new EventEmitter();

  wishlist = [];

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    if (this.userWishlist.length === 0) {
      return;
    }

    const qb = new QueryBuilder();
    qb.where(['id', 'in', this.userWishlist]);
    this.wishlist = await this.firebaseService.collectionAsPromise('product', qb);
  }

  deleteItem(id: string) {
    const ids = this.userWishlist.filter(s => s !== id);
    this.wishlist = this.wishlist.filter(p => p.id !== id);
    this.itemDelete.emit(ids);
  }

}
