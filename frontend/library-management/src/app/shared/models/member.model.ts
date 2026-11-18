export interface Member {
  id: number;
  member_code: string;
  name: string;
  email: string;
  phone: string;
  membership_status: 'active' | 'inactive' | 'suspended';
  joined_at: string;
  created_at: string;
  updated_at: string;
}