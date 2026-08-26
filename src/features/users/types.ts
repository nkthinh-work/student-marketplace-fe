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
  avatar_url?: string;
  bio?: string;
  default_meetup_area?: string;
}
