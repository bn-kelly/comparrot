import { Injectable } from '@angular/core';

declare const ga: any;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor() {}

  logEvent(category: CategoryType, event: EventType, eventParams?: { [key: string]: any }) {
    try {
      ga('send', {
        hitType: 'event',
        eventCategory: category,
        eventAction: analyticsEvents[event] || event,
        ...eventParams,
      });
    } catch(e) {}
  }

  logPageView(url: string) {
    try {
      ga('send', {
        hitType: 'pageview',
        page: url,
      });
    } catch(e) {}
  }
}

export type CategoryType
   = 'User'
   | 'Product';

export type EventType
   = 'new_user' 
   | 'product_add_to_wishlist'
   | 'product_remove_from_wishlist'
   | 'product_click'
   | 'product_search'
   | 'product_savings'
   | 'product_share'
   | 'product_remove';

export const analyticsEvents = {
  'product_click': 'Extension Buy Button Click',
  'product_search': 'Clicked Wishlist Item',
  'product_add_to_wishlist': 'Added Product to Wishlist',
  'product_remove_from_wishlist': 'Removed Product from Wishlist',
  'product_share': 'Product shared'
}