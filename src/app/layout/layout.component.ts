import { filter, map, startWith } from 'rxjs/operators';
import { Component, ElementRef, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ThemeService } from '../../@fury/services/theme.service';
import { checkRouterChildsData } from '../../@fury/utils/check-router-childs-data';
import { AuthService } from '../pages/authentication/services/auth.service';

@Component({
  selector: 'fury-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {

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

  toolbarButtons = [{
    title: 'Home',
    url: '/home',
    icon: 'icon-home'
  }, {
    title: 'Deals',
    url: '/deals',
    icon: 'icon-store'
  }, {
    title: 'Liked',
    url: '/wishlist',
    icon: 'icon-heart'
  }]

  constructor(
    public auth: AuthService,
    private themeService: ThemeService,
    private router: Router,
    private renderer: Renderer2,
    private elementRef: ElementRef
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
    });

    this.router.events.pipe(
      filter<NavigationEnd>(event => event instanceof NavigationEnd),
    ).subscribe((evt) => {
      this.toolbarButtons.forEach((btn: any) => {
        btn.selected = evt.url.includes(btn.url);
      });

      const el = this.elementRef.nativeElement.querySelector('.avatar');
      this.renderer.setStyle(el, 'border',  evt.url.includes('/account') ? 'solid 3px #FFF' : '');
    });
  }
}
