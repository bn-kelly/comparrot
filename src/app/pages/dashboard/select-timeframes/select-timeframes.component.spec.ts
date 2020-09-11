import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectTimeframesComponent } from './select-timeframes.component';

describe('SelectTimeframesComponent', () => {
  let component: SelectTimeframesComponent;
  let fixture: ComponentFixture<SelectTimeframesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectTimeframesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectTimeframesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
