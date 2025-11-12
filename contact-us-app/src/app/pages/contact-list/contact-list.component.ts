import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ContactsService } from '../../../contacts/contacts.service';
import { Contact } from '../../../contacts/contact.entity';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.css'
})
export class ContactListComponent implements OnInit {
  contacts: Contact[] = [];
  loading = true;
  error = '';

  constructor(
    private contactsService: ContactsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.loading = true;
    this.error = '';
    this.contactsService.getContacts().subscribe({
      next: (data) => {
        this.contacts = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading contacts:', err);
        this.error = 'Failed to load contacts. Please try again.';
        this.loading = false;
      }
    });
  }

  viewContact(id: number) {
    this.router.navigate(['/contacts', id]);
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}

