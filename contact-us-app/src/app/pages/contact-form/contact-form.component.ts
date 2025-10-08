import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../../contacts/contacts.service';
import { Contact } from '../../../contacts/contact.entity';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.css'
})
export class ContactFormComponent {
  contactForm: FormGroup;
  submitted = false;
  successMessage = '';

  constructor(private fb: FormBuilder, private contactsService: ContactsService) {
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
          this.successMessage = 'Thank you! Your message has been sent!';
          this.contactForm.reset();
          this.submitted = false;
        },
        error: (err: any) => {
          console.error('Error submitting contact:', err);
        }
      });
    }
  }
}
