import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContactsService } from '../../../contacts/contacts.service';
import { Contact } from '../../../contacts/contact.entity';

@Component({
  selector : 'app-contact-details',
  templateUrl : './contact-details.component.html',
  styleUrls : ['./contact-details.component.css'],
  standalone: true
})
export class ContactDetailsComponent implements OnInit {
  contact?: Contact;

  constructor(
    private route: ActivatedRoute,
    private contactsService: ContactsService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.contactsService.getContact(id).subscribe((data: Contact) => {
      this.contact = data;
    });
  }
}