import { apiClient } from '@/services/apiClient';
import type {
  AdminFeedbackDetail,
  AdminFeedbackListPage,
  AdminSupportContributionCreatePayload,
  AdminSupportContributionCursorPage,
  AdminSupportContributionItem,
  AdminSupportContributionVisibilityPayload,
  AdminSupportClaimCursorPage,
  AdminSupportClaimItem,
  AdminSupportClaimRejectPayload,
  AdminSupportClaimVerifyPayload,
  FeedbackCreateResponse,
  MyFeedbackCursorPage,
  PublicFeedbackCursorPage,
  SupportClaimCreatePayload,
  SupportClaimItem,
  SupportClaimUserListPage,
  SupportResponse,
  SupporterLeaderboardResponse,
  SupporterSearchResult,
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

export async function getSupporterLeaderboard(): Promise<SupporterLeaderboardResponse> {
  const response = await apiClient.get<SupporterLeaderboardResponse>(
    '/api/v1/feedback/support/leaderboard'
  );
  return response.data;
}

export async function getAdminSupportContributions(params?: {
  limit?: number;
  cursor?: string;
}): Promise<AdminSupportContributionCursorPage> {
  const response = await apiClient.get<AdminSupportContributionCursorPage>(
    '/api/v1/admin/support-contributions',
    { params }
  );
  return response.data;
}

export async function createAdminSupportContribution(
  payload: AdminSupportContributionCreatePayload
): Promise<AdminSupportContributionItem> {
  const response = await apiClient.post<AdminSupportContributionItem>(
    '/api/v1/admin/support-contributions',
    payload
  );
  return response.data;
}

export async function updateAdminSupportContributionVisibility(
  contributionId: number,
  payload: AdminSupportContributionVisibilityPayload
): Promise<AdminSupportContributionItem> {
  const response = await apiClient.patch<AdminSupportContributionItem>(
    `/api/v1/admin/support-contributions/${contributionId}/visibility`,
    payload
  );
  return response.data;
}

export async function deleteAdminSupportContribution(contributionId: number): Promise<void> {
  await apiClient.delete(`/api/v1/admin/support-contributions/${contributionId}`);
}

export async function createSupportClaim(
  payload: SupportClaimCreatePayload
): Promise<SupportClaimItem> {
  const response = await apiClient.post<SupportClaimItem>(
    '/api/v1/feedback/support/claims',
    payload
  );
  return response.data;
}

export async function getMySupportClaims(limit = 10): Promise<SupportClaimUserListPage> {
  const response = await apiClient.get<SupportClaimUserListPage>(
    '/api/v1/feedback/support/claims/me',
    { params: { limit } }
  );
  return response.data;
}

export async function getAdminSupportClaims(params?: {
  status?: string;
  limit?: number;
  cursor?: string;
}): Promise<AdminSupportClaimCursorPage> {
  const response = await apiClient.get<AdminSupportClaimCursorPage>(
    '/api/v1/admin/support-claims',
    { params }
  );
  return response.data;
}

export async function verifyAdminSupportClaim(
  claimId: number,
  payload: AdminSupportClaimVerifyPayload
): Promise<AdminSupportClaimItem> {
  const response = await apiClient.post<AdminSupportClaimItem>(
    `/api/v1/admin/support-claims/${claimId}/verify`,
    payload
  );
  return response.data;
}

export async function rejectAdminSupportClaim(
  claimId: number,
  payload: AdminSupportClaimRejectPayload
): Promise<AdminSupportClaimItem> {
  const response = await apiClient.post<AdminSupportClaimItem>(
    `/api/v1/admin/support-claims/${claimId}/reject`,
    payload
  );
  return response.data;
}

export async function searchAdminSupporters(
  query: string,
  limit = 10
): Promise<SupporterSearchResult[]> {
  const response = await apiClient.get<SupporterSearchResult[]>(
    '/api/v1/admin/support-contributions/search-supporters',
    { params: { query, limit } }
  );
  return response.data;
}
