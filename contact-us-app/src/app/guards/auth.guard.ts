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
    
    if (!isAuth) {
      // Not authenticated - redirect to login
      return of(this.router.createUrlTree(['/login']));
    }
    
    // Check if user is admin
    const isAdmin = this.authState.getIsAdmin();
    
    if (isAdmin) {
      // Admin users should not access regular user routes
      // Redirect them to admin dashboard
      return of(this.router.createUrlTree(['/admin/dashboard']));
    }
    
    // Regular user - allow access
    return of(true);
  }
}
