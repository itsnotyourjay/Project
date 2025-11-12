import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ContactsService } from '../../../contacts/contacts.service';
import { Contact } from '../../../contacts/contact.entity';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.css']
})
export class ContactFormComponent {
  contactForm: FormGroup;
  submitted = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private contactsService: ContactsService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      msg: ['', Validators.required]
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.contactForm.valid) {
      this.contactsService.createContact(this.contactForm.value).subscribe({
        next: () => {
          this.successMessage = 'Your message has been sent successfully!';
          this.contactForm.reset();
          this.submitted = false;
          
          // Redirect to contact list after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/contacts']);
          }, 2000); 
        },
        error: (err: any) => {
          console.error('Error submitting contact:', err);
          this.successMessage = '';
          alert('Failed to submit. Please try again.');
        }
      });
    }
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // navigate to login even if backend call fails
        this.router.navigate(['/login']);
      }
    });
  }
}

