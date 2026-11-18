
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Book } from '../../../shared/models/book.model';
import { Member } from '../../../shared/models/member.model';
import { Loan } from '../../../shared/models/loan.model';

import { BookService } from '../services/book.service';
import { MemberService } from '../../members/services/member.service';
import { LoanService } from '../../loans/services/loan.service';

@Component({
  selector: 'app-book-detail-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <div>
          <h1>Book Details</h1>
          <p>View book information and borrowing history.</p>
        </div>

        <button class="back-button" type="button" (click)="goBack()">
          Back to Books
        </button>
      </div>

      <div *ngIf="loading()" class="message">
        Loading book details...
      </div>

      <div *ngIf="error()" class="error">
        {{ error() }}
      </div>

      <ng-container *ngIf="!loading() && book() as selectedBook">
        <section class="details-card">
          <h2>{{ selectedBook.title }}</h2>

          <div class="details-grid">
            <div class="detail-item">
              <span>Author</span>
              <strong>{{ selectedBook.author }}</strong>
            </div>

            <div class="detail-item">
              <span>ISBN</span>
              <strong>{{ selectedBook.isbn }}</strong>
            </div>

            <div class="detail-item">
              <span>Category</span>
              <strong>{{ selectedBook.category }}</strong>
            </div>

            <div class="detail-item">
              <span>Total Copies</span>
              <strong>{{ selectedBook.total_copies }}</strong>
            </div>

            <div class="detail-item">
              <span>Available Copies</span>
              <strong>{{ selectedBook.available_copies }}</strong>
            </div>

            <div class="detail-item">
              <span>Availability</span>
              <strong
                [class.available]="selectedBook.available_copies > 0"
                [class.unavailable]="selectedBook.available_copies === 0"
              >
                {{
                  selectedBook.available_copies > 0
                    ? 'Available'
                    : 'Unavailable'
                }}
              </strong>
            </div>
          </div>
        </section>

        <section class="history-card">
          <div class="section-heading">
            <div>
              <h2>Borrowing History</h2>
              <p>Members who have borrowed this book.</p>
            </div>
            <span class="count">{{ borrowingHistory().length }} Records</span>
          </div>

          <div *ngIf="borrowingHistory().length === 0" class="empty">
            No borrowing history found for this book.
          </div>

          <div class="table-wrapper" *ngIf="borrowingHistory().length > 0">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr *ngFor="let loan of borrowingHistory()">
                  <td>
                    {{ memberNames()[loan.member_id] || 'Unknown Member' }}
                  </td>
                  <td>{{ loan.issue_date | date: 'mediumDate' }}</td>
                  <td>{{ loan.due_date | date: 'mediumDate' }}</td>
                  <td>
                    {{
                      loan.return_date
                        ? (loan.return_date | date: 'mediumDate')
                        : 'Not returned'
                    }}
                  </td>
                  <td>
                    <span
                      class="status"
                      [class.active]="loan.status === 'active'"
                      [class.returned]="loan.status === 'returned'"
                    >
                      {{ loan.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .page {
      padding: 24px;
      color: #26352d;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    h1 {
      margin: 0 0 6px;
      font-size: 26px;
    }

    h2 {
      margin: 0 0 18px;
      font-size: 19px;
    }

    p {
      margin: 0;
      color: #718078;
    }

    button {
      border: none;
      border-radius: 7px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 600;
    }

    .back-button {
      background: #e7f2eb;
      color: #247447;
    }

    .details-card,
    .history-card {
      background: white;
      border: 1px solid #e5ebe7;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 22px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .detail-item span {
      color: #718078;
      font-size: 13px;
    }

    .detail-item strong {
      font-size: 15px;
    }

    .available {
      color: #23834c;
    }

    .unavailable {
      color: #c0392b;
    }

    .section-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .section-heading h2 {
      margin-bottom: 6px;
    }

    .count {
      background: #e7f2eb;
      color: #247447;
      padding: 7px 12px;
      border-radius: 20px;
      font-size: 13px;
      white-space: nowrap;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th,
    td {
      padding: 14px 12px;
      border-bottom: 1px solid #edf0ee;
      font-size: 14px;
      white-space: nowrap;
    }

    th {
      color: #68776e;
      background: #f7f9f7;
      font-weight: 600;
    }

    .status {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
      text-transform: capitalize;
      font-size: 12px;
      font-weight: 600;
    }

    .status.active {
      background: #fff2d9;
      color: #a66b00;
    }

    .status.returned {
      background: #e3f4e9;
      color: #23834c;
    }

    .empty,
    .message {
      padding: 24px;
      text-align: center;
      color: #718078;
    }

    .error {
      color: #c0392b;
      padding: 16px;
    }

    @media (max-width: 700px) {
      .page {
        padding: 14px;
      }

      .top-bar {
        align-items: flex-start;
        flex-direction: column;
      }

      .details-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .details-card,
      .history-card {
        padding: 16px;
      }
    }
  `]
})
export class BookDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private memberService = inject(MemberService);
  private loanService = inject(LoanService);

  book = signal<Book | null>(null);
  borrowingHistory = signal<Loan[]>([]);
  memberNames = signal<Record<number, string>>({});

  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || Number.isNaN(id)) {
      this.error.set('Invalid book ID.');
      this.loading.set(false);
      return;
    }

    this.loadBook(id);
    this.loadMembers();
    this.loadBorrowingHistory(id);
  }

  loadBook(id: number): void {
    this.bookService.getBookById(id).subscribe({
      next: (book) => {
        this.book.set(book);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load book details.');
        this.loading.set(false);
      }
    });
  }

  loadMembers(): void {
    this.memberService.getMembers().subscribe({
      next: (members: Member[]) => {
        const names: Record<number, string> = {};

        members.forEach((member) => {
          names[member.id] = member.name;
        });

        this.memberNames.set(names);
      },
      error: () => {
        // Member names will display as Unknown Member if loading fails.
      }
    });
  }

  loadBorrowingHistory(bookId: number): void {
    this.loanService.getLoans().subscribe({
      next: (loans) => {
        const history = loans
          .filter((loan) => loan.book_id === bookId)
          .sort((a, b) =>
            new Date(b.issue_date).getTime() -
            new Date(a.issue_date).getTime()
          );

        this.borrowingHistory.set(history);
      },
      error: () => {
        this.error.set('Unable to load borrowing history.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/books']);
  }
}
