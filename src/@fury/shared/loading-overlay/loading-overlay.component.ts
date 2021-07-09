import { Component, Input } from '@angular/core';

@Component({
  selector: 'fury-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
})
export class LoadingOverlayComponent {
  @Input('isLoading') isLoading: boolean;
}
