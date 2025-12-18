import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Lead {
  id: number;
  name: string;
  email: string;
  msg: string;
  userId: number;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
}

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-leads.component.html',
  styleUrls: ['./admin-leads.component.css']
})
export class AdminLeadsComponent implements OnInit {
  leads: Lead[] = [];
  filteredLeads: Lead[] = [];
  users: User[] = [];
  loading = true;
  error: string | null = null;
  searchTerm = '';
  selectedUserId: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadLeads();
  }

  loadUsers() {
    this.http.get<User[]>('http://localhost:3000/api/admin/users', { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.users = data;
        },
        error: (err) => {
          console.error('Error loading users:', err);
        }
      });
  }

  loadLeads() {
    this.loading = true;
    this.error = null;

    this.http.get<Lead[]>('http://localhost:3000/api/admin/leads', { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.leads = data;
          this.filteredLeads = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load leads';
          this.loading = false;
          console.error('Error loading leads:', err);
        }
      });
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterByUser() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.leads];

    // Filter by selected user
    if (this.selectedUserId) {
      filtered = filtered.filter(lead => lead.userId === parseInt(this.selectedUserId));
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(search) ||
        lead.email.toLowerCase().includes(search) ||
        lead.msg.toLowerCase().includes(search) ||
        lead.id.toString().includes(search)
      );
    }

    this.filteredLeads = filtered;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedUserId = '';
    this.filteredLeads = this.leads;
  }

  getUserEmail(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.email : `User #${userId}`;
  }

  onLogout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/admin/login']);
    });
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }
}
