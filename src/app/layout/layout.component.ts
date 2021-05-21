import sha1 from 'sha1';
import * as moment from 'moment';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Component, OnInit, ViewChild } from '@angular/core';
import { SidebarDirective } from '../../@fury/shared/sidebar/sidebar.directive';
import { SidenavService } from './sidenav/sidenav.service';
import { filter, map, startWith } from 'rxjs/operators';
import { ThemeService } from '../../@fury/services/theme.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { checkRouterChildsData } from '../../@fury/utils/check-router-childs-data';
import { AuthService } from '../pages/authentication/services/auth.service';
import { Vendor } from './vendor.model';
import { Project } from './project.model';

@Component({
  selector: 'fury-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  @ViewChild('configPanel', { static: true }) configPanel: SidebarDirective;

  sidenavOpen$ = this.sidenavService.open$;
  sidenavMode$ = this.sidenavService.mode$;
  sidenavCollapsed$ = this.sidenavService.collapsed$;
  sidenavExpanded$ = this.sidenavService.expanded$;
  quickPanelOpen: boolean;
  showConfigPanel: boolean;
  scrapedUrls: string[] = [];
  vendors: Vendor[];
  isExtension: boolean;

  sideNavigation$ = this.themeService.config$.pipe(
    map(config => config.navigation === 'side'),
  );
  topNavigation$ = this.themeService.config$.pipe(
    map(config => config.navigation === 'top'),
  );
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
    private sidenavService: SidenavService,
    private themeService: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isExtension = !!window.chrome && !!window.chrome.extension;

    this.auth.user.subscribe(user => {
      if (!user || user.isAnonymous) {
        this.showConfigPanel = false;
      }

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

      this.showConfigPanel = !!user && !!user.isAdmin;

      if (!!user && !!user.projectName && !this.isExtension) {
        this.afs
          .collection('projects')
          .doc(user.projectName)
          .valueChanges()
          .subscribe((project: Project) => {
            if (!project) {
              return;
            }

            Array.from(document.getElementsByTagName('link')).forEach(link => {
              if (link.getAttribute('rel') === 'icon') {
                const favicon = link.getAttribute('href');
                if (!!project.favicon && favicon !== project.favicon) {
                  link.setAttribute('href', project.favicon);
                }
                if (!project.favicon) {
                  link.setAttribute('href', 'favicon.ico');
                }
              }
            });

            Array.from(document.getElementsByTagName('script')).forEach(
              script => {
                if (project.gtmCode) {
                  if (script.id === 'gtag-src') {
                    script.setAttribute(
                      'src',
                      `https://www.googletagmanager.com/gtag/js?id=${project.gtmCode}`,
                    );
                  }
                  if (script.id === 'gtag-func') {
                    script.innerHTML = `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());

                  gtag('config', '${project.gtmCode}');
                `;
                  }
                } else {
                  if (script.id === 'gtag-src') {
                    script.removeAttribute('src');
                  }
                  if (script.id === 'gtag-func') {
                    script.innerHTML = '';
                  }
                }
              },
            );
          });
      }

      if (this.isExtension) {
        this.afs
          .collection('vendors')
          .valueChanges()
          .subscribe((vendors: Vendor[]) => {
            this.vendors = vendors;

            window.chrome.tabs.getSelected(null, tab => {
              // TODO: remove when 174512601 is done
              console.info('this.scrapedUrls');
              console.info(this.scrapedUrls);
              if (
                Array.isArray(this.scrapedUrls) &&
                this.scrapedUrls.includes(tab.url)
              ) {
                return;
              }
              // TODO: remove when 174512601 is done
              console.info('--- layout try-to-scrape-data ---');
              window.chrome.tabs.sendMessage(tab.id, {
                action: 'try-to-scrape-data',
                url: tab.url,
                vendors: this.vendors,
              });
              this.scrapedUrls.push(tab.url);
            });
          });
      }
    });

    this.afAuth.onAuthStateChanged(user => {
      const afs = this.afs;
      if (this.isExtension) {
        window.chrome.extension.onMessage.addListener(
          async function saveProductToDB(message) {
            window.chrome.extension.onMessage.removeListener(saveProductToDB);
            if (message.action === 'save-product-to-db') {
              // TODO: remove when 174512601 is done
              console.info('--- layout save-product-to-db ---');

              const { product } = message;

              const doc = product.vendorInnerCode
                ? product.vendorInnerCode
                : sha1(product.url);

              await afs
                .doc(`products/${doc}`)
                .get()
                .toPromise()
                .then((response: any) => {
                  const data = response.data();
                  return data && Array.isArray(data.users) ? data.users : [];
                })
                .then(users => {
                  const isBot = navigator.webdriver;

                  if (isBot) {
                    afs
                      .collection('products')
                      .doc(doc)
                      .set(product, { merge: true });
                  } else if (!!user && !!user.uid) {
                    const userToSave = {
                      user: user.uid,
                      created: product.created,
                    };

                    const isExistingUser = !!users.find(
                      item => item.user === user.uid,
                    );
                    const productsData = {
                      ...product,
                      users: isExistingUser
                        ? users.reduce((result, item) => {
                            result.push(
                              item.user === user.uid ? userToSave : item,
                            );
                            return result;
                          }, [])
                        : [...users, userToSave],
                    };

                    afs
                      .collection('products')
                      .doc(doc)
                      .set(productsData, { merge: true });

                    afs.collection('visits').add({
                      user: user.uid,
                      url: product.url,
                      created: product.created,
                      product: doc,
                      scraped: 0,
                    });
                  }
                });
            }
          },
        );

        window.chrome.extension.onMessage.addListener(function saveCartToDB(
          message,
        ) {
          window.chrome.extension.onMessage.removeListener(saveCartToDB);
          if (message.action === 'save-cart-to-db' && !!user && !!user.uid) {
            const { cart } = message;

            const hash = sha1(
              cart.items.reduce((result, item) => {
                result = result + item.vendorInnerCode;
                return result;
              }, ''),
            );

            afs
              .collection('carts')
              .doc(user.uid)
              .collection(cart.vendor)
              .doc(hash)
              .set(cart, { merge: true });
          }
        });

        window.chrome.extension.onMessage.addListener(message => {
          if (message.action === 'save-registry-list-to-db') {
            const { items } = message;

            items.forEach(item => {
              const { id, date } = item;
              const unixDate = moment(date).unix() * 1000;
              const data = {
                ...item,
                unixDate,
              };
              afs.collection('registries').doc(id).set(data, { merge: true });
            });
          }

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
      }
    });
  }

  openQuickPanel() {
    this.quickPanelOpen = true;
  }

  openConfigPanel() {
    this.configPanel.open();
  }

  closeSidenav() {
    this.sidenavService.close();
  }

  openSidenav() {
    this.sidenavService.open();
  }
}
