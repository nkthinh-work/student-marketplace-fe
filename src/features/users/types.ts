export interface UserResponse {
  user_id: number;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  default_meetup_area: string | null;
  role: 'STUDENT' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE';
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  bio?: string;
  default_meetup_area?: string;
}

export interface SupportedBank {
  bin: string;
  code: string;
  short_name: string;
  name: string;
}

export interface BankAccount {
  bank_bin: string;
  bank_code: string;
  bank_name: string;
  bank_short_name: string;
  account_number: string;
  account_name: string;
}

export interface BankAccountInput {
  bank_bin: string;
  account_number: string;
  account_name: string;
}
