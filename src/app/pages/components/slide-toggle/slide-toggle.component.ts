import { Component } from '@angular/core';
import escape from 'lodash-es/escape';

@Component({
  selector: 'fury-slide-toggle',
  templateUrl: './slide-toggle.component.html',
  styleUrls: ['./slide-toggle.component.scss'],
})
export class SlideToggleComponent {
  slideToggleHTML = escape(`<mat-slide-toggle [checked]="true"></mat-slide-toggle>
<mat-slide-toggle color="primary" [checked]="true"></mat-slide-toggle>
<mat-slide-toggle color="accent" [checked]="true"></mat-slide-toggle>
<mat-slide-toggle color="warn" [checked]="true"></mat-slide-toggle>
<mat-slide-toggle disabled></mat-slide-toggle>`);
}
