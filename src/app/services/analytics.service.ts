import { Injectable } from '@angular/core';

declare const gtag: any;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor() {}

  logEvent(event: AnalyticsEvent, eventParams?: { [key: string]: any }) {
    try {
      gtag('event', event, eventParams);
    } catch(e) {}
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
