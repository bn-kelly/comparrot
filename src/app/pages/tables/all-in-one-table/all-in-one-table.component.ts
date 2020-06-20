import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, of, ReplaySubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { ListColumn } from '../../../../@fury/shared/list/list-column.model';
import { BotCreateUpdateComponent } from './bot-create-update-delete/bot-create-update.component';
import { BotDeleteComponent } from './bot-create-update-delete/bot-delete.component';
import { Bot } from './bot-create-update-delete/bot.model';
import { fadeInRightAnimation } from '../../../../@fury/animations/fade-in-right.animation';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';

@Component({
  selector: 'fury-all-in-one-table',
  templateUrl: './all-in-one-table.component.html',
  styleUrls: ['./all-in-one-table.component.scss'],
  animations: [fadeInRightAnimation, fadeInUpAnimation]
})
export class AllInOneTableComponent implements OnInit, AfterViewInit, OnDestroy {

  /**
   * Simulating a service with HTTP that returns Observables
   * You probably want to remove this and do all requests in a service with HTTP
   */
  subject$: ReplaySubject<Bot[]> = new ReplaySubject<Bot[]>(1);
  data$: Observable<Bot[]> = this.subject$.asObservable();
  bots: Bot[];
  botsCollection: AngularFirestoreCollection<Bot>;
  areAllBotsSelected: boolean;

  @Input()
  columns: ListColumn[] = [
    { name: 'Active', property: 'checkbox', visible: true },
    { name: 'Icon', property: 'icon', visible: true, isModelProperty: true },
    { name: 'Image', property: 'image', visible: false },
    { name: 'Name', property: 'name', visible: true, isModelProperty: true },
    { name: 'Project', property: 'project', visible: true, isModelProperty: true },
    { name: 'Job', property: 'job', visible: true, isModelProperty: true },
    { name: 'Site', property: 'site', visible: true, isModelProperty: true },
    { name: 'id', property: 'id', visible: false, isModelProperty: true },
    { name: 'Last Seen', property: 'lastSeen', visible: true, isModelProperty: true },
    { name: 'Sessions', property: 'sessions', visible: true, isModelProperty: true },
    { name: 'Proxy', property: 'proxy', visible: false, isModelProperty: true },
    { name: 'Status', property: 'status', visible: true, isModelProperty: true },
    { name: 'Actions', property: 'actions', visible: true },
  ] as ListColumn[];
  pageSize = 10;
  dataSource: MatTableDataSource<Bot> | null;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(private dialog: MatDialog, private afs: AngularFirestore) {
  }

  get visibleColumns() {
    return this.columns.filter(column => column.visible).map(column => column.property);
  }

  ngOnInit() {
    this.botsCollection = this.afs.collection('bots');
    this.data$ = this.botsCollection.valueChanges();

    this.data$.subscribe(bots => {
      this.bots = bots;
      this.subject$.next(bots);
    });

    this.dataSource = new MatTableDataSource();

    this.data$.pipe(
      filter(data => !!data)
    ).subscribe((bots) => {
      this.bots = bots;
      this.dataSource.data = bots;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  createBot() {
    this.dialog.open(BotCreateUpdateComponent).afterClosed().subscribe((bot: Bot) => {
      if (bot) {
        this.bots.unshift(new Bot(bot));
        this.subject$.next(this.bots);
      }
    });
  }

  updateBot(bot) {
    this.dialog.open(BotCreateUpdateComponent, {
      data: bot
    }).afterClosed().subscribe((data) => {
      if (data) {
        const index = this.bots.findIndex((existingBot) => existingBot.id === bot.id);
        this.bots[index] = new Bot(bot);
        this.subject$.next(this.bots);
      }
    });
  }

  deleteBot(bot) {
    this.dialog.open(BotDeleteComponent, {
      data: bot
    }).afterClosed().subscribe((data: Bot) => {
      if (data) {
        this.bots.splice(this.bots.findIndex((existingBot) => existingBot.id === bot.id), 1);
        this.subject$.next(this.bots);
      }
    });
  }

  toggleSelectAllBots() {
    this.areAllBotsSelected = !this.areAllBotsSelected;
    this.bots.forEach(bot => {
      this.afs.collection('bots').doc(bot.id).update({ selected: this.areAllBotsSelected });
    });
  }

  toggleSelectBot(id) {
    this.bots.forEach(bot => {
      if (bot.id === id) {
        this.afs.collection('bots').doc(id).update({ selected: !bot.selected });
      }
    });
  }

  updateBotStatus(event, id, status) {
    event.stopPropagation();
    this.afs.collection('bots').doc(id).update({ status });
  }

  onFilterChange(value) {
    if (!this.dataSource) {
      return;
    }
    value = value.trim();
    value = value.toLowerCase();
    this.dataSource.filter = value;
  }

  ngOnDestroy() {
  }
}
