
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Book } from '../../../shared/models/book.model';
import { BookService } from '../services/book.service';

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-intro">
      <p class="eyebrow">COLLECTION MANAGEMENT</p>
      <h1>Book Catalog</h1>
      <p class="description">Manage and organise your library collection.</p>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>{{ editingId ? 'Edit Book' : 'Add New Book' }}</h2>
        <button class="secondary" type="button" (click)="resetForm()">
          {{ editingId ? 'Cancel Edit' : 'Clear Form' }}
        </button>
      </div>

      <form (ngSubmit)="saveBook()">
        <div class="form-grid">
          <label>
            Book Title
            <input name="title" [(ngModel)]="form.title" required />
          </label>

          <label>
            Author
            <input name="author" [(ngModel)]="form.author" required />
          </label>

          <label>
            ISBN
            <input name="isbn" [(ngModel)]="form.isbn" required />
          </label>

          <label>
            Category
            <input name="category" [(ngModel)]="form.category" required />
          </label>

          <label>
            Total Copies
            <input name="total_copies" type="number"
              min="1" [(ngModel)]="form.total_copies" required />
          </label>
        </div>

        <button class="primary" type="submit" [disabled]="saving()">
          {{ saving() ? 'Saving...' : editingId ? 'Update Book' : 'Add Book' }}
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
        <h2>All Books</h2>
        <span class="count">{{ books().length }} books</span>
      </div>

      @if (loading()) {
        <p>Loading books...</p>
      } @else if (books().length === 0) {
        <p class="empty">No books found. Add your first book above.</p>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Category</th>
                <th>Copies</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (book of books(); track book.id) {
                <tr>
                  <td>{{ book.title }}</td>
                  <td>{{ book.author }}</td>
                  <td>{{ book.isbn }}</td>
                  <td>{{ book.category }}</td>
                  <td>{{ book.available_copies }} / {{ book.total_copies }}</td>
                  <td class="actions">
                    <button class="secondary"
                      type="button" (click)="editBook(book)">Edit</button>
                    <button class="danger"
                      type="button" (click)="deleteBook(book.id)">Delete</button>
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
    label { display: flex; flex-direction: column; gap: 7px;
      font-size: 12px; font-weight: 600; }
    input {
      padding: 11px 12px; border: 1px solid #dedbd2;
      border-radius: 7px; font: inherit; font-weight: 400;
      min-width: 0;
    }
    input:focus { outline: 2px solid #477c78; border-color: transparent; }
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
    th, td { padding: 13px 10px; text-align: left;
      border-bottom: 1px solid #eeeae2; white-space: nowrap; }
    th { color: #777c7d; font-weight: 600; }
    .actions { display: flex; gap: 7px; }
    .success { color: #32745d; font-size: 13px; }
    .error { color: #b04435; font-size: 13px; }
    .empty { color: #777c7d; font-size: 13px; }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .panel { padding: 16px; }
    }
  `]
})
export class BooksPage implements OnInit {
  private bookService = inject(BookService);

  books = signal<Book[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  message = signal('');

  editingId: number | null = null;

  form = {
    title: '',
    author: '',
    isbn: '',
    category: '',
    total_copies: 1
  };

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.loading.set(true);
    this.bookService.getBooks().subscribe({
      next: data => {
        this.books.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load books. Check the backend server.');
        this.loading.set(false);
      }
    });
  }

  saveBook(): void {
    this.error.set('');
    this.message.set('');
    this.saving.set(true);

    const request = this.editingId
      ? this.bookService.updateBook(this.editingId, this.form)
      : this.bookService.createBook(this.form);

    request.subscribe({
      next: () => {
        this.message.set(this.editingId ? 'Book updated successfully.' : 'Book added successfully.');
        this.resetForm();
        this.saving.set(false);
        this.loadBooks();
      },
      error: err => {
        this.error.set(err.error?.error || 'Unable to save book. Please check the details.');
        this.saving.set(false);
      }
    });
  }

  editBook(book: Book): void {
    this.editingId = book.id;
    this.form = {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      total_copies: book.total_copies
    };
    this.message.set('');
    this.error.set('');
  }

  deleteBook(id: number): void {
    if (!confirm('Are you sure you want to delete this book?')) return;

    this.error.set('');
    this.message.set('');

    this.bookService.deleteBook(id).subscribe({
      next: () => {
        this.message.set('Book deleted successfully.');
        this.loadBooks();
      },
      error: err => {
        this.error.set(err.error?.error || 'Unable to delete this book.');
      }
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form = {
      title: '',
      author: '',
      isbn: '',
      category: '',
      total_copies: 1
    };
  }
}
