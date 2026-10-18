import { apiClient } from '@/services/apiClient';
import type {
  AdminTutorial,
  AdminTutorialReorderPayload,
  AdminTutorialUpdatePayload,
  PublicTutorial,
} from './types';

export async function getPublicTutorials(): Promise<PublicTutorial[]> {
  const response = await apiClient.get<PublicTutorial[]>('/api/v1/tutorials');
  return response.data;
}

export async function getAdminTutorials(featureKey?: string): Promise<AdminTutorial[]> {
  const response = await apiClient.get<AdminTutorial[]>('/api/v1/admin/tutorials', {
    params: featureKey ? { feature_key: featureKey } : undefined,
  });
  return response.data;
}

import type { AxiosProgressEvent } from 'axios';

export async function createTutorial(
  formData: FormData,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<AdminTutorial> {
  const response = await apiClient.post<AdminTutorial>('/api/v1/admin/tutorials', formData, {
    timeout: 180000,
    onUploadProgress,
  });
  return response.data;
}

export async function updateTutorialMetadata(
  tutorialId: number,
  payload: AdminTutorialUpdatePayload
): Promise<AdminTutorial> {
  const response = await apiClient.patch<AdminTutorial>(
    `/api/v1/admin/tutorials/${tutorialId}`,
    payload
  );
  return response.data;
}

export async function replaceTutorialVideo(
  tutorialId: number,
  videoFile: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<AdminTutorial> {
  const formData = new FormData();
  formData.append('video', videoFile);
  const response = await apiClient.post<AdminTutorial>(
    `/api/v1/admin/tutorials/${tutorialId}/video`,
    formData,
    {
      timeout: 180000,
      onUploadProgress,
    }
  );
  return response.data;
}

export async function reorderTutorials(
  payload: AdminTutorialReorderPayload
): Promise<AdminTutorial[]> {
  const response = await apiClient.patch<AdminTutorial[]>(
    '/api/v1/admin/tutorials/reorder',
    payload
  );
  return response.data;
}

export async function deleteTutorial(tutorialId: number): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/api/v1/admin/tutorials/${tutorialId}`
  );
  return response.data;
}
