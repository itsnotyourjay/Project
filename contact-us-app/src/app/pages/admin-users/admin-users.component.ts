import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
  registeredAt: string;
  lastLoginAt?: string;
  registeredIp?: string;
  lastLoginIp?: string;
  deleted_at?: string | null;  // Added for soft delete
  deleted_by?: number | null;
  deletion_reason?: string | null;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  error: string | null = null;
  searchTerm = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;

    this.http.get<User[]>(`${environment.apiUrl}/admin/users`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.users = data;
          this.filteredUsers = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load users';
          this.loading = false;
          console.error('Error loading users:', err);
        }
      });
  }

  onSearch() {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = this.users;
      return;
    }

    const search = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.email.toLowerCase().includes(search) ||
      user.id.toString().includes(search)
    );
  }

  filterByType(type: 'all' | 'admin' | 'regular' | 'deleted' | 'active') {
    if (type === 'all') {
      this.filteredUsers = this.users;
    } else if (type === 'admin') {
      this.filteredUsers = this.users.filter(u => u.isAdmin && !u.deleted_at);
    } else if (type === 'regular') {
      this.filteredUsers = this.users.filter(u => !u.isAdmin && !u.deleted_at);
    } else if (type === 'deleted') {
      this.filteredUsers = this.users.filter(u => u.deleted_at);
    } else if (type === 'active') {
      this.filteredUsers = this.users.filter(u => !u.deleted_at);
    }
  }

  isDeleted(user: User): boolean {
    return !!user.deleted_at;
  }

  getUserStatus(user: User): string {
    if (user.deleted_at) {
      return 'Deleted';
    }
    return user.isAdmin ? 'Admin' : 'User';
  }

  getUserStatusClass(user: User): string {
    if (user.deleted_at) {
      return 'status-deleted';
    }
    return user.isAdmin ? 'status-admin' : 'status-user';
  }

  onLogout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/admin/login']);
    });
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }

  navigateToUser(userId: number) {
    this.router.navigate(['/admin/users', userId]);
  }
}
