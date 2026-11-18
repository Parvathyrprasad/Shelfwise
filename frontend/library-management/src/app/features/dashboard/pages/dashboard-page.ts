
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { DashboardService } from '../services/dashboard.service';
import { DashboardSummary } from '../../../shared/models/dashboard.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-intro">
      <p class="eyebrow">SHELFWISE OVERVIEW</p>
      <h1>Dashboard</h1>
      <p class="description">
        Here's what's happening in your library today.
      </p>
    </section>

    @if (loading()) {
      <p class="message">Loading dashboard...</p>
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else if (summary(); as data) {
      <section class="stats-grid">
        <article class="stat-card">
          <span class="stat-label">Total Books</span>
          <strong>{{ data.total_books }}</strong>
          <span class="stat-note">Book titles in catalog</span>
        </article>

        <article class="stat-card">
          <span class="stat-label">Total Copies</span>
          <strong>{{ data.total_copies }}</strong>
          <span class="stat-note">Across all collections</span>
        </article>

        <article class="stat-card">
          <span class="stat-label">Available Copies</span>
          <strong>{{ data.available_copies }}</strong>
          <span class="stat-note">Ready to be issued</span>
        </article>

        <article class="stat-card">
          <span class="stat-label">Total Members</span>
          <strong>{{ data.total_members }}</strong>
          <span class="stat-note">Registered members</span>
        </article>

        <article class="stat-card">
          <span class="stat-label">Active Loans</span>
          <strong>{{ data.active_loans }}</strong>
          <span class="stat-note">Books currently issued</span>
        </article>

        <article class="stat-card">
          <span class="stat-label">Overdue Loans</span>
          <strong>{{ data.overdue_loans }}</strong>
          <span class="stat-note">Past their due date</span>
        </article>
      </section>

      <section class="activity-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">LIBRARY OPERATIONS</p>
            <h2>Recent Activity</h2>
          </div>
          <span class="activity-count">
            {{ data.recent_activity.length }} activities
          </span>
        </div>

        @if (data.recent_activity.length > 0) {
          <div class="activity-list">
            @for (activity of data.recent_activity; track $index) {
              <article class="activity-item">
                <div class="activity-icon"
                     [class.returned]="activity.type === 'returned'">
                  {{ activity.type === 'returned' ? '↩' : '↗' }}
                </div>

                <div class="activity-details">
                  <strong>
                    {{ activity.type === 'returned' ? 'Book returned' : 'Book issued' }}
                  </strong>
                  <p>
                    {{ activity.book_title }} · {{ activity.member_name }}
                  </p>
                </div>

                <time>{{ activity.date }}</time>
              </article>
            }
          </div>
        } @else {
          <p class="empty-state">No recent activity yet.</p>
        }
      </section>
    }
  `,
  styles: [`
    :host {
      display: block;
      color: #172a36;
    }

    .page-intro {
      margin-bottom: 28px;
    }

    .eyebrow {
      color: #477c78;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 30px;
      font-weight: 650;
      letter-spacing: -1px;
    }

    .description {
      color: #777c7d;
      font-size: 14px;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: #fff;
      border: 1px solid #dedbd2;
      border-radius: 12px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-label {
      color: #777c7d;
      font-size: 13px;
    }

    .stat-card strong {
      font-size: 30px;
      font-weight: 650;
    }

    .stat-note {
      color: #929494;
      font-size: 11px;
    }

    .activity-panel {
      background: #fff;
      border: 1px solid #dedbd2;
      border-radius: 12px;
      padding: 24px;
    }

    .panel-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    h2 {
      font-size: 19px;
      margin: 0;
    }

    .activity-count {
      color: #777c7d;
      font-size: 12px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 15px 0;
      border-top: 1px solid #eeeae2;
    }

    .activity-icon {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #e9f1ef;
      color: #477c78;
      font-size: 19px;
    }

    .activity-icon.returned {
      background: #f8eee8;
      color: #c66b48;
    }

    .activity-details {
      flex: 1;
      min-width: 0;
    }

    .activity-details strong {
      font-size: 13px;
    }

    .activity-details p {
      color: #777c7d;
      font-size: 12px;
      margin: 5px 0 0;
    }

    time {
      color: #929494;
      font-size: 11px;
    }

    .message,
    .empty-state {
      color: #777c7d;
      padding: 20px 0;
    }

    .error {
      color: #b04435;
      background: #fff0ed;
      padding: 16px;
      border-radius: 8px;
    }

    @media (max-width: 850px) {
      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 520px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .activity-panel {
        padding: 16px;
      }
    }
  `]
})
export class DashboardPage implements OnInit {
  private dashboardService = inject(DashboardService);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.dashboardService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load dashboard. Please check the backend server.');
        this.loading.set(false);
      }
    });
  }
}
