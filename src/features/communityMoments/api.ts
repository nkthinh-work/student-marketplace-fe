import { apiClient } from '@/services/apiClient';
import type {
  AdminCommunityMomentCursorPage,
  AdminCommunityMomentFilters,
  AdminCommunityMomentItem,
  CommunityMomentActionResponse,
  CommunityMomentSubmissionResponse,
  PublicHeroResponse,
} from './types';

export async function submitCommunityMoment(
  file: File,
  note: string
): Promise<CommunityMomentSubmissionResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('note', note.trim());

  const response = await apiClient.post<CommunityMomentSubmissionResponse>(
    '/api/v1/community-moments',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function getPublicHeroMoments(): Promise<PublicHeroResponse> {
  const response = await apiClient.get<PublicHeroResponse>(
    '/api/v1/community-moments/hero'
  );
  return response.data;
}

export async function getAdminCommunityMoments(
  params?: AdminCommunityMomentFilters
): Promise<AdminCommunityMomentCursorPage> {
  const response = await apiClient.get<AdminCommunityMomentCursorPage>(
    '/api/v1/admin/community-moments',
    { params }
  );
  return response.data;
}

export async function getAdminCommunityMomentDetail(
  momentId: number
): Promise<AdminCommunityMomentItem> {
  const response = await apiClient.get<AdminCommunityMomentItem>(
    `/api/v1/admin/community-moments/${momentId}`
  );
  return response.data;
}

export async function approveCommunityMoment(
  momentId: number
): Promise<AdminCommunityMomentItem> {
  const response = await apiClient.post<AdminCommunityMomentItem>(
    `/api/v1/admin/community-moments/${momentId}/approve`
  );
  return response.data;
}

export async function rejectCommunityMoment(
  momentId: number
): Promise<CommunityMomentActionResponse> {
  const response = await apiClient.post<CommunityMomentActionResponse>(
    `/api/v1/admin/community-moments/${momentId}/reject`
  );
  return response.data;
}

export async function deleteAdminCommunityMoment(
  momentId: number
): Promise<CommunityMomentActionResponse> {
  const response = await apiClient.delete<CommunityMomentActionResponse>(
    `/api/v1/admin/community-moments/${momentId}`
  );
  return response.data;
}
