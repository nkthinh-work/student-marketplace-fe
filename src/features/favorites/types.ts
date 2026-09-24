import type { CategorySummary } from '@/features/categories/types';
import type { ListingType, ProductStatus, SellerSummary } from '@/features/products/types';

export interface FavoriteProductResponse {
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
  favorited_at: string;
}

export interface FavoriteListResponse {
  items: FavoriteProductResponse[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface FavoriteIdsResponse {
  product_ids: number[];
}

export interface FavoriteFilterParams {
  limit?: number;
  cursor?: string;
}
