import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nameInitials',
})
export class NameInitialsPipe implements PipeTransform {
  transform(displayName: string): string {
    if (displayName?.trim() === '') {
      return;
    }

    const [firstName, lastName] = displayName.split(' ');
    const ni =
      firstName && lastName
        ? firstName.charAt(0) + lastName.charAt(0)
        : (firstName || lastName).slice(0, 2);
    return ni.toUpperCase();
  }
}
