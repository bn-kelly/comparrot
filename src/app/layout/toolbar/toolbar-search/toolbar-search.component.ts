import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'fury-toolbar-search',
  templateUrl: './toolbar-search.component.html',
  styleUrls: ['./toolbar-search.component.scss'],
})
export class ToolbarSearchComponent {
  isOpen: boolean;

  @ViewChild('input', { read: ElementRef, static: true }) input: ElementRef;

  open() {
    this.isOpen = true;

    setTimeout(() => {
      this.input.nativeElement.focus();
    }, 100);
  }

  close() {
    this.isOpen = false;
  }
}
