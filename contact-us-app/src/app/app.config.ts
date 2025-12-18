import { ApplicationConfig, provideZoneChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withFetch, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AuthStateService } from './services/auth-state.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    // Register HTTP interceptor directly so it will be available when using provideHttpClient
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    } as any,
    // On app bootstrap, verify session via /api/auth/me and populate in-memory auth state.
    // This BLOCKS the app initialization until the auth check completes (or times out).
    provideAppInitializer(() => {
      const http = inject(HttpClient);
      const authState = inject(AuthStateService);
      
      // Return a Promise that blocks app initialization
      return new Promise<void>((resolve) => {
        http.post<any>('http://localhost:3000/api/auth/me', {}, { withCredentials: true })
          .pipe(
            timeout(5000),
            catchError(() => of(null))
          )
          .subscribe({
            next: (result) => {
              if (result && result.user) {
                authState.setAuthenticated(true);
                authState.setIsAdmin(result.user.isAdmin || false); // ← Access user.isAdmin
                authState.setInitialized(true);
              } else {
                authState.setAuthenticated(false);
                authState.setIsAdmin(false);
                authState.setInitialized(true);
              }
              resolve();
            },
            error: () => {
              authState.setAuthenticated(false);
              authState.setIsAdmin(false);
              authState.setInitialized(true);
              resolve();
            }
          });
      });
    }),
  ]
};
