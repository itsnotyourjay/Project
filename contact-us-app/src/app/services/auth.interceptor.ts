import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Do not attach Authorization header. We rely on HttpOnly cookie (accessToken) to be sent by the browser.
    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(err);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const http = this.injector.get(HttpClient) as HttpClient;

    // Call refresh endpoint (cookie-based). If it succeeds, retry the original request once.
    return http.post<any>('/api/auth/refresh', {}, { withCredentials: true }).pipe(
      switchMap((res) => {
        // The refresh endpoint sets HttpOnly cookies (accessToken + refreshToken). Retry the original request — cookie will be sent automatically.
        return next.handle(req);
      }),
      catchError((e) => {
        // Refresh failed — clear stored token and let the error propagate so the app can redirect to login.
        // no local token to clear when using cookie-based auth
        return throwError(() => e);
      })
    );
  }
}
