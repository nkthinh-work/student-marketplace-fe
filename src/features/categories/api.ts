import { apiClient } from '@/services/apiClient';
import type { CategoryResponse } from './types';

// Lấy danh sách category active
export async function getCategories(): Promise<CategoryResponse[]> {
  const response = await apiClient.get<CategoryResponse[]>('/api/v1/categories');
  return response.data;
}

// Lấy chi tiết category theo ID
export async function getCategory(categoryId: number): Promise<CategoryResponse> {
  const response = await apiClient.get<CategoryResponse>(`/api/v1/categories/${categoryId}`);
  return response.data;
}
