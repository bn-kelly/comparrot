import { Injectable } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/analytics';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private afAnalytics: AngularFireAnalytics) {}

  logEvent(event: string, eventParams?: { [key: string]: any }) {
    return this.afAnalytics.logEvent(event, eventParams);
  }
}
