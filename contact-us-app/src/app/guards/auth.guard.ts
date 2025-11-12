import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { timeout } from 'rxjs/operators';
import { AuthStateService } from '../services/auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private http: HttpClient, private router: Router, private authState: AuthStateService) {}

  canActivate(): Observable<boolean | UrlTree> {
    // APP_INITIALIZER has already run, so we can synchronously check the auth state
    const isAuth = this.authState.isAuthenticated();
    
    if (isAuth) {
      return of(true);
    }
    
    // Not authenticated - redirect to login
    return of(this.router.createUrlTree(['/login']));
  }
}
