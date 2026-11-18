
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page')
        .then(m => m.DashboardPage)
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./features/books/pages/books-page')
        .then(m => m.BooksPage)
  },
  {
    path: 'books/:id',
    loadComponent: () =>
      import('./features/books/pages/book-detail-page')
        .then(m => m.BookDetailPage)
  },
  {
    path: 'members',
    loadComponent: () =>
      import('./features/members/pages/members-page')
        .then(m => m.MembersPage)
  },
  {
    path: 'members/:id',
    loadComponent: () =>
      import('./features/members/pages/member-detail-page')
        .then(m => m.MemberDetailPage)
  },
  {
    path: 'loans',
    loadComponent: () =>
      import('./features/loans/pages/loans-page')
        .then(m => m.LoansPage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
