import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: any;
  error = '';
  sessionExpiredMessage = '';

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Check if user was redirected here due to session expiration
    this.route.queryParams.subscribe(params => {
      if (params['expired'] === 'true') {
        this.sessionExpiredMessage = 'Your session has expired. Please log in again.';
      }
    });
  }

  submit() {
    this.error = '';
    if (this.form.valid) {
      this.auth.login(this.form.value as any).subscribe({
        next: () => {
          // verify session via /auth/me then navigate
          this.auth.me().subscribe({ next: () => this.router.navigate(['/contacts/new']), error: () => this.error = 'Login succeeded but verification failed' });
        },
        error: (err: any) => {
          console.error('Login error', err);
          this.error = err?.error?.message || 'Login failed';
        }
      });
    }
  }
}
