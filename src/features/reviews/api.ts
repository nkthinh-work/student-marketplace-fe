import { apiClient } from "@/services/apiClient";
import type {
  OrderReviewResponse,
  PublicSellerReviewsCursorPage,
  ReviewCreateRequest,
  ReviewUpdateRequest,
} from "./types";

export async function createOrderReview(
  orderId: number,
  data: ReviewCreateRequest
): Promise<OrderReviewResponse> {
  const response = await apiClient.post<OrderReviewResponse>(
    `/api/v1/orders/${orderId}/review`,
    data
  );
  return response.data;
}

export async function getOrderReview(
  orderId: number
): Promise<OrderReviewResponse | null> {
  const response = await apiClient.get<OrderReviewResponse | null>(
    `/api/v1/orders/${orderId}/review`
  );
  return response.data;
}

export async function updateOrderReview(
  orderId: number,
  data: ReviewUpdateRequest
): Promise<OrderReviewResponse> {
  const response = await apiClient.patch<OrderReviewResponse>(
    `/api/v1/orders/${orderId}/review`,
    data
  );
  return response.data;
}

export async function getPublicSellerReviews(
  publicId: string,
  cursor?: string | null,
  limit: number = 10
): Promise<PublicSellerReviewsCursorPage> {
  const params: Record<string, string | number> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  const response = await apiClient.get<PublicSellerReviewsCursorPage>(
    `/api/v1/users/${publicId}/reviews`,
    { params }
  );
  return response.data;
}
