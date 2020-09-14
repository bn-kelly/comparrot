import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  SelectTimeframesService,
  TimeFrame,
} from './select-timeframes.service';

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

  constructor(private sts: SelectTimeframesService) {}

  ngOnInit(): void {
    this.sts.getOffersFilter().subscribe(offersFilter => {
      this.timeFrames = offersFilter.timeFrames.sort(
        (a, b) => a.order - b.order,
      );
      const defaultSelectedUser = this.sts.getDefaultSelectedUser();

      this.defaultSelected =
        defaultSelectedUser > 0
          ? defaultSelectedUser
          : offersFilter.defaultSelectedValue;

      this.selectedValues$ = new BehaviorSubject(this.defaultSelected);
    });
  }

  onChange(selectedValue): void {
    this.selectedValues$.next(selectedValue);
    this.sts.saveDefaultSelectedToUser(selectedValue);
  }
}
