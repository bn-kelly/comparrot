import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

import { Offer } from './../offer.model';

@Pipe({
  name: 'timeframeFilter',
})
export class TimeframeFilterPipe implements PipeTransform {
  transform(value: Offer[], timeFrame = 0): Offer[] {
    if (!timeFrame) {
      return value;
    }
    const dateFrom = moment().subtract(timeFrame, 'd').valueOf();
    return value.filter(offer => offer.created >= dateFrom);
  }
}
