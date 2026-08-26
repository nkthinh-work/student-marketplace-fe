import { useQuery } from '@tanstack/react-query';
import { getCategories, getCategory } from './api';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  detail: (id: number) => [...categoryKeys.all, 'detail', id] as const,
};

// Hook lấy danh sách categories (cache 10 phút)
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook lấy chi tiết category
export function useCategory(categoryId?: number) {
  return useQuery({
    queryKey: categoryKeys.detail(categoryId!),
    queryFn: () => getCategory(categoryId!),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000,
  });
}
