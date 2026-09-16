import type { CategorySummary } from '@/features/categories/types';

export type ListingType = 'FIXED_PRICE' | 'AUCTION';
export type ProductStatus = 'AVAILABLE' | 'HIDDEN' | 'SOLD_OUT';
export type SellerUpdatableStatus = 'AVAILABLE' | 'HIDDEN';

export interface SellerSummary {
  user_id: number;
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
  thumbnail_url?: string | null;
  category: CategorySummary;
  seller: SellerSummary;
  created_at: string;
}

export interface ProductDetailResponse {
  product_id: number;
  title: string;
  description?: string | null;
  listing_type: ListingType;
  price: number | string;
  available_stock: number;
  status: ProductStatus;
  view_count: number;
  images: ProductImageResponse[];
  category: CategorySummary;
  seller: SellerDetailSummary;
  created_at: string;
  updated_at: string;
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
  view_count: number;
  thumbnail_url?: string | null;
  category: CategorySummary;
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
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface SellerProductFilterParams {
  status?: ProductStatus;
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
