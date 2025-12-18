import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
  registeredAt: string;
  lastLoginAt: string | null;
  registeredIp: string | null;
  lastLoginIp: string | null;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  msg: string;
  createdAt: string;
}

interface UserDetailsResponse {
  user: User;
  leads: Lead[];
  leadsCount: number;
}

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-user-details.component.html',
  styleUrls: ['./admin-user-details.component.css']
})
export class AdminUserDetailsComponent implements OnInit {
  userId: number = 0;
  user: User | null = null;
  leads: Lead[] = [];
  leadsCount: number = 0;
  loading = true;
  error: string | null = null;
  
  // Edit mode
  isEditing = false;
  editedIsAdmin = false;
  


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = parseInt(params['id']);
      this.loadUserDetails();
    });
  }

  loadUserDetails() {
    this.loading = true;
    this.error = null;

    this.http.get<UserDetailsResponse>(`http://localhost:3000/api/admin/users/${this.userId}`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.user = data.user;
          this.leads = data.leads;
          this.leadsCount = data.leadsCount;
          this.editedIsAdmin = data.user.isAdmin;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load user details';
          this.loading = false;
          console.error('Error loading user:', err);
        }
      });
  }

  startEdit() {
    this.isEditing = true;
    this.editedIsAdmin = this.user?.isAdmin || false;
  }

  cancelEdit() {
    this.isEditing = false;
    this.editedIsAdmin = this.user?.isAdmin || false;
  }

  saveChanges() {
    if (!this.user) return;

    this.http.patch(`http://localhost:3000/api/admin/users/${this.userId}`, 
      { isAdmin: this.editedIsAdmin },
      { withCredentials: true }
    ).subscribe({
      next: (response: any) => {
        this.user = response.user;
        this.isEditing = false;
        alert('User updated successfully!');
      },
      error: (err) => {
        console.error('Error updating user:', err);
        alert('Failed to update user');
      }
    });
  }

  deleteUser() {
    if (!this.user) return;

    const firstConfirm = confirm(
      `Are you sure you want to delete ${this.user.email}?\n\n` +
      `This will also delete ${this.leadsCount} lead(s) associated with this user.\n\n` +
      `This action cannot be undone.`
    );

    if (!firstConfirm) return;

    const secondConfirm = confirm(
      `FINAL CONFIRMATION:\n\n` +
      `You are about to permanently delete:\n` +
      `- User: ${this.user.email}\n` +
      `- ${this.leadsCount} associated lead(s)\n\n` +
      `Are you absolutely sure?`
    );

    if (!secondConfirm) return;

    this.http.delete(`http://localhost:3000/api/admin/users/${this.userId}`, { withCredentials: true })
      .subscribe({
        next: (response: any) => {
          alert(`User deleted successfully. ${response.deletedLeadsCount} leads were also removed.`);
          this.router.navigate(['/admin/users']);
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          alert('Failed to delete user');
        }
      });
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
