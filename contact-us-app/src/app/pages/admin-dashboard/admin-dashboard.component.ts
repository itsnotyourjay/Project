import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  deletedUsers: number;
  totalLeads: number;
  adminUsers: number;
  regularUsers: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  totalUsers = 0;
  activeUsers = 0;
  deletedUsers = 0;
  totalLeads = 0;
  adminCount = 0;
  regularCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<Stats>(`${environment.apiUrl}/admin/stats`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this.totalUsers = data.totalUsers;
          this.activeUsers = data.activeUsers;
          this.deletedUsers = data.deletedUsers;
          this.totalLeads = data.totalLeads;
          this.adminCount = data.adminUsers;
          this.regularCount = data.regularUsers;
        },
        error: (err) => {
          console.error('Error loading stats:', err);
        }
      });
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/admin/login']);
      },
      error: () => {
        this.router.navigate(['/admin/login']);
      }
    });
  }
}
