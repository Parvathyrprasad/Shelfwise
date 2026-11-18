export interface RecentActivity {
  id: number;
  type: string;
  book_title: string;
  member_name: string;
  date: string;
}

export interface DashboardSummary {
  total_books: number;
  total_copies: number;
  available_copies: number;
  total_members: number;
  active_loans: number;
  overdue_loans: number;
  recent_activity: RecentActivity[];
}