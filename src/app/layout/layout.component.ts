import sha1 from 'sha1';
import { AngularFirestore } from '@angular/fire/firestore';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {

  @ViewChild('configPanel', { static: true }) configPanel: SidebarDirective;

  sidenavOpen$ = this.sidenavService.open$;
  sidenavMode$ = this.sidenavService.mode$;
  sidenavCollapsed$ = this.sidenavService.collapsed$;
  sidenavExpanded$ = this.sidenavService.expanded$;
  quickPanelOpen: boolean;
  showConfigPanel: boolean;
  vendors: Vendor[];

  sideNavigation$ = this.themeService.config$.pipe(map(config => config.navigation === 'side'));
  topNavigation$ = this.themeService.config$.pipe(map(config => config.navigation === 'top'));
  toolbarVisible$ = this.themeService.config$.pipe(map(config => config.toolbarVisible));
  toolbarPosition$ = this.themeService.config$.pipe(map(config => config.toolbarPosition));
  footerPosition$ = this.themeService.config$.pipe(map(config => config.footerPosition));

  scrollDisabled$ = this.router.events.pipe(
    filter<NavigationEnd>(event => event instanceof NavigationEnd),
    startWith(null),
    map(() => checkRouterChildsData(this.router.routerState.root.snapshot, data => data.scrollDisabled))
  );

  constructor(private afs: AngularFirestore,
              public auth: AuthService,
              private sidenavService: SidenavService,
              private themeService: ThemeService,
              private route: ActivatedRoute,
              private router: Router) {}

  ngOnInit() {
    const isExtension = !!window.chrome && !!window.chrome.extension;

    this.afs.collection('vendors').valueChanges().subscribe((vendors: Vendor[]) => {
      this.vendors = vendors;
    });

    this.afs.collection('projects').doc('comparrot').valueChanges().subscribe((project: Project) => {
      if (project && !isExtension) {
        Array.from(document.getElementsByTagName('link'))
            .forEach(link => {
              if (link.getAttribute('rel') === 'icon') {
                const favicon = link.getAttribute('href');
                if (!!project.favicon && favicon !== project.favicon) {
                  link.setAttribute('href', project.favicon);
                }
              }
            });
      }

      if (project && project.gtmCode) {
        Array.from(document.getElementsByTagName('script'))
            .forEach(script => {
              if (script.id === 'gtag-src') {
                script.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${project.gtmCode}`);
              }
              if (script.id === 'gtag-func') {
                script.innerHTML = `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());

                  gtag('config', '${project.gtmCode}');
                `;
              }
            });
      }
    });

    this.auth.user.subscribe(user => {
      if (!user || user.isAnonymous) {
        Array.from(document.getElementsByTagName('link'))
            .forEach(link => {
              if (link.getAttribute('rel') === 'icon') {
                const favicon = link.getAttribute('href');
                if (favicon !== 'favicon.ico') {
                  link.setAttribute('href', 'favicon.ico');
                }
              }
            });
        Array.from(document.getElementsByTagName('script'))
            .forEach(script => {
              if (script.id === 'gtag-src') {
                script.removeAttribute('src');
              }
              if (script.id === 'gtag-func') {
                script.innerHTML = '';
              }
            });
        this.showConfigPanel = false;
        return;
      }

      const { uid, isAdmin } = user;

      this.showConfigPanel = !!isAdmin;

      if (isExtension && !!uid) {
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

  ngOnDestroy(): void {}
}

