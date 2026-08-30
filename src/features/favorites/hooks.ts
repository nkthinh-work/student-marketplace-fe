import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getFavorites,
  getFavoriteIds,
  favoriteProduct,
  unfavoriteProduct,
} from './api';
import type { FavoriteFilterParams } from './types';

// Query key factory phân cấp cho Favorites
export const favoriteKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoriteKeys.all, 'list'] as const,
  list: (params?: FavoriteFilterParams) =>
    [...favoriteKeys.lists(), params || {}] as const,
  ids: () => [...favoriteKeys.all, 'ids'] as const,
};

// Hook infinite scroll danh sách sản phẩm yêu thích
export function useFavorites(params?: FavoriteFilterParams) {
  const { firebaseUser } = useAuth();

  return useInfiniteQuery({
    queryKey: favoriteKeys.list(params),
    queryFn: ({ pageParam }) =>
      getFavorites({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!firebaseUser,
    staleTime: 30 * 1000,
  });
}

// Hook lấy Set<number> các product_id đã lưu cho O(1) membership check
export function useFavoriteIds() {
  const { firebaseUser } = useAuth();

  return useQuery({
    queryKey: favoriteKeys.ids(),
    queryFn: async () => {
      const data = await getFavoriteIds();
      return new Set(data.product_ids);
    },
    enabled: !!firebaseUser,
    staleTime: 60 * 1000,
  });
}

// Hook mutation toggle favorite/unfavorite với optimistic update
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isFavorited,
    }: {
      productId: number;
      isFavorited: boolean;
    }) => {
      if (isFavorited) {
        await unfavoriteProduct(productId);
      } else {
        await favoriteProduct(productId);
      }
    },
    onMutate: async ({ productId, isFavorited }) => {
      // Hủy queries đang chạy để tránh đè optimistic update
      await queryClient.cancelQueries({ queryKey: favoriteKeys.ids() });

      // Lưu snapshot cache cũ để rollback khi lỗi
      const previousIds = queryClient.getQueryData<Set<number>>(
        favoriteKeys.ids(),
      );

      // Cập nhật optimistic Set<number>
      queryClient.setQueryData<Set<number>>(favoriteKeys.ids(), (old) => {
        const newSet = new Set(old || []);
        if (isFavorited) {
          newSet.delete(productId);
        } else {
          newSet.add(productId);
        }
        return newSet;
      });

      return { previousIds };
    },
    onError: (_err, _variables, context) => {
      // Rollback nếu có lỗi
      if (context?.previousIds) {
        queryClient.setQueryData(favoriteKeys.ids(), context.previousIds);
      }
    },
    onSettled: () => {
      // Invalidate để đồng bộ chuẩn xác với server
      queryClient.invalidateQueries({ queryKey: favoriteKeys.ids() });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.lists() });
    },
  });
}
