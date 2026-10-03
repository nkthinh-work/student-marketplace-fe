import type { CategorySummary } from '@/features/categories/types';

export type ListingType = 'FIXED_PRICE' | 'AUCTION';
export type ProductStatus = 'AVAILABLE' | 'HIDDEN' | 'SOLD_OUT';
export type SellerUpdatableStatus = 'AVAILABLE' | 'HIDDEN';
export type ProductApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SellerSummary {
  public_id: string;
  full_name: string;
  avatar_url?: string | null;
}

export interface SellerDetailSummary extends SellerSummary {
  delivery_area?: string | null;
  default_meetup_area?: string | null;
  created_at: string;
  rating_average?: number | null;
  review_count?: number;
}

export interface ProductImageResponse {
  image_id: number;
  product_id: number;
  image_url: string;
  detail_url: string;
  sort_order: number;
  is_thumbnail: boolean;
}

export interface ImageReorderItem {
  image_id: number;
  sort_order: number;
}

export interface ImageReorderRequest {
  images: ImageReorderItem[];
}

export interface ProductSummaryResponse {
  product_id: number;
  title: string;
  price: number | string;
  listing_type: ListingType;
  status: ProductStatus;
  available_stock: number;
  view_count: number;
  thumbnail_url?: string | null;
  category: CategorySummary;
  seller: SellerSummary;
  created_at: string;
}

export type ProductModerationStatus = 'CLEAR' | 'BLOCKED';

export interface ProductDetailResponse {
  product_id: number;
  title: string;
  description?: string | null;
  listing_type: ListingType;
  price: number | string;
  available_stock: number;
  status: ProductStatus;
  moderation_status: ProductModerationStatus;
  view_count: number;
  images: ProductImageResponse[];
  category: CategorySummary;
  seller: SellerDetailSummary;
  created_at: string;
  updated_at: string;
}

export interface SellerAuctionSummary {
  auction_id: number;
  status: string;
  starting_price: number | string;
  bid_step: number | string;
  current_price: number | string;
  starts_at: string;
  ends_at: string;
  winner_checkout_deadline?: string | null;
  bid_count: number;
}

export interface SellerProductResponse {
  product_id: number;
  title: string;
  description?: string | null;
  listing_type: ListingType;
  price: number | string;
  stock: number;
  reserved_stock: number;
  available_stock: number;
  status: ProductStatus;
  moderation_status: ProductModerationStatus;
  approval_status: ProductApprovalStatus;
  submitted_for_review_at?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  view_count: number;
  thumbnail_url?: string | null;
  category: CategorySummary;
  auction?: SellerAuctionSummary | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: ProductSummaryResponse[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface SellerProductListResponse {
  items: SellerProductResponse[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface ProductFilterParams {
  category_id?: number;
  seller_id?: number;
  seller_public_id?: string;
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface SellerProductFilterParams {
  status?: ProductStatus;
  approval_status?: ProductApprovalStatus;
  limit?: number;
  cursor?: string;
}

export interface ProductCreatePayload {
  category_id: number;
  title: string;
  description?: string;
  listing_type: ListingType;
  price: number;
  stock: number;
}

export interface ProductUpdatePayload {
  category_id?: number;
  title?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: SellerUpdatableStatus;
}

export interface ProductViewResponse {
  view_count: number;
  counted: boolean;
}

export interface AdminProductApprovalSummary {
  product_id: number;
  title: string;
  price: number | string;
  listing_type: ListingType;
  thumbnail_url?: string | null;
  category: CategorySummary;
  seller: SellerSummary;
  image_count: number;
  submitted_for_review_at?: string | null;
  approval_status: ProductApprovalStatus;
  created_at: string;
}

export interface AdminProductApprovalListResponse {
  items: AdminProductApprovalSummary[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface AdminProductApprovalDetailResponse {
  product_id: number;
  title: string;
  description?: string | null;
  listing_type: ListingType;
  price: number | string;
  stock: number;
  status: ProductStatus;
  approval_status: ProductApprovalStatus;
  moderation_status: ProductModerationStatus;
  submitted_for_review_at?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  thumbnail_url?: string | null;
  images: ProductImageResponse[];
  category: CategorySummary;
  seller: SellerDetailSummary;
  created_at: string;
  updated_at: string;
}

export interface AdminApprovalDecisionRequest {
  decision: 'APPROVE' | 'REJECT';
  note?: string | null;
}
