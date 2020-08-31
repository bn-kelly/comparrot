import { TestBed, inject } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { noop } from 'rxjs';

xdescribe('AuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
  });

  it('should be created', inject([AuthService], noop));
});
