import { Injectable } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/analytics';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private afAnalytics: AngularFireAnalytics) {}

  logEvent(event: AnalyticsEvent, eventParams?: { [key: string]: any }) {
    return this.afAnalytics.logEvent(event, eventParams);
  }
}

export type AnalyticsEvent
   = 'new_user' 
   | 'page_view' 
   | 'product_add_to_wishlist'
   | 'product_remove_from_wishlist'
   | 'product_click'
   | 'product_search'
   | 'product_savings'
   | 'product_share'
   | 'product_remove';
