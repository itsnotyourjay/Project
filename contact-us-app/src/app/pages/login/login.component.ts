import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form: any;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
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
