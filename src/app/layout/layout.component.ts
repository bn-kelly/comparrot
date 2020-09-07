import sha1 from 'sha1';
import { AngularFirestore } from '@angular/fire/firestore';
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
  productsProcessing = [];
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
    public auth: AuthService,
    private sidenavService: SidenavService,
    private themeService: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isExtension = !!window.chrome && !!window.chrome.extension;

    this.afs
      .collection('vendors')
      .valueChanges()
      .subscribe((vendors: Vendor[]) => {
        this.vendors = vendors;
      });

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

        return;
      }

      const { uid, isAdmin, projectName, isBot } = user;

      this.showConfigPanel = !!isAdmin;

      if (projectName && !this.isExtension) {
        this.afs
          .collection('projects')
          .doc(projectName)
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

      if (this.isExtension && !!uid) {
        window.chrome.tabs.getSelected(null, tab => {
          window.chrome.tabs.sendMessage(tab.id, {
            action: 'try-to-scrape-data',
            url: tab.url,
            vendors: this.vendors,
          });
        });

        window.chrome.extension.onMessage.addListener(message => {
          if (message.action === 'save-product-to-db') {
            const { product } = message;
            const urlHash = sha1(product.url);

            const productsData = {
              ...product,
            };

            this.afs
              .collection('products')
              .doc(uid)
              .collection('latest')
              .doc(urlHash)
              .set(productsData, { merge: true });

            const allProductsData = {
              ...productsData,
              user: uid,
            };

            this.afs
              .collection('allProducts')
              .doc(urlHash)
              .set(allProductsData, { merge: true });

            if (
              isBot &&
              this.isExtension &&
              !this.productsProcessing.find(
                item => item.title === product.title,
              )
            ) {
              this.tryToScrapeData({ product });
            }
          }
        });
      }
    });
  }

  tryToScrapeData({ product }) {
    this.productsProcessing.push(product);

    this.vendors
      .filter(item => item.url.split('.')[0] !== product.vendor)
      .forEach(vendor => {
        window.chrome.tabs.create({
          url: `${vendor.searchUrl}${encodeURIComponent(product.title)}`,
        });
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
