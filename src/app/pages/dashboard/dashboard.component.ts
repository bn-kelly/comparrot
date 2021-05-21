import * as firebase from 'firebase/app';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ChartData } from 'chart.js';
import * as moment from 'moment';
import { Observable, ReplaySubject } from 'rxjs';
import { AdvancedPieChartWidgetOptions } from './widgets/advanced-pie-chart-widget/advanced-pie-chart-widget-options.interface';
import { AudienceOverviewWidgetOptions } from './widgets/audience-overview-widget/audience-overview-widget-options.interface';
import { BarChartWidgetOptions } from './widgets/bar-chart-widget/bar-chart-widget-options.interface';
import { DonutChartWidgetOptions } from './widgets/donut-chart-widget/donut-chart-widget-options.interface';
import {
  RealtimeUsersWidgetData,
  RealtimeUsersWidgetPages,
} from './widgets/realtime-users-widget/realtime-users-widget.interface';
import { RecentSalesWidgetOptions } from './widgets/recent-sales-widget/recent-sales-widget-options.interface';
import { SalesSummaryWidgetOptions } from './widgets/sales-summary-widget/sales-summary-widget-options.interface';
import { DashboardService } from './dashboard.service';
import { ExtensionService, SetUserId, PerformGoogleSearch } from '../../services/extension.service';
import { ScraperService } from '../../services/scraper.service';
import { ChartWidgetOptions } from '../../../@fury/shared/chart-widget/chart-widget-options.interface';
import {
  AuthService,
  User,
} from '../../pages/authentication/services/auth.service';
import { Offer } from './offer.model';
import { Project } from '../../layout/project.model';

