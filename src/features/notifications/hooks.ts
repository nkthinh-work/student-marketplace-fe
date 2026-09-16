import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from './api';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'] as const,
  list: (params?: { unread_only?: boolean }) =>
    [...NOTIFICATION_QUERY_KEYS.lists(), params] as const,
  unreadCount: () => [...NOTIFICATION_QUERY_KEYS.all, 'unread-count'] as const,
};

export function useNotifications(params: { unread_only?: boolean; limit?: number } = {}, enabled = true) {
  const limit = params.limit ?? 20;
  const unread_only = params.unread_only ?? false;

  return useInfiniteQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list({ unread_only }),
    queryFn: ({ pageParam }) =>
      getNotifications({
        limit,
        cursor: pageParam || undefined,
        unread_only,
      }),
    initialPageParam: '' as string,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.next_cursor ? lastPage.next_cursor : undefined,
    enabled,
    staleTime: 30_000,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(),
    queryFn: getUnreadCount,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.unreadCount(), { count: 0 });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}
