import sha1 from 'sha1';
import * as moment from 'moment';
import { filter, map, startWith } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ThemeService } from '../../@fury/services/theme.service';
import { checkRouterChildsData } from '../../@fury/utils/check-router-childs-data';
import { AuthService } from '../pages/authentication/services/auth.service';
import { MessageService } from '../services/message.service';
import { UtilService } from '../services/util.service';
import { TryToScrapeData } from '../constants';
import { Vendor } from '../models/vendor.model';

@Component({
  selector: 'fury-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  scrapedUrls: string[] = [];
  vendors: Vendor[];

  toolbarVisible$ = this.themeService.config$.pipe(
    map(config => config.toolbarVisible),
  );
  toolbarPosition$ = this.themeService.config$.pipe(
    map(config => config.toolbarPosition),
  );
  footerPosition$ = this.themeService.config$.pipe(
    map(config => config.footerPosition),
  );

  scrollDisabled$ = this.router.events.pipe(
    filter<NavigationEnd>(event => event instanceof NavigationEnd),
    startWith(null),
    map(() =>
      checkRouterChildsData(
        this.router.routerState.root.snapshot,
        data => data.scrollDisabled,
      ),
    ),
  );

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    public auth: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private message: MessageService,
    private util: UtilService,
  ) {}

  ngOnInit() {
    this.auth.user.subscribe(user => {
      if (!user) {
        Array.from(document.getElementsByTagName('link')).forEach(link => {
          if (link.getAttribute('rel') === 'icon') {
            link.setAttribute('href', 'favicon.ico');
          }
        });

        Array.from(document.getElementsByTagName('script')).forEach(script => {
          if (script.id === 'gtag-src') {
            script.removeAttribute('src');
          }
          if (script.id === 'gtag-func') {
            script.innerHTML = '';
          }
        });
      }

      this.afs
        .collection('retailers')
        .valueChanges()
        .subscribe(async (vendors: Vendor[]) => {
          this.vendors = vendors;

          const tab = await this.util.getSeletedTab();
          console.info('this.scrapedUrls');
          console.info(this.scrapedUrls);

          if (
            Array.isArray(this.scrapedUrls) &&
            this.scrapedUrls.includes(tab.url)
          ) {
            return;
          }

          console.info('--- layout try-to-scrape-data ---');
          this.message.sendMessage(
            {
              action: TryToScrapeData,
              url: tab.url,
              vendors: this.vendors,
            },
            null,
          );
          this.scrapedUrls.push(tab.url);
        });
    });

    this.afAuth.onAuthStateChanged(user => {
      const afs = this.afs;

      window.chrome.extension.onMessage.addListener(message => {
        if (message.action === 'save-registry-result-to-db') {
          const { id, items, itemsQuantity } = message;
          const itemsData = items.reduce(
            (result, item) => {
              result.itemsTotal =
                +result.itemsTotal + +(item.purchased.total || 0);
              result.itemsRemaining =
                +result.itemsRemaining + +(item.purchased.remaining || 0);
              result.itemsPurchased =
                +result.itemsPurchased + +(item.purchased.purchased || 0);

              return result;
            },
            {
              itemsPurchased: 0,
              itemsRemaining: 0,
              itemsTotal: 0,
            },
          );

          const data = {
            items,
            itemsQuantity,
            ...itemsData,
          };

          afs.collection('registries').doc(id).set(data, { merge: true });
        }
      });
    });
  }
}