@Component({
  selector: 'fury-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private static isInitialLoad = true;
  isExtension: boolean;
  user: User;
  projectName: string;
  isLoggedIn: boolean;
  offers: Offer[];
  salesData$: Observable<ChartData>;
  totalSalesOptions: BarChartWidgetOptions = {
    title: 'Total Sales',
    gain: 16.3,
    subTitle: 'compared to last month',
    background: '#3F51B5',
    color: '#FFFFFF',
  };
  visitsData$: Observable<ChartData>;
  totalVisitsOptions: ChartWidgetOptions = {
    title: 'Visits',
    gain: 42.5,
    subTitle: 'compared to last month',
    background: '#03A9F4',
    color: '#FFFFFF',
  };
  clicksData$: Observable<ChartData>;
  totalClicksOptions: ChartWidgetOptions = {
    title: 'Total Clicks',
    gain: -6.1,
    subTitle: 'compared to last month',
    background: '#4CAF50',
    color: '#FFFFFF',
  };
  conversionsData$: Observable<ChartData>;
  conversionsOptions: ChartWidgetOptions = {
    title: 'Conversions',
    gain: 10.4,
    subTitle: 'compared to last month',
    background: '#009688',
    color: '#FFFFFF',
  };
  salesSummaryData$: Observable<ChartData>;
  salesSummaryOptions: SalesSummaryWidgetOptions = {
    title: 'Sales Summary',
    subTitle: 'Compare Sales by Time',
    gain: 37.2,
  };
  top5CategoriesData$: Observable<ChartData>;
  top5CategoriesOptions: DonutChartWidgetOptions = {
    title: 'Top Categories',
    subTitle: 'Compare Sales by Category',
  };
  audienceOverviewOptions: AudienceOverviewWidgetOptions[] = [];
  recentSalesData$: Observable<ChartData>;
  recentSalesOptions: RecentSalesWidgetOptions = {
    title: 'Recent Sales',
    subTitle: 'See who bought what in realtime',
  };
  recentSalesTableOptions = {
    pageSize: 5,
    columns: [
      {
        name: 'Product',
        property: 'name',
        visible: true,
        isModelProperty: true,
      },
      {
        name: '$ Price',
        property: 'price',
        visible: true,
        isModelProperty: true,
      },
      {
        name: 'Time ago',
        property: 'timestamp',
        visible: true,
        isModelProperty: true,
      },
    ],
  };
  recentSalesTableData$: Observable<any[]>;
  advancedPieChartOptions: AdvancedPieChartWidgetOptions = {
    title: 'Sales by country',
    subTitle: 'Top 3 countries sold 34% more items this month\n',
  };
  advancedPieChartData$: Observable<ChartData>;
  private _realtimeUsersDataSubject = new ReplaySubject<
    RealtimeUsersWidgetData
  >(30);
  realtimeUsersData$: Observable<
    RealtimeUsersWidgetData
  > = this._realtimeUsersDataSubject.asObservable();
  private _realtimeUsersPagesSubject = new ReplaySubject<
    RealtimeUsersWidgetPages[]
  >(1);
  realtimeUsersPages$: Observable<
    RealtimeUsersWidgetPages[]
  > = this._realtimeUsersPagesSubject.asObservable();
  /**
   * Needed for the Layout
   */
  private _gap = 16;
  gap = `${this._gap}px`;

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private auth: AuthService,
    private afs: AngularFirestore,
    private extension: ExtensionService,
    private scraper: ScraperService,
  ) {
    /**
     * Edge wrong drawing fix
     * Navigate anywhere and on Promise right back
     */
    if (/Edge/.test(navigator.userAgent)) {
      if (DashboardComponent.isInitialLoad) {
        this.router.navigate(['/apps/chat']).then(() => {
          this.router.navigate(['/']);
        });

        DashboardComponent.isInitialLoad = false;
      }
    }
  }

  col(colAmount: number) {
    return `1 1 calc(${100 / colAmount}% - ${
      this._gap - this._gap / colAmount
    }px)`;
  }

  deleteOffer(id) {
    this.afs
      .collection('offers')
      .doc(this.user.uid)
      .collection('latest')
      .doc(id)
      .delete();
  }

  onBuyButtonClick(event, url) {
    if (this.isExtension) {
      event.preventDefault();
      window.chrome.tabs.create({ url });
    }
  }

  toggleAddToWishlist(id) {
    const wishList = this.user.wishList.includes(id)
      ? this.user.wishList.filter(category => category !== id)
      : [...this.user.wishList, id];

    this.afs
      .collection('users')
      .doc(this.user.uid)
      .update({ wishList: wishList.sort() });
  }

  getOffersByUser(user) {
    if (!user) {
      return;
    }
    this.dashboardService.getOffersByUser(user).subscribe((offers: Offer[]) => {
      this.offers =
        user.isAnonymous && offers.length
          ? [offers.sort((a, b) => b.created - a.created)[0]]
          : offers.sort((a, b) => b.created - a.created) || [];
      if (!this.isLoggedIn && !this.offers.length && this.isExtension) {
        this.router.navigate(['/login']);
      }
    });
  }

  getDeals(user) {
    if (!user) {
      return;
    }
    this.dashboardService.getDeals(user).subscribe((offers: Offer[]) => {
      this.offers = offers.sort((a, b) => b.created - a.created) || [];
      if (!this.isLoggedIn && !this.offers.length && this.isExtension) {
        this.router.navigate(['/login']);
      }
    });
  }

  showExtension() {
    if (!window.chrome || !window.chrome.tabs) {
      return;
    }

    window.chrome.tabs.getSelected(null, tab => {
      window.chrome.tabs.sendMessage(tab.id, {
        action: 'show-iframe',
      });
    });
  }

  async signInWithUid() {
    const uid = window.localStorage.getItem('uid');

    if (!uid) {
      return;
    }

    if (uid === 'null' && this.auth.isAuthenticated()) {
      this.auth.signOut();
      return;
    }

    if (uid !== 'null' && !this.auth.isAuthenticated()) {
      const data: any = await this.auth.getCustomToken(uid);

      if (data.token) {
        this.auth.signInWithCustomToken(data.token);
      }
    }
  }

  /**
   * Everything implemented here is purely for Demo-Demonstration and can be removed and replaced with your implementation
   */
  ngOnInit() {
    this.isExtension = !!window.chrome && !!window.chrome.extension;
    this.salesData$ = this.dashboardService.getSales();
    this.auth.user.subscribe(async user => {
      this.user = user;

      if (this.extension.isExtension) {
        this.signInWithUid();
        this.extension.handleMessage(SetUserId, message => {
          window.localStorage.setItem('uid', message.uid);
        });
        this.extension.handleMessage(PerformGoogleSearch, async message => {
          if (!message.data) {
            return;
          }

          const data = await this.scraper.searchGoogle(message.data);
          console.log('this.scraper.searchGoogle:', data);
        });
      }

      if (!user) {
        this.isLoggedIn = false;
        const isBot = navigator.webdriver;
        if (!isBot) {
          this.auth.anonymousLogin();
        }
        return;
      }

      const { isAnonymous, projectName } = user;

      if (!!projectName) {
        this.afs
          .collection('projects')
          .doc(user.projectName)
          .valueChanges()
          .subscribe((project: Project) => {
            this.projectName =
              project && project.name
                ? project.name.charAt(0).toUpperCase() + project.name.slice(1)
                : '';
          });
      }

      this.isLoggedIn = !isAnonymous;

      if (!isAnonymous && !Array.isArray(user.wishList)) {
        this.afs
          .collection('users')
          .doc(this.user.uid)
          .update({ wishList: [] });
      }

      if (this.extension.isExtension) {
        this.getOffersByUser(user);
      } else {
        if (this.isLoggedIn) {
          window.localStorage.setItem('uid', user.uid);
        }
        this.getDeals(user);
      }

      const shouldShowExtension =
        user.extension && user.extension && user.extension.show;

      if (shouldShowExtension) {
        const userData = {
          ...user,
          extension: {
            show: false,
            lastShown: firebase.firestore.Timestamp.now().seconds,
          },
        };

        this.showExtension();
        this.auth.updateUserData(userData);
      }
    });
    this.visitsData$ = this.dashboardService.getVisits();
    this.clicksData$ = this.dashboardService.getClicks();
    this.conversionsData$ = this.dashboardService.getConversions();
    this.salesSummaryData$ = this.dashboardService.getSalesSummary();
    this.top5CategoriesData$ = this.dashboardService.getTop5Categories();

    // Audience Overview Widget
    this.dashboardService.getAudienceOverviewUsers().subscribe(response => {
      this.audienceOverviewOptions.push({
        label: 'Users',
        data: response,
      } as AudienceOverviewWidgetOptions);
    });
    this.dashboardService.getAudienceOverviewSessions().subscribe(response => {
      this.audienceOverviewOptions.push({
        label: 'Sessions',
        data: response,
      } as AudienceOverviewWidgetOptions);
    });
    this.dashboardService
      .getAudienceOverviewBounceRate()
      .subscribe(response => {
        const property: AudienceOverviewWidgetOptions = {
          label: 'Bounce Rate',
          data: response,
        };

        // Calculate Bounce Rate Average
        const data = response.datasets[0].data as number[];
        property.sum = `${(
          data.reduce((sum, x) => sum + x) / data.length
        ).toFixed(2)}%`;

        this.audienceOverviewOptions.push(property);
      });

    this.dashboardService
      .getAudienceOverviewSessionDuration()
      .subscribe(response => {
        const property: AudienceOverviewWidgetOptions = {
          label: 'Session Duration',
          data: response,
        };

        // Calculate Average Session Duration and Format to Human Readable Format
        const data = response.datasets[0].data as number[];
        const averageSeconds = (
          data.reduce((sum, x) => sum + x) / data.length
        ).toFixed(0);
        property.sum = `${averageSeconds} sec`;

        this.audienceOverviewOptions.push(property);
      });

    // Prefill realtimeUsersData with 30 random values
    for (let i = 0; i < 30; i++) {
      this._realtimeUsersDataSubject.next({
        label: moment().fromNow(),
        value: Math.round(Math.random() * (100 - 10) + 10),
      } as RealtimeUsersWidgetData);
    }

    // Simulate incoming values for Realtime Users Widget
    setInterval(() => {
      this._realtimeUsersDataSubject.next({
        label: moment().fromNow(),
        value: Math.round(Math.random() * (100 - 10) + 10),
      } as RealtimeUsersWidgetData);
    }, 5000);

    // Prefill realtimeUsersPages with 3 random values
    const demoPages = [];
    const demoPagesPossibleValues = [
      '/components',
      '/tables/all-in-one-table',
      '/apps/inbox',
      '/apps/chat',
      '/dashboard',
      '/login',
      '/register',
      '/apps/calendar',
      '/forms/form-elements',
    ];
    for (let i = 0; i < 3; i++) {
      const nextPossibleValue =
        demoPagesPossibleValues[
          +Math.round(Math.random() * (demoPagesPossibleValues.length - 1))
        ];
      if (demoPages.indexOf(nextPossibleValue) === -1) {
        demoPages.push(nextPossibleValue);
      }

      this._realtimeUsersPagesSubject.next(
        demoPages.map(pages => {
          return { page: pages } as RealtimeUsersWidgetPages;
        }),
      );
    }

    // Simulate incoming values for Realtime Users Widget
    setInterval(() => {
      const nextPossibleValue =
        demoPagesPossibleValues[
          +Math.round(Math.random() * (demoPagesPossibleValues.length - 1))
        ];
      if (demoPages.indexOf(nextPossibleValue) === -1) {
        demoPages.push(nextPossibleValue);
      }

      if (demoPages.length > Math.random() * (5 - 1) + 1) {
        demoPages.splice(Math.round(Math.random() * demoPages.length), 1);
      }

      this._realtimeUsersPagesSubject.next(
        demoPages.map(pages => {
          return { page: pages } as RealtimeUsersWidgetPages;
        }),
      );
    }, 5000);

    this.recentSalesTableData$ = this.dashboardService.getRecentSalesTableData();
    this.recentSalesData$ = this.dashboardService.getRecentSalesData();

    this.advancedPieChartData$ = this.dashboardService.getAdvancedPieChartData();
  }
}
