import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private router: Router,
    private authState: AuthStateService
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    // First check: Is the user authenticated at all?
    const isAuthenticated = this.authState.isAuthenticated();
    
    if (!isAuthenticated) {
      // Not logged in - redirect to admin login
      return of(this.router.createUrlTree(['/admin/login']));
    }
    
    // Second check: Is the authenticated user an admin?
    const isAdmin = this.authState.getIsAdmin();
    
    if (isAdmin) {
      // Both authenticated AND admin - allow access
      return of(true);
    }
    
    // Authenticated but not admin - redirect to admin login
    // (This handles case where regular user tries to access admin routes)
    return of(this.router.createUrlTree(['/admin/login']));
  }
}
