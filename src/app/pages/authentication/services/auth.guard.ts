import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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
    const currentUser = this.auth.currentUser;

    return currentUser
      ? of(true)
      : this.auth.loadUserData().pipe(
          map((user) => !!user),
          tap((isLoggedIn) => {
            if (!isLoggedIn) {
              this.notify.update('You must be logged in!', 'error');
              this.router.navigate(['/login']);
            }
          })
        );
  }
}
