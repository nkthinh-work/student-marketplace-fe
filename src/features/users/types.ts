export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'ZALO' | 'LINKEDIN';

export interface SocialLinkItem {
  platform: SocialPlatform;
  url: string;
}

export interface UserResponse {
  user_id: number;
  email: string;
  full_name: string;
  phone: string | null;
  show_phone_publicly: boolean;
  social_links: SocialLinkItem[] | null;
  avatar_url: string | null;
  bio: string | null;
  delivery_area: string | null;
  default_meetup_area: string | null;
  role: 'STUDENT' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'INACTIVE';
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUserProfileResponse {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  delivery_area: string | null;
  phone: string | null;
  social_links: SocialLinkItem[] | null;
  role: string;
  created_at: string;
  active_listing_count: number;
  completed_sold_count: number;
  rating_average?: number | null;
  review_count?: number;
}

export interface SoldProductTransactionReview {
  rating: number;
  comment: string | null;
  created_at: string;
  verified_transaction: boolean;
}

export interface SoldProductSummary {
  product_id: number;
  product_title: string;
  product_image_url: string | null;
  total_sold_quantity: number;
  last_sold_at: string | null;
  rating_average?: number | null;
  review_count?: number;
  recent_reviews?: SoldProductTransactionReview[];
}

export interface SoldProductListResponse {
  items: SoldProductSummary[];
  total_count: number;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  show_phone_publicly?: boolean;
  social_links?: SocialLinkItem[];
  bio?: string;
  delivery_area?: string;
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
