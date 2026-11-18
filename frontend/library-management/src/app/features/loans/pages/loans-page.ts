
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Loan } from '../../../shared/models/loan.model';
import { Book } from '../../../shared/models/book.model';
import { Member } from '../../../shared/models/member.model';
import { LoanService } from '../services/loan.service';
import { BookService } from '../../books/services/book.service';
import { MemberService } from '../../members/services/member.service';

@Component({
  selector: 'app-loans-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-intro">
      <p class="eyebrow">CIRCULATION MANAGEMENT</p>
      <h1>Loans</h1>
      <p class="description">Track book issues, returns and overdue loans.</p>
    </section>

    <section class="panel">
      <h2>Issue a Book</h2>

      <form (ngSubmit)="issueBook()">
        <div class="form-grid">
          <label>
            Select Book
            <select name="bookId" [(ngModel)]="form.bookId" required>
              <option [ngValue]="0" disabled>Select a book</option>
              @for (book of books(); track book.id) {
                <option [ngValue]="book.id" [disabled]="book.available_copies < 1">
                  {{ book.title }} ({{ book.available_copies }} available)
                </option>
              }
            </select>
          </label>

          <label>
            Select Member
            <select name="memberId" [(ngModel)]="form.memberId" required>
              <option [ngValue]="0" disabled>Select a member</option>
              @for (member of members(); track member.id) {
                <option [ngValue]="member.id"
                  [disabled]="member.membership_status !== 'active'">
                  {{ member.name }} ({{ member.member_code }})
                </option>
              }
            </select>
          </label>

          <label>
            Due Date
            <input name="dueDate" type="date"
              [(ngModel)]="form.dueDate" [min]="today" required />
          </label>
        </div>

        <button class="primary" type="submit" [disabled]="saving()">
          {{ saving() ? 'Processing...' : 'Issue Book' }}
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
        <h2>Loan Records</h2>
        <span class="count">{{ loans().length }} records</span>
      </div>

      @if (loading()) {
        <p>Loading loan records...</p>
      } @else if (loans().length === 0) {
        <p class="empty">No loan records found.</p>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Book</th>
                <th>Member</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (loan of loans(); track loan.id) {
                <tr>
                  <td>#{{ loan.id }}</td>
                  <td>{{ getBookTitle(loan.book_id) }}</td>
                  <td>{{ getMemberName(loan.member_id) }}</td>
                  <td>{{ loan.issue_date | date:'mediumDate' }}</td>
                  <td>{{ loan.due_date | date:'mediumDate' }}</td>
                  <td>
                    <span class="status" [class.returned]="loan.status === 'returned'">
                      {{ loan.status }}
                    </span>
                  </td>
                  <td>
                    @if (loan.status === 'active') {
                      <button class="secondary" type="button"
                        (click)="returnBook(loan.id)">
                        Return
                      </button>
                    } @else {
                      <span class="muted">Completed</span>
                    }
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
    h2 { font-size: 18px; margin: 0 0 20px; }
    .description { color: #777c7d; font-size: 14px; }
    .panel {
      background: #fff; border: 1px solid #dedbd2;
      border-radius: 12px; padding: 24px; margin-bottom: 22px;
    }
    .panel-heading {
      display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 20px;
    }
    .panel-heading h2 { margin: 0; }
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
      border-radius: 7px; font: inherit; background: white;
      min-width: 0;
    }
    button {
      border: 0; border-radius: 7px; padding: 9px 13px;
      cursor: pointer; font-size: 12px; font-weight: 600;
    }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .primary { background: #477c78; color: white; }
    .secondary { background: #edf1ef; color: #315e5a; }
    .count { color: #777c7d; font-size: 12px; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td {
      padding: 13px 10px; text-align: left;
      border-bottom: 1px solid #eeeae2; white-space: nowrap;
    }
    th { color: #777c7d; font-weight: 600; }
    .status {
      display: inline-block; padding: 5px 9px; border-radius: 20px;
      background: #f5eee6; color: #986b3c; font-size: 11px;
    }
    .status.returned { background: #e9f1ed; color: #32745d; }
    .success { color: #32745d; font-size: 13px; }
    .error { color: #b04435; font-size: 13px; }
    .empty, .muted { color: #777c7d; font-size: 12px; }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .panel { padding: 16px; }
    }
  `]
})
export class LoansPage implements OnInit {
  private loanService = inject(LoanService);
  private bookService = inject(BookService);
  private memberService = inject(MemberService);

  loans = signal<Loan[]>([]);
  books = signal<Book[]>([]);
  members = signal<Member[]>([]);

  loading = signal(true);
  saving = signal(false);
  error = signal('');
  message = signal('');

  today = new Date().toLocaleDateString('en-CA');

  form = {
    bookId: 0,
    memberId: 0,
    dueDate: ''
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.bookService.getBooks().subscribe({
      next: data => this.books.set(data ?? []),
      error: () => this.error.set('Unable to load books.')
    });

    this.memberService.getMembers().subscribe({
      next: data => this.members.set(data ?? []),
      error: () => this.error.set('Unable to load members.')
    });

    this.loanService.getLoans().subscribe({
      next: data => {
        this.loans.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load loan records. Check the backend.');
        this.loading.set(false);
      }
    });
  }

  issueBook(): void {
    this.error.set('');
    this.message.set('');

    if (!this.form.bookId || !this.form.memberId || !this.form.dueDate) {
      this.error.set('Please select a book, member and due date.');
      return;
    }

    this.saving.set(true);

    this.loanService.issueBook(
      this.form.bookId,
      this.form.memberId,
      this.form.dueDate
    ).subscribe({
      next: () => {
        this.message.set('Book issued successfully.');
        this.form = { bookId: 0, memberId: 0, dueDate: '' };
        this.saving.set(false);
        this.loadData();
      },
      error: err => {
        this.error.set(err.error?.error || 'Unable to issue book.');
        this.saving.set(false);
      }
    });
  }

  returnBook(id: number): void {
    if (!confirm('Confirm that this book has been returned?')) return;

    this.error.set('');
    this.message.set('');

    this.loanService.returnBook(id).subscribe({
      next: () => {
        this.message.set('Book returned successfully.');
        this.loadData();
      },
      error: err => {
        this.error.set(err.error?.error || 'Unable to return book.');
      }
    });
  }

  getBookTitle(id: number): string {
    return this.books().find(book => book.id === id)?.title || `Book #${id}`;
  }

  getMemberName(id: number): string {
    return this.members().find(member => member.id === id)?.name || `Member #${id}`;
  }
}
