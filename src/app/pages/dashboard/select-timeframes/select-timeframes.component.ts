import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  OffersFilter,
  SelectTimeframesService,
  TimeFrame,
} from './select-timeframes.service';
import { AuthService } from '../../authentication/services/auth.service';

@Component({
  selector: 'fury-select-timeframes',
  templateUrl: './select-timeframes.component.html',
  styleUrls: ['./select-timeframes.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SelectTimeframesComponent implements OnInit {
  public selectedValues$: BehaviorSubject<number>;
  timeFrames: TimeFrame[];
  defaultSelected = 0;

  constructor(
    private sts: SelectTimeframesService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.auth.user.subscribe(user => {
      if (user) {
        this.sts.getOffersFilter().subscribe((response: OffersFilter) => {
          const { offerFilters } = response;
          this.timeFrames = offerFilters.timeFrames.sort(
            (a, b) => a.order - b.order,
          );
          const defaultSelectedUser = this.sts.getDefaultSelectedUser();

          this.defaultSelected =
            defaultSelectedUser > 0
              ? defaultSelectedUser
              : offerFilters.defaultSelectedValue;

          this.selectedValues$ = new BehaviorSubject(this.defaultSelected);
        });
      }
    });
  }

  onChange(selectedValue): void {
    this.selectedValues$.next(selectedValue);
    this.sts.saveDefaultSelectedToUser(selectedValue);
  }
}
