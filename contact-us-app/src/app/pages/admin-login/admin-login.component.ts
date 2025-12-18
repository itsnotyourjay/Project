import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthStateService } from '../../services/auth-state.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  sessionExpiredMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authState: AuthStateService,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Check if user was redirected here due to session expiration
    this.route.queryParams.subscribe(params => {
      if (params['expired'] === 'true') {
        this.sessionExpiredMessage = 'Your admin session has expired. Please log in again.';
      }
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.post('http://localhost:3000/api/auth/admin/login', this.loginForm.value, { withCredentials: true })
      .subscribe({
        next: (response: any) => {
          this.authState.setAuthenticated(true);
          this.authState.setInitialized(true);
          this.authState.setIsAdmin(response?.user?.isAdmin || false);
          
          this.router.navigate(['/admin/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 401) {
            this.errorMessage = err.error?.message || 'Invalid credentials or access denied';
          } else {
            this.errorMessage = 'Login failed. Please try again.';
          }
        }
      });
  }
}
