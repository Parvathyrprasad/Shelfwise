
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Loan } from '../../../shared/models/loan.model';
import { API_CONFIG } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.BASE_URL}/loans`;

  getLoans(): Observable<Loan[]> {
    return this.http.get<Loan[]>(this.apiUrl);
  }

  getLoanById(id: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.apiUrl}/${id}`);
  }

  issueBook(bookId: number, memberId: number, dueDate: string): Observable<Loan> {
    return this.http.post<Loan>(this.apiUrl, {
      book_id: bookId,
      member_id: memberId,
      due_date: dueDate
    });
  }

  returnBook(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/return`, {});
  }
}
