import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private _authenticated = new BehaviorSubject<boolean>(false);
  public authenticated$ = this._authenticated.asObservable();

  // Track whether the initial session check (app initializer) has completed.
  private _initialized = new BehaviorSubject<boolean>(false);
  public initialized$ = this._initialized.asObservable();

  setAuthenticated(value: boolean) {
    this._authenticated.next(value);
  }

  isAuthenticated() {
    return this._authenticated.getValue();
  }

  setInitialized(value: boolean) {
    this._initialized.next(value);
  }

  isInitialized() {
    return this._initialized.getValue();
  }
}
