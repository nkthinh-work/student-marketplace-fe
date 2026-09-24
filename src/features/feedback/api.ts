import { apiClient } from '@/services/apiClient';
import type {
  AdminFeedbackDetail,
  AdminFeedbackListPage,
  FeedbackCreateResponse,
  MyFeedbackCursorPage,
  PublicFeedbackCursorPage,
  SupportResponse,
} from './types';

export async function submitFeedback(formData: FormData): Promise<FeedbackCreateResponse> {
  const response = await apiClient.post<FeedbackCreateResponse>('/api/v1/feedback', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function getPublicFeedbacks(params?: {
  limit?: number;
  cursor?: string;
}): Promise<PublicFeedbackCursorPage> {
  const response = await apiClient.get<PublicFeedbackCursorPage>('/api/v1/feedback', {
    params,
  });
  return response.data;
}

export async function getMyFeedbacks(params?: {
  limit?: number;
  cursor?: string;
}): Promise<MyFeedbackCursorPage> {
  const response = await apiClient.get<MyFeedbackCursorPage>('/api/v1/feedback/me', {
    params,
  });
  return response.data;
}

export async function deleteMyFeedback(feedbackId: number): Promise<void> {
  await apiClient.delete(`/api/v1/feedback/${feedbackId}`);
}

export async function getSupportInfo(): Promise<SupportResponse> {
  const response = await apiClient.get<SupportResponse>('/api/v1/feedback/support');
  return response.data;
}

export async function getAdminFeedbacks(params?: {
  limit?: number;
  cursor?: string;
}): Promise<AdminFeedbackListPage> {
  const response = await apiClient.get<AdminFeedbackListPage>('/api/v1/admin/feedback', {
    params,
  });
  return response.data;
}

export async function getAdminFeedbackDetail(feedbackId: number): Promise<AdminFeedbackDetail> {
  const response = await apiClient.get<AdminFeedbackDetail>(`/api/v1/admin/feedback/${feedbackId}`);
  return response.data;
}

export async function deleteAdminFeedback(feedbackId: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/feedback/${feedbackId}`);
}

export async function getAdminFeedbackEvidenceBlob(
  feedbackId: number,
  attachmentId: number,
  signal?: AbortSignal
): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    `/api/v1/admin/feedback/${feedbackId}/evidence/${attachmentId}`,
    {
      responseType: 'blob',
      signal,
    }
  );
  return response.data;
}

