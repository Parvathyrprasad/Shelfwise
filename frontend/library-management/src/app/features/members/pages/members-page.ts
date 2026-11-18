
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Member } from '../../../shared/models/member.model';
import { MemberService } from '../services/member.service';

@Component({
  selector: 'app-members-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-intro">
      <p class="eyebrow">MEMBER MANAGEMENT</p>
      <h1>Members</h1>
      <p class="description">Manage your registered library members.</p>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>{{ editingId ? 'Edit Member' : 'Register New Member' }}</h2>
        <button class="secondary" type="button" (click)="resetForm()">
          Clear Form
        </button>
      </div>

      <form (ngSubmit)="saveMember()">
        <div class="form-grid">
          <label>
            Member Code
            <input name="member_code" [(ngModel)]="form.member_code" required />
          </label>

          <label>
            Full Name
            <input name="name" [(ngModel)]="form.name" required />
          </label>

          <label>
            Email
            <input name="email" type="email"
              [(ngModel)]="form.email" required />
          </label>

          <label>
            Phone
            <input name="phone" [(ngModel)]="form.phone" />
          </label>

          <label>
            Membership Status
            <select name="membership_status"
              [(ngModel)]="form.membership_status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
        </div>

        <button class="primary" type="submit" [disabled]="saving()">
          {{ saving() ? 'Saving...' : editingId ? 'Update Member' : 'Register Member' }}
        </button>
      </form>

      @if (message()) {
        <p class="success">{{ message() }}</p>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>Registered Members</h2>
        <span class="count">{{ members().length }} members</span>
      </div>

      @if (loading()) {
        <p>Loading members...</p>
      } @else if (members().length === 0) {
        <p class="empty">No members registered yet.</p>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Member Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (member of members(); track member.id) {
                <tr>
                  <td>{{ member.member_code }}</td>
                  <td>{{ member.name }}</td>
                  <td>{{ member.email }}</td>
                  <td>{{ member.phone || '—' }}</td>
                  <td>
                    <span class="status" [class.inactive]="member.membership_status !== 'active'">
                      {{ member.membership_status }}
                    </span>
                  </td>
                  <td class="actions">
                <button class="secondary" type="button"
             (click)="viewMember(member)">View</button>
             <button class="secondary" type="button"
                (click)="editMember(member)">Edit</button>
               <button class="danger" type="button"
              (click)="deleteMember(member.id)">Delete</button>
            </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; color: #172a36; }
    .page-intro { margin-bottom: 26px; }
    .eyebrow {
      color: #477c78; font-size: 10px; font-weight: 700;
      letter-spacing: 1.5px; margin-bottom: 10px;
    }
    h1 { font-size: 30px; margin: 0 0 8px; }
    .description { color: #777c7d; font-size: 14px; }
    .panel {
      background: #fff; border: 1px solid #dedbd2;
      border-radius: 12px; padding: 24px; margin-bottom: 22px;
    }
    .panel-heading {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 20px;
    }
    h2 { font-size: 18px; margin: 0; }
    .form-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px; margin-bottom: 20px;
    }
    label {
      display: flex; flex-direction: column; gap: 7px;
      font-size: 12px; font-weight: 600;
    }
    input, select {
      padding: 11px 12px; border: 1px solid #dedbd2;
      border-radius: 7px; font: inherit; font-weight: 400;
      min-width: 0; background: white;
    }
    input:focus, select:focus {
      outline: 2px solid #477c78; border-color: transparent;
    }
    button {
      border: 0; border-radius: 7px; padding: 9px 13px;
      cursor: pointer; font-size: 12px; font-weight: 600;
    }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .primary { background: #477c78; color: white; }
    .secondary { background: #edf1ef; color: #315e5a; }
    .danger { background: #f8eae6; color: #a94f3b; }
    .count { color: #777c7d; font-size: 12px; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td {
      padding: 13px 10px; text-align: left;
      border-bottom: 1px solid #eeeae2; white-space: nowrap;
    }
    th { color: #777c7d; font-weight: 600; }
    .actions { display: flex; gap: 7px; }
    .status {
      display: inline-block; padding: 5px 9px; border-radius: 20px;
      background: #e9f1ed; color: #32745d; font-size: 11px;
    }
    .status.inactive { background: #f5eee6; color: #986b3c; }
    .success { color: #32745d; font-size: 13px; }
    .error { color: #b04435; font-size: 13px; }
    .empty { color: #777c7d; font-size: 13px; }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .panel { padding: 16px; }
    }
  `]
})
export class MembersPage implements OnInit {
  private memberService = inject(MemberService);
  private router = inject(Router);

  members = signal<Member[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  message = signal('');

  editingId: number | null = null;

  form: {
  member_code: string;
  name: string;
  email: string;
  phone: string;
  membership_status: 'active' | 'inactive' | 'suspended';
} = {
  member_code: '',
  name: '',
  email: '',
  phone: '',
  membership_status: 'active'
};

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading.set(true);

    this.memberService.getMembers().subscribe({
      next: data => {
        this.members.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load members. Check the backend server.');
        this.loading.set(false);
      }
    });
  }

  saveMember(): void {
    this.error.set('');
    this.message.set('');
    this.saving.set(true);

    const request = this.editingId
      ? this.memberService.updateMember(this.editingId, this.form)
      : this.memberService.createMember(this.form);

    request.subscribe({
      next: () => {
        this.message.set(
          this.editingId ? 'Member updated successfully.' : 'Member registered successfully.'
        );
        this.resetForm();
        this.saving.set(false);
        this.loadMembers();
      },
      error: err => {
        this.error.set(err.error?.error || 'Unable to save member. Check the details.');
        this.saving.set(false);
      }
    });
  }

  viewMember(member: Member): void {
  this.router.navigate(['/members', member.id]);
}

  editMember(member: Member): void {
    this.editingId = member.id;
    this.form = {
      member_code: member.member_code,
      name: member.name,
      email: member.email,
      phone: member.phone,
      membership_status: member.membership_status
    };
    this.message.set('');
    this.error.set('');
  }

  deleteMember(id: number): void {
    if (!confirm('Are you sure you want to delete this member?')) return;

    this.error.set('');
    this.message.set('');

    this.memberService.deleteMember(id).subscribe({
      next: () => {
        this.message.set('Member deleted successfully.');
        this.loadMembers();
      },
      error: err => {
        this.error.set(err.error?.error || 'Unable to delete this member.');
      }
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = {
      member_code: '',
      name: '',
      email: '',
      phone: '',
      membership_status: 'active'
    };
  }
}
