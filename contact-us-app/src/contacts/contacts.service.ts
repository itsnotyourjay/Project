import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from './contact.entity';
import { CreateContactDto } from './create-contact.dto';

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private apiUrl = 'http://localhost:3000/api/leads'; // Use /api/leads for now

  constructor(private http: HttpClient) {}

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl);
  }

  getContact(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  createContact(contact: CreateContactDto): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact);
  }
}
