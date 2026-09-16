import { apiClient } from '@/services/apiClient';
import {
  DailyNeed,
  DailyNeedPublic,
  DailyNeedSummary,
  DailyNeedListResponse,
  DailyNeedCreateOrUpdatePayload,
} from './types';

export const getTodayDailyNeeds = async (): Promise<DailyNeedListResponse> => {
  const response = await apiClient.get<DailyNeedListResponse>('/api/v1/daily-needs/today');
  return response.data;
};

export const getMyTodayDailyNeed = async (): Promise<DailyNeed | null> => {
  const response = await apiClient.get<DailyNeed | null>('/api/v1/daily-needs/me/today');
  return response.data;
};

export const getMyDailyNeedSummary = async (): Promise<DailyNeedSummary> => {
  const response = await apiClient.get<DailyNeedSummary>('/api/v1/daily-needs/me/summary');
  return response.data;
};

export const getUserTodayDailyNeed = async (
  userId: number
): Promise<DailyNeedPublic | null> => {
  const response = await apiClient.get<DailyNeedPublic | null>(
    `/api/v1/daily-needs/users/${userId}/today`
  );
  return response.data;
};

export const upsertMyTodayDailyNeed = async (
  payload: DailyNeedCreateOrUpdatePayload
): Promise<DailyNeed> => {
  const response = await apiClient.put<DailyNeed>(
    '/api/v1/daily-needs/me/today',
    payload
  );
  return response.data;
};

export const deleteMyTodayDailyNeed = async (): Promise<void> => {
  await apiClient.delete('/api/v1/daily-needs/me/today');
};

