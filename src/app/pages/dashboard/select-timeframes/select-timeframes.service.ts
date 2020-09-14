import { User } from '../../authentication/services/auth.service';
import { Injectable } from '@angular/core';
import { AuthService } from '../../authentication/services/auth.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface TimeFrame {
  value: number;
  viewValue: string;
  order?: number;
}

export interface OffersFilter {
  defaultSelectedValue: number;
  timeFrames: TimeFrame[];
}

@Injectable({
  providedIn: 'root',
})
export class SelectTimeframesService {
  user: User;
  constructor(private auth: AuthService, private afs: AngularFirestore) {
    if (this.auth.user) {
      this.auth.user.subscribe(user => (this.user = user));
    }
  }

  getOffersFilter(): Observable<OffersFilter> {
    return this.afs
      .collection('filters')
      .doc('offers')
      .valueChanges() as Observable<OffersFilter>;
  }

  saveDefaultSelectedToUser(value: number): void {
    this.afs
      .collection('users')
      .doc(this.auth.uid)
      .set({ filters: { offersDefaultSelected: value } }, { merge: true });
  }

  getDefaultSelectedUser(): number {
    if (
      !this.user ||
      !this.user.filters ||
      !this.user.filters.offersDefaultSelected
    ) {
      return -1;
    }
    return this.user.filters.offersDefaultSelected;
  }
}
