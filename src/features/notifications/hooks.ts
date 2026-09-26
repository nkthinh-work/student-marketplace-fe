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
  deleteNotification,
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

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => deleteNotification(notificationId),
    onMutate: async (notificationId: number) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });

      const prevUnread = queryClient.getQueryData<{ count: number }>(
        NOTIFICATION_QUERY_KEYS.unreadCount()
      );
      const prevLists = queryClient.getQueriesData({
        queryKey: NOTIFICATION_QUERY_KEYS.lists(),
      });

      // Check if target notification is unread across pages
      let isTargetUnread = false;
      for (const [, listData] of prevLists) {
        const pages = (listData as any)?.pages || [];
        for (const page of pages) {
          const match = page.items?.find((item: any) => item.notification_id === notificationId);
          if (match && !match.is_read) {
            isTargetUnread = true;
            break;
          }
        }
        if (isTargetUnread) break;
      }

      if (isTargetUnread) {
        queryClient.setQueryData<{ count: number }>(
          NOTIFICATION_QUERY_KEYS.unreadCount(),
          (old) => ({ count: Math.max(0, (old?.count ?? 1) - 1) })
        );
      }

      // Optimistically remove from list queries
      queryClient.setQueriesData(
        { queryKey: NOTIFICATION_QUERY_KEYS.lists() },
        (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items?.filter((item: any) => item.notification_id !== notificationId) ?? [],
            })),
          };
        }
      );

      return { prevUnread, prevLists };
    },
    onError: (_err, _notificationId, context) => {
      if (context?.prevUnread) {
        queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.unreadCount(), context.prevUnread);
      }
      if (context?.prevLists) {
        for (const [key, data] of context.prevLists) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}
