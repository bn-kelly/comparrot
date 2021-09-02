import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FirebaseService } from '@coturiv/firebase/app';

@Component({
  selector: 'fury-interests',
  templateUrl: './interests.component.html',
  styleUrls: ['./interests.component.scss'],
})
export class InterestsComponent implements OnInit {
  @Input()
  userInterests: string[];

  @Output()
  selectionChange = new EventEmitter();

  interests: any[];

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    this.interests = (
      await this.firebaseService.collectionAsPromise('product_category')
    ).map(i => {
      i.selected = this.userInterests.includes(i.id);
      return i;
    });
  }

  selectInterest(intrst: any, emitChange = false) {
    intrst.selected = !intrst.selected;

    if (emitChange) {
      const interests = this.interests.filter(i => i.selected).map(i => i.id);
      this.selectionChange.emit(interests);
    }
  }
}
