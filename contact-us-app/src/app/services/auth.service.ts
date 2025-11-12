import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthStateService } from './auth-state.service';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private authState: AuthStateService) {}

  register(payload: { email: string; password: string }): Observable<any> {
    // Server sets HttpOnly cookies (accessToken + refreshToken). No tokens stored in localStorage.
    return this.http.post(`${API}/auth/register`, payload, { withCredentials: true }).pipe(
      tap(() => {
        this.authState.setAuthenticated(true);
        this.authState.setInitialized(true);
      })
    );
  }

  login(payload: { email: string; password: string }): Observable<any> {
    // Server sets HttpOnly cookies (accessToken + refreshToken). No tokens stored in localStorage.
    return this.http.post(`${API}/auth/login`, payload, { withCredentials: true }).pipe(
      tap(() => {
        this.authState.setAuthenticated(true);
        this.authState.setInitialized(true);
      })
    );
  }

  logout() {
    // call backend to revoke refresh token (cookie-based) and then clear client token
    return this.http.post(`${API}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        // update local auth state
        this.authState.setAuthenticated(false);
      })
    );
  }

  getToken() {
    // kept for backward compatibility but cookies are used; return null to discourage usage
    return null;
  }

  me() {
    return this.http.post(`${API}/auth/me`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.authState.setAuthenticated(true);
        this.authState.setInitialized(true);
      })
    );
  }
}
