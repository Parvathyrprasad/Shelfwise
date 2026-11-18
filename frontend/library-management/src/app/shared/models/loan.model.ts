export interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: 'active' | 'returned';
  created_at: string;
}