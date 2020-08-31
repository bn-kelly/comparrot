import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { NotifyService } from './notify.service';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { noop } from 'rxjs';

xdescribe('AuthGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, AngularFireAuthModule],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: { afAuth: {} } },
        { provide: NotifyService, useValue: {} },
      ],
    });
  });

  it('should ...', inject([AuthGuard], noop));
});
