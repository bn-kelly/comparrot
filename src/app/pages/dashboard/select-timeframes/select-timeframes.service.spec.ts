import { TestBed } from '@angular/core/testing';

import { SelectTimeframesService } from './select-timeframes.service';

describe('SelectTimefraesService', () => {
  let service: SelectTimeframesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectTimeframesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
