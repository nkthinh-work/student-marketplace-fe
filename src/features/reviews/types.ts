export interface ReviewCreateRequest {
  rating: number;
  comment?: string | null;
}

export interface ReviewUpdateRequest {
  rating?: number;
  comment?: string | null;
}

export interface OrderReviewResponse {
  review_id: number;
  order_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  created_at: string;
  updated_at: string;
}

export interface PublicSellerReviewItem {
  rating: number;
  comment: string | null;
  verified_transaction: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicSellerReviewsCursorPage {
  items: PublicSellerReviewItem[];
  next_cursor: string | null;
  has_more: boolean;
}
