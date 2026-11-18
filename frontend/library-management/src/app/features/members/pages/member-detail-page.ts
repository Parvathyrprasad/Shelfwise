
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Member } from '../../../shared/models/member.model';
import { Book } from '../../../shared/models/book.model';
import { Loan } from '../../../shared/models/loan.model';

import { MemberService } from '../services/member.service';
import { BookService } from '../../books/services/book.service';
import { LoanService } from '../../loans/services/loan.service';

@Component({
  selector: 'app-member-detail-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <button class="back" type="button" (click)="goBack()">
        ← Back to Members
      </button>

      <h1>Member Details</h1>

      @if (loading()) {
        <p>Loading member details...</p>
      } @else if (error()) {
        <p class="error">{{ error() }}</p>
      } @else if (member(); as currentMember) {
        <section class="panel">
          <h2>{{ currentMember.name }}</h2>

          <div class="details">
            <p><strong>Member Code:</strong> {{ currentMember.member_code }}</p>
            <p><strong>Email:</strong> {{ currentMember.email }}</p>
            <p><strong>Phone:</strong> {{ currentMember.phone || '—' }}</p>
            <p><strong>Status:</strong> {{ currentMember.membership_status }}</p>
            <p><strong>Joined:</strong> {{ currentMember.joined_at | date:'mediumDate' }}</p>
          </div>
        </section>

        <section class="panel">
          <h2>Borrowing History</h2>
          <p class="count">{{ memberLoans().length }} loan records</p>

          @if (memberLoans().length === 0) {
            <p>No borrowing history found for this member.</p>
          } @else {
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (loan of memberLoans(); track loan.id) {
                    <tr>
                      <td>{{ bookTitle(loan.book_id) }}</td>
                      <td>{{ loan.issue_date | date:'mediumDate' }}</td>
                      <td>{{ loan.due_date | date:'mediumDate' }}</td>
                      <td>
                        {{ loan.return_date ? (loan.return_date | date:'mediumDate') : '—' }}
                      </td>
                      <td>
                        <span class="status" [class.active]="loan.status === 'active'">
                          {{ loan.status }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </section>
  `,
  styles: [`
    .page { display: grid; gap: 20px; }
    h1 { margin: 0; }
    .back {
      width: fit-content;
      padding: 9px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      cursor: pointer;
    }
    .panel {
      background: white;
      padding: 22px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }
    .panel h2 { margin-top: 0; }
    .details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 8px 20px;
    }
    .count { color: #64748b; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }
    th { color: #64748b; font-size: 13px; }
    .status {
      padding: 4px 9px;
      border-radius: 20px;
      background: #e5e7eb;
      font-size: 12px;
    }
    .status.active {
      background: #dcfce7;
      color: #166534;
    }
    .error { color: #dc2626; }
  `]
})
export class MemberDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private memberService = inject(MemberService);
  private bookService = inject(BookService);
  private loanService = inject(LoanService);

  member = signal<Member | null>(null);
  books = signal<Book[]>([]);
  loans = signal<Loan[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('Invalid member ID.');
      this.loading.set(false);
      return;
    }

    this.memberService.getMemberById(id).subscribe({
      next: member => {
        this.member.set(member);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load member details.');
        this.loading.set(false);
      }
    });

    this.bookService.getBooks().subscribe({
      next: books => this.books.set(books)
    });

    this.loanService.getLoans().subscribe({
      next: loans => this.loans.set(loans),
      error: () => this.error.set('Unable to load borrowing history.')
    });
  }

  memberLoans(): Loan[] {
    const currentMember = this.member();
    return currentMember
      ? this.loans().filter(loan => loan.member_id === currentMember.id)
      : [];
  }

  bookTitle(bookId: number): string {
    return this.books().find(book => book.id === bookId)?.title
      || `Book #${bookId}`;
  }

  goBack(): void {
    this.router.navigate(['/members']);
  }
}
