import { Pipe, PipeTransform } from '@angular/core';

const asc = 'asc';
const desc = 'desc';

@Pipe({
  name: 'orderBy',
  pure: true,
})
export class OrderByPipe implements PipeTransform {
  transform(array, orderBy, dir = asc) {
    if (!orderBy || !orderBy.trim() || ![asc, desc].includes(dir)) {
      return array;
    }

    if (dir === asc) {
      return [...array].sort((a: any, b: any) => {
        return this.orderByComparator(a[orderBy], b[orderBy]);
      });
    }
    if (dir === desc) {
      return [...array].sort((a: any, b: any) => {
        return this.orderByComparator(b[orderBy], a[orderBy]);
      });
    }
  }

  orderByComparator(a: any, b: any): number {
    if (
      isNaN(parseFloat(a)) ||
      !isFinite(a) ||
      isNaN(parseFloat(b)) ||
      !isFinite(b)
    ) {
      if (a.toLowerCase() < b.toLowerCase()) {
        return -1;
      }
      if (a.toLowerCase() > b.toLowerCase()) {
        return 1;
      }
    } else {
      if (parseFloat(a) < parseFloat(b)) {
        return -1;
      }
      if (parseFloat(a) > parseFloat(b)) {
        return 1;
      }
    }

    return 0;
  }
}
