import { Component, Input } from '@angular/core';

@Component({
  selector: 'fury-quick-info-widget',
  templateUrl: './quick-info-widget.component.html',
  styleUrls: ['./quick-info-widget.component.scss'],
})
export class QuickInfoWidgetComponent {
  @Input() value: string;
  @Input() label: string;
  @Input() background: string;
  @Input() color: string;

  @Input() icon: string;
}
