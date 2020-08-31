import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { NotifyService } from './notify.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private notify: NotifyService,
  ) {}
  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.auth.user.pipe(
      take(1),
      map(user => !!user && !user.isAnonymous),
      tap(loggedIn => {
        if (!loggedIn) {
          // access denied
          this.notify.update('You must be logged in!', 'error');
          this.router.navigate(['/login']);
        } else {
          // access granted for logged in user
        }
      }),
    );
  }
}
