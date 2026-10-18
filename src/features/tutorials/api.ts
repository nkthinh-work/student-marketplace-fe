import { apiClient } from '@/services/apiClient';
import type {
  AdminTutorial,
  AdminTutorialReorderPayload,
  AdminTutorialUpdatePayload,
  DirectUploadProgressEvent,
  PublicTutorial,
} from './types';
import {
  createTutorialDirect,
  getTutorialUploadSignature,
  replaceTutorialVideoDirect,
  uploadVideoDirectToCloudinary,
} from './directUpload';
import type { AxiosProgressEvent } from 'axios';

export {
  createTutorialDirect,
  getTutorialUploadSignature,
  replaceTutorialVideoDirect,
  uploadVideoDirectToCloudinary,
};

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

export async function createTutorial(
  formData: FormData,
  onUploadProgress?: (progressEvent: AxiosProgressEvent | DirectUploadProgressEvent) => void
): Promise<AdminTutorial> {
  const videoFile = formData.get('video') as File | null;
  const featureKey = String(formData.get('feature_key') || '');
  const title = String(formData.get('title') || '');
  const description = formData.get('description') ? String(formData.get('description')) : null;
  const actionKey = formData.get('action_key') ? String(formData.get('action_key')) : null;
  const isPublished = formData.get('is_published') === 'true';

  // Use Signed Direct Chunked Upload for reliable mobile/large file upload
  if (videoFile instanceof File) {
    try {
      return await createTutorialDirect({
        payload: {
          feature_key: featureKey,
          title,
          description,
          action_key: actionKey,
          is_published: isPublished,
        },
        file: videoFile,
        onProgress: (event) => {
          if (onUploadProgress) {
            onUploadProgress(event as any);
          }
        },
      });
    } catch (err) {
      console.warn('Direct tutorial creation error, attempting legacy multipart upload:', err);
    }
  }

  const response = await apiClient.post<AdminTutorial>('/api/v1/admin/tutorials', formData, {
    timeout: 180000,
    onUploadProgress: (e) => {
      if (onUploadProgress) onUploadProgress(e);
    },
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
  onUploadProgress?: (progressEvent: AxiosProgressEvent | DirectUploadProgressEvent) => void
): Promise<AdminTutorial> {
  // Use Signed Direct-to-Cloudinary Chunked Upload for reliable mobile uploads
  try {
    return await replaceTutorialVideoDirect({
      tutorialId,
      file: videoFile,
      onProgress: (event) => {
        if (onUploadProgress) {
          onUploadProgress(event as any);
        }
      },
    });
  } catch (err: any) {
    console.warn('Direct video replacement encountered error, attempting legacy multipart fallback:', err);
    const formData = new FormData();
    formData.append('video', videoFile);
    const response = await apiClient.post<AdminTutorial>(
      `/api/v1/admin/tutorials/${tutorialId}/video`,
      formData,
      {
        timeout: 180000,
        onUploadProgress: (e) => {
          if (onUploadProgress) onUploadProgress(e);
        },
      }
    );
    return response.data;
  }
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
