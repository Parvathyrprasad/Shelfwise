export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}