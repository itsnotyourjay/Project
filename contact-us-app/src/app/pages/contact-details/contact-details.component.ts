import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactsService } from '../../../contacts/contacts.service';
import { Contact } from '../../../contacts/contact.entity';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contact-details',
  templateUrl: './contact-details.component.html',
  styleUrls: ['./contact-details.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ContactDetailsComponent implements OnInit {
  contactForm!: FormGroup;
  contactId!: number;
  loading = true;
  error: string | null = null;
  isEditing = false;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private contactsService: ContactsService,
    private authService: AuthService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      msg: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.contactId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadContact();
  }

  loadContact(): void {
    this.loading = true;
    this.error = null;
    
    this.contactsService.getContact(this.contactId).subscribe({
      next: (data: Contact) => {
        this.contactForm.patchValue({
          name: data.name,
          email: data.email,
          msg: data.msg
        });
        this.contactForm.disable(); // Start in view mode
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load contact details';
        this.loading = false;
        console.error('Error loading contact:', err);
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.contactForm.enable();
      this.successMessage = null;
    } else {
      this.contactForm.disable();
      this.loadContact(); // Reset form to original values
    }
  }

  onUpdate(): void {
    if (this.contactForm.invalid) {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = null;

    this.contactsService.updateContact(this.contactId, this.contactForm.value).subscribe({
      next: (response) => {
        this.successMessage = 'Contact updated successfully!';
        this.isEditing = false;
        this.contactForm.disable();
        this.loading = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err) => {
        this.error = 'Failed to update contact';
        this.loading = false;
        console.error('Error updating contact:', err);
      }
    });
  }

  onDelete(): void {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.contactsService.deleteContact(this.contactId).subscribe({
      next: () => {
        // Redirect to contact list after successful deletion
        this.router.navigate(['/contacts']);
      },
      error: (err) => {
        this.error = 'Failed to delete contact';
        this.loading = false;
        console.error('Error deleting contact:', err);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/contacts']);
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // Helper method for form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}