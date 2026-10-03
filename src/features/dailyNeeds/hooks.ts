import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRecentDailyNeeds,
  getTodayDailyNeeds,
  getMyTodayDailyNeed,
  getMyDailyNeedSummary,
  getUserTodayDailyNeed,
  upsertMyTodayDailyNeed,
  deleteMyTodayDailyNeed,
} from './api';
import { DailyNeedCreateOrUpdatePayload } from './types';

export const dailyNeedKeys = {
  all: ['daily-needs'] as const,
  recent: (limit = 10) => [...dailyNeedKeys.all, 'recent', limit] as const,
  today: () => [...dailyNeedKeys.all, 'today'] as const,
  myToday: () => [...dailyNeedKeys.all, 'my-today'] as const,
  mySummary: () => [...dailyNeedKeys.all, 'my-summary'] as const,
  userToday: (publicId?: string | number | null) =>
    [...dailyNeedKeys.all, 'users', publicId, 'today'] as const,
};


export const useRecentDailyNeeds = (limit = 10) => {
  return useQuery({
    queryKey: dailyNeedKeys.recent(limit),
    queryFn: () => getRecentDailyNeeds(limit),
    staleTime: 30_000,
  });
};

export const useTodayDailyNeeds = () => {
  return useQuery({
    queryKey: dailyNeedKeys.today(),
    queryFn: getTodayDailyNeeds,
    staleTime: 30_000,
  });
};

export const useMyTodayDailyNeed = (enabled = true) => {
  return useQuery({
    queryKey: dailyNeedKeys.myToday(),
    queryFn: getMyTodayDailyNeed,
    enabled,
    staleTime: 30_000,
  });
};

export const useMyDailyNeedSummary = (enabled = true) => {
  return useQuery({
    queryKey: dailyNeedKeys.mySummary(),
    queryFn: getMyDailyNeedSummary,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
};

export const useUserTodayDailyNeed = (
  publicId?: string | null,
  enabled = true
) => {
  return useQuery({
    queryKey: dailyNeedKeys.userToday(publicId),
    queryFn: () => {
      if (!publicId) return null;
      return getUserTodayDailyNeed(publicId);
    },
    enabled: enabled && Boolean(publicId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
};

export const useUpsertDailyNeed = (currentUserId?: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DailyNeedCreateOrUpdatePayload) =>
      upsertMyTodayDailyNeed(payload),
    onSuccess: async (data) => {
      queryClient.setQueryData(dailyNeedKeys.myToday(), data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dailyNeedKeys.today() }),
        queryClient.invalidateQueries({ queryKey: dailyNeedKeys.recent() }),
        queryClient.invalidateQueries({ queryKey: dailyNeedKeys.mySummary() }),
        currentUserId
          ? queryClient.invalidateQueries({
              queryKey: dailyNeedKeys.userToday(currentUserId),
            })
          : Promise.resolve(),
      ]);
    },
  });
};

export const useDeleteDailyNeed = (currentUserId?: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMyTodayDailyNeed(),
    onSuccess: async () => {
      queryClient.setQueryData(dailyNeedKeys.myToday(), null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dailyNeedKeys.today() }),
        queryClient.invalidateQueries({ queryKey: dailyNeedKeys.recent() }),
        queryClient.invalidateQueries({ queryKey: dailyNeedKeys.mySummary() }),
        currentUserId
          ? queryClient.invalidateQueries({
              queryKey: dailyNeedKeys.userToday(currentUserId),
            })
          : Promise.resolve(),
      ]);
    },
  });
};

