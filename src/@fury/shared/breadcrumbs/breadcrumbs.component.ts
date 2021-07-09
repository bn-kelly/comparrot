import { Component, Input } from '@angular/core';

@Component({
  selector: 'fury-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
})
export class BreadcrumbsComponent {
  @Input() current: string;
  @Input() crumbs: any[] = [];
}
