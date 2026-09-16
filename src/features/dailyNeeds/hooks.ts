import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
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
  today: () => [...dailyNeedKeys.all, 'today'] as const,
  myToday: () => [...dailyNeedKeys.all, 'my-today'] as const,
  mySummary: () => [...dailyNeedKeys.all, 'my-summary'] as const,
  userToday: (userId?: number | null) =>
    [...dailyNeedKeys.all, 'users', userId, 'today'] as const,
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
  });
};

export const useUserTodayDailyNeed = (
  userId?: number | null,
  enabled = true
) => {
  return useQuery({
    queryKey: dailyNeedKeys.userToday(userId),
    queryFn: () => {
      if (!userId) return null;
      return getUserTodayDailyNeed(userId);
    },
    enabled: enabled && Boolean(userId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
};

export const useUpsertDailyNeed = (currentUserId?: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DailyNeedCreateOrUpdatePayload) =>
      upsertMyTodayDailyNeed(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNeedKeys.today() });
      queryClient.invalidateQueries({ queryKey: dailyNeedKeys.myToday() });
      queryClient.invalidateQueries({ queryKey: dailyNeedKeys.mySummary() });
      if (currentUserId) {
        queryClient.invalidateQueries({
          queryKey: dailyNeedKeys.userToday(currentUserId),
        });
      }
    },
  });
};

export const useDeleteDailyNeed = (currentUserId?: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMyTodayDailyNeed(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNeedKeys.today() });
      queryClient.invalidateQueries({ queryKey: dailyNeedKeys.myToday() });
      queryClient.invalidateQueries({ queryKey: dailyNeedKeys.mySummary() });
      if (currentUserId) {
        queryClient.invalidateQueries({
          queryKey: dailyNeedKeys.userToday(currentUserId),
        });
      }
    },
  });
};

