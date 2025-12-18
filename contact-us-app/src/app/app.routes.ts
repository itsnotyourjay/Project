import { Routes } from '@angular/router';
import { ContactFormComponent } from './pages/contact-form/contact-form.component';
import { ContactListComponent } from './pages/contact-list/contact-list.component';
import { ContactDetailsComponent } from './pages/contact-details/contact-details.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AdminLeadsComponent } from './pages/admin-leads/admin-leads.component';
import { AdminUserDetailsComponent } from './pages/admin-user-details/admin-user-details.component';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
  { path: 'contacts', component: ContactListComponent, canActivate: [AuthGuard] },
  { path: 'contacts/new', component: ContactFormComponent, canActivate: [AuthGuard] },
  { path: 'contacts/:id', component: ContactDetailsComponent, canActivate: [AuthGuard] },
  { path: 'admin/login', component: AdminLoginComponent, canActivate: [GuestGuard] },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [AdminGuard] },
  { path: 'admin/users/:id', component: AdminUserDetailsComponent, canActivate: [AdminGuard] },
  { path: 'admin/leads', component: AdminLeadsComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: 'login' }
];
