import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FirebaseService, leftJoin } from '@coturiv/firebase/app';
import { take } from 'rxjs/operators';

@Component({
  selector: 'fury-personalization',
  templateUrl: './personalization.component.html',
  styleUrls: ['./personalization.component.scss'],
})
export class PersonalizationComponent implements OnInit {
  @Input()
  userSizes: any[]; // user's sizes

  @Output()
  selectionChange = new EventEmitter();

  categories = [];
  types = [];
  sizes = [];

  private sizesMap = new Map();

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    const { categories, types } = await this.firebaseService.docAsPromise(
      `preference/size`,
    );
    this.categories = categories;
    this.types = types;

    this.sizes = await this.firebaseService
      .collectionWithCache(`product_size`)
      .pipe(leftJoin('speciesId', 'product_size_species', 'species'), take(1))
      .toPromise();

    this.userSizes?.forEach(size => {
      for (const sv of size.value) {
        const type = Object.keys(sv)[0];
        for (const vv of sv[type]) {
          this.selectSizeValue(size.id, type, vv);
        }
      }
    });
  }

  getSizesByCategory(category: string) {
    return this.sizes
      .filter(size => size.species.category === category)
      .sort((a, b) => a.species.order - b.species.order);
  }

  selectSizeValue(
    sid: string,
    type: string,
    value: string,
    emitChange = false,
  ) {
    const mid = sid + type + value;

    if (this.sizesMap.get(mid)) {
      this.sizesMap.delete(mid);
    } else {
      this.sizesMap.set(mid, true);
    }

    this.updateSelectionLabel(sid);

    if (emitChange) {
      const sizes = this.sizes
        .filter(size => !!size.selection)
        .map(size => {
          const selection = [];
          size.value.forEach((sv: any) => {
            const type = Object.keys(sv)[0];
            const values = sv[type].filter(
              v => !!this.sizesMap.get(`${size.id}${type}${v}`),
            );

            if (values.length) {
              const v = {};
              v[type] = values;
              selection.push(v);
            }
          });

          return {
            id: size.id,
            speciesId: size.speciesId,
            value: selection,
          };
        });

      this.selectionChange.emit(sizes);
    }
  }

  private updateSelectionLabel(sid: string) {
    const size = this.sizes.filter(size => size.id === sid)[0];
    const selection = [];

    size.value.forEach((sv: any) => {
      const type = Object.keys(sv)[0];
      const values = sv[type].filter(
        v => !!this.sizesMap.get(`${size.id}${type}${v}`),
      );
      if (values.length) {
        selection.push(`${this.types[type]}: ${values.join(', ')}`);
      }
    });
    size.selection = selection.join(' | ');
  }
}
