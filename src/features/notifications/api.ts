import { apiClient } from '@/services/apiClient';
import {
  NotificationListResponse,
  UnreadCountResponse,
} from './types';

export interface GetNotificationsParams {
  limit?: number;
  cursor?: string;
  unread_only?: boolean;
}

export const getNotifications = async (
  params: GetNotificationsParams = {}
): Promise<NotificationListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params.cursor) {
    queryParams.append('cursor', params.cursor);
  }
  if (params.unread_only !== undefined) {
    queryParams.append('unread_only', params.unread_only.toString());
  }

  const queryString = queryParams.toString();
  const url = `/api/v1/notifications${queryString ? `?${queryString}` : ''}`;
  const response = await apiClient.get<NotificationListResponse>(url);
  return response.data;
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count');
  return response.data;
};

export const markRead = async (notificationId: number): Promise<void> => {
  await apiClient.patch(`/api/v1/notifications/${notificationId}/read`);
};

export const markAllRead = async (): Promise<void> => {
  await apiClient.patch('/api/v1/notifications/read-all');
};
