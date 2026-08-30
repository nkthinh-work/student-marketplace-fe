import { apiClient } from '@/services/apiClient';
import type {
  FavoriteListResponse,
  FavoriteIdsResponse,
  FavoriteFilterParams,
} from './types';

// Lưu sản phẩm yêu thích (idempotent)
export async function favoriteProduct(productId: number): Promise<void> {
  await apiClient.post(`/api/v1/favorites/${productId}`);
}

// Bỏ lưu sản phẩm yêu thích (idempotent)
export async function unfavoriteProduct(productId: number): Promise<void> {
  await apiClient.delete(`/api/v1/favorites/${productId}`);
}

// Lấy danh sách sản phẩm yêu thích (hỗ trợ cursor pagination)
export async function getFavorites(
  params?: FavoriteFilterParams,
): Promise<FavoriteListResponse> {
  const queryParams: Record<string, string | number> = {};
  if (params?.limit) {
    queryParams.limit = params.limit;
  }
  if (params?.cursor) {
    queryParams.cursor = params.cursor;
  }

  const response = await apiClient.get<FavoriteListResponse>(
    '/api/v1/favorites',
    {
      params: queryParams,
    },
  );
  return response.data;
}

// Lấy toàn bộ danh sách product_id đã lưu (lightweight O(1) membership check)
export async function getFavoriteIds(): Promise<FavoriteIdsResponse> {
  const response = await apiClient.get<FavoriteIdsResponse>(
    '/api/v1/favorites/ids',
  );
  return response.data;
}
