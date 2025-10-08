import { Routes } from '@angular/router';
import { ContactFormComponent } from './pages/contact-form/contact-form.component';

export const routes: Routes = [
  { path: '', component: ContactFormComponent },      // the default route
  { path: 'contact', component: ContactFormComponent }
];
