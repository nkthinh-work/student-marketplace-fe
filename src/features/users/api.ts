import { apiClient } from '@/services/apiClient';
import type { UserResponse, UserUpdate } from './types';

export async function fetchCurrentUser(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>('/api/v1/users/me');
  return data;
}

export async function updateCurrentUser(
  payload: UserUpdate,
): Promise<UserResponse> {
  const { data } = await apiClient.patch<UserResponse>(
    '/api/v1/users/me',
    payload,
  );
  return data;
}
