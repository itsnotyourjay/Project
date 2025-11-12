import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: any;
  error = '';
  registrationSuccess = false;
  registeredEmail = '';
  // modal control flags
  showConfirmLoginModal = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit() {
    this.error = '';
    if (this.form.valid) {
      this.auth.register(this.form.value as any).subscribe({
        next: (res: any) => {
          this.registrationSuccess = true;
          this.registeredEmail = this.form.value.email;
          this.form.reset();
          // show confirmation modal shortly after displaying inline message
          setTimeout(() => {
            this.showConfirmLoginModal = true;
          }, 700);
        },
        error: (err: any) => (this.error = err?.error?.message || 'Registration failed')
      });
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  continueToContacts() {
    this.router.navigate(['/contacts']);
  }
}
