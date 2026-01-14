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
  user?: {
    id: number;
    email: string;
    deleted_at?: string | null;
  };
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
  
  // Reassignment modal state
  showReassignModal = false;
  reassignLeadId: number | null = null;
  reassignToUserId: number | null = null;
  reassignLeadInfo: { name: string; email: string; currentUser: string } | null = null;
  reassigning = false;

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

  isOrphanedLead(lead: Lead): boolean {
    return lead.user?.deleted_at != null;
  }

  openReassignModal(lead: Lead) {
    this.reassignLeadId = lead.id;
    this.reassignToUserId = null;
    this.reassignLeadInfo = {
      name: lead.name,
      email: lead.email,
      currentUser: this.getUserEmail(lead.userId)
    };
    this.showReassignModal = true;
  }

  closeReassignModal() {
    this.showReassignModal = false;
    this.reassignLeadId = null;
    this.reassignToUserId = null;
    this.reassignLeadInfo = null;
  }

  confirmReassign() {
    if (!this.reassignLeadId || !this.reassignToUserId) {
      alert('Please select a user to reassign this lead to.');
      return;
    }

    this.reassigning = true;

    this.http.post('http://localhost:3000/api/admin/leads/reassign-single', {
      leadId: this.reassignLeadId,
      toUserId: this.reassignToUserId
    }, { withCredentials: true })
      .subscribe({
        next: (result: any) => {
          alert(`Successfully reassigned lead to ${this.getUserEmail(this.reassignToUserId!)}`);
          this.closeReassignModal();
          this.loadLeads(); // Reload to reflect changes
          this.reassigning = false;
        },
        error: (err) => {
          console.error('Error reassigning lead:', err);
          alert('Failed to reassign lead. Please try again.');
          this.reassigning = false;
        }
      });
  }

  assignOrphanedLeads() {
    // Find first admin user to assign orphaned leads to
    const adminUser = this.users.find(u => u.id === 19); // Your main admin
    
    if (!adminUser) {
      alert('No admin user found to assign orphaned leads.');
      return;
    }

    if (!confirm(`Assign all orphaned leads to ${adminUser.email}?`)) {
      return;
    }

    this.http.post('http://localhost:3000/api/admin/leads/assign-orphaned', {
      defaultAdminId: adminUser.id
    }, { withCredentials: true })
      .subscribe({
        next: (result: any) => {
          alert(`Successfully assigned ${result.count} orphaned lead(s) to ${adminUser.email}`);
          this.loadLeads();
        },
        error: (err) => {
          console.error('Error assigning orphaned leads:', err);
          alert('Failed to assign orphaned leads.');
        }
      });
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
