import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FirebaseService } from '@coturiv/firebase/app';
import { QueryBuilder } from '@coturiv/firebase';
import { FAQ } from 'src/app/models/faq.model';

@Component({
  selector: 'fury-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {
  faqList: Observable<FAQ[]>;
  panelOpenState = false;

  constructor(private firebaseServie: FirebaseService) { }

  ngOnInit() {
    const qb = new QueryBuilder();
    qb.orderBy(['order', 'asc']);

    this.faqList = this.firebaseServie.collectionWithCache('company/default/faq', qb);
  }

}
