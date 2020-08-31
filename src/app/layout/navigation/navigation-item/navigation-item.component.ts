import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SidenavItem } from '../../sidenav/sidenav-item/sidenav-item.interface';

@Component({
  selector: 'fury-navigation-item',
  templateUrl: './navigation-item.component.html',
  styleUrls: ['./navigation-item.component.scss'],
})
export class NavigationItemComponent {
  @Input('item') item: SidenavItem;
  @Input('currentlyOpen') currentlyOpen: SidenavItem[] = [];

  @Output() handleClick = new EventEmitter<SidenavItem>();
}
