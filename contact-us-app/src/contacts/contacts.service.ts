import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from './contact.entity';
import { CreateContactDto } from './create-contact.dto';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private apiUrl = `${environment.apiUrl}/leads`;

  constructor(private http: HttpClient) {}

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.apiUrl, { withCredentials: true });
  }

  getContact(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  createContact(contact: CreateContactDto): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact, { withCredentials: true });
  }

  updateContact(id: number, contact: Partial<CreateContactDto>): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, contact, { withCredentials: true });
  }

  deleteContact(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }
}
