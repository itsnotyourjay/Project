import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Do not attach Authorization header. We rely on HttpOnly cookie (accessToken) to be sent by the browser.
    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          // Skip refresh logic for login/register endpoints
          // These endpoints are supposed to return 401 for invalid credentials
          const isAuthEndpoint = req.url.includes('/api/auth/login') || 
                                 req.url.includes('/api/auth/register') || 
                                 req.url.includes('/api/auth/admin/login');
          
          if (isAuthEndpoint) {
            // Don't try to refresh on login/register failures - just pass the error through
            return throwError(() => err);
          }
          
          // For all other 401s, try to refresh the token
          return this.handle401Error(req, next);
        }
        return throwError(err);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return throwError(() => new Error('Token refresh already in progress'));
    }

    this.isRefreshing = true;
    const http = this.injector.get(HttpClient) as HttpClient;

    // Call refresh endpoint (cookie-based). If it succeeds, retry the original request once.
    return http.post<any>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true }).pipe(
      switchMap((res) => {
        this.isRefreshing = false;
        // The refresh endpoint sets HttpOnly cookies (accessToken + refreshToken). Retry the original request — cookie will be sent automatically.
        return next.handle(req);
      }),
      catchError((refreshError) => {
        this.isRefreshing = false;
        
        // Refresh failed — both tokens are expired or invalid
        // Clear auth state and redirect to appropriate login page
        const authState = this.injector.get(AuthStateService);
        const router = this.injector.get(Router);
        
        console.warn('Session expired. Redirecting to login...');
        
        // Determine if user was an admin
        const wasAdmin = authState.getIsAdmin();
        
        // Clear authentication state
        authState.setAuthenticated(false);
        authState.setIsAdmin(false);
        sessionStorage.removeItem('isAdmin');
        
        // Redirect to appropriate login page based on user type
        const loginRoute = wasAdmin ? '/admin/login' : '/login';
        router.navigate([loginRoute], { 
          queryParams: { expired: 'true' },
          replaceUrl: true 
        });
        
        return throwError(() => refreshError);
      })
    );
  }
}
