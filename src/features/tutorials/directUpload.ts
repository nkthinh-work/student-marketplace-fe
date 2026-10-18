import axios from 'axios';
import { apiClient } from '@/services/apiClient';
import type {
  AdminTutorial,
  AdminTutorialConfirmDirectPayload,
  AdminTutorialCreateDirectPayload,
  CloudinaryDirectUploadResult,
  DirectUploadProgressEvent,
  TutorialUploadSignature,
} from './types';

// Cloudinary requires chunk size >= 5 MB for chunked upload (except the last chunk)
const CHUNK_SIZE_BYTES = 6 * 1024 * 1024; // 6 MB per chunk

/**
 * Request an authenticated signed upload signature from backend for Admin.
 * Does not expose Cloudinary API Secret to the browser.
 */
export async function getTutorialUploadSignature(): Promise<TutorialUploadSignature> {
  const response = await apiClient.post<TutorialUploadSignature>(
    '/api/v1/admin/tutorials/upload-signature'
  );
  return response.data;
}

/**
 * Upload a single chunk to Cloudinary with automatic retry on network glitches.
 * Uses vanilla Axios instance to avoid injecting Firebase Bearer tokens into Cloudinary.
 */
async function uploadChunkWithRetry(
  url: string,
  formData: FormData,
  headers: Record<string, string>,
  onChunkProgress?: (loaded: number, total: number) => void,
  maxRetries = 3
): Promise<any> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      const response = await axios.post(url, formData, {
        headers,
        timeout: 90000, // 90s per 6 MB chunk is ample even for 70 KB/s
        onUploadProgress: (progressEvent) => {
          if (onChunkProgress && progressEvent.total) {
            onChunkProgress(progressEvent.loaded, progressEvent.total);
          }
        },
      });
      return response.data;
    } catch (err: any) {
      lastError = err;
      attempt++;
      if (attempt >= maxRetries) {
        break;
      }
      // Exponential backoff before retry (1s, 2s, 4s)
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  const status = lastError?.response?.status;
  const detail = lastError?.response?.data?.error?.message || lastError?.message;
  const statusInfo = status ? ` (HTTP ${status})` : '';
  throw new Error(
    `Tải video lên Cloudinary gián đoạn${statusInfo}: ${detail || 'mất kết nối mạng'}. Vui lòng thử lại.`
  );
}

/**
 * Performs Signed Direct-to-Cloudinary Chunked Upload for tutorial video.
 * Bypasses Railway backend for heavy media transfer, uploading directly to Cloudinary edge CDN.
 */
export async function uploadVideoDirectToCloudinary({
  file,
  signatureData,
  onProgress,
}: {
  file: File;
  signatureData: TutorialUploadSignature;
  onProgress?: (event: DirectUploadProgressEvent) => void;
}): Promise<CloudinaryDirectUploadResult> {
  const totalBytes = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_SIZE_BYTES));
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/video/upload`;

  let uploadedBytesBeforeCurrentChunk = 0;
  let finalResponseData: any = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE_BYTES;
    const end = Math.min(totalBytes, (chunkIndex + 1) * CHUNK_SIZE_BYTES);
    const chunkBlob = file.slice(start, end, 'video/mp4');

    const formData = new FormData();
    formData.append('file', chunkBlob);
    formData.append('api_key', signatureData.api_key);
    formData.append('timestamp', String(signatureData.timestamp));
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);
    if (signatureData.public_id) {
      formData.append('public_id', signatureData.public_id);
    }
    if (signatureData.overwrite) {
      formData.append('overwrite', signatureData.overwrite);
    }

    const headers: Record<string, string> = {
      'X-Unique-Upload-Id': signatureData.upload_session_id,
      'Content-Range': `bytes ${start}-${end - 1}/${totalBytes}`,
    };

    finalResponseData = await uploadChunkWithRetry(
      uploadUrl,
      formData,
      headers,
      (chunkLoaded) => {
        const currentTotalLoaded = uploadedBytesBeforeCurrentChunk + chunkLoaded;
        const percent = Math.min(99, Math.round((currentTotalLoaded * 100) / totalBytes));
        if (onProgress) {
          onProgress({
            stage: 'UPLOADING_CLOUDINARY',
            percent,
            currentChunk: chunkIndex + 1,
            totalChunks,
            loadedBytes: currentTotalLoaded,
            totalBytes,
          });
        }
      }
    );

    uploadedBytesBeforeCurrentChunk += end - start;
  }

  if (!finalResponseData || !finalResponseData.public_id) {
    throw new Error('Cloudinary không trả về thông tin tệp video hoàn chỉnh sau khi tải lên.');
  }

  return {
    public_id: finalResponseData.public_id,
    secure_url: finalResponseData.secure_url || finalResponseData.url,
    bytes: finalResponseData.bytes || totalBytes,
    duration: finalResponseData.duration,
    width: finalResponseData.width,
    height: finalResponseData.height,
    format: finalResponseData.format,
    resource_type: finalResponseData.resource_type,
  };
}

/**
 * Full end-to-end Direct Video Replacement:
 * 1. Request signature from backend.
 * 2. Upload chunked video directly to Cloudinary.
 * 3. Confirm with backend to verify metadata and atomically commit DB.
 */
export async function replaceTutorialVideoDirect({
  tutorialId,
  file,
  onProgress,
}: {
  tutorialId: number;
  file: File;
  onProgress?: (event: DirectUploadProgressEvent) => void;
}): Promise<AdminTutorial> {
  // Stage 1: Request signature
  if (onProgress) {
    onProgress({ stage: 'REQUESTING_SIGNATURE', percent: 0 });
  }
  const signatureData = await getTutorialUploadSignature();

  // Stage 2: Direct Chunked Upload to Cloudinary
  const cloudinaryResult = await uploadVideoDirectToCloudinary({
    file,
    signatureData,
    onProgress,
  });

  // Stage 3: Authoritative Verification & DB Commit on Backend
  if (onProgress) {
    onProgress({ stage: 'VERIFYING_BACKEND', percent: 100 });
  }

  const confirmPayload: AdminTutorialConfirmDirectPayload = {
    public_id: cloudinaryResult.public_id,
    upload_session_id: signatureData.upload_session_id,
    secure_url: cloudinaryResult.secure_url,
    video_size_bytes: cloudinaryResult.bytes,
    duration_ms: cloudinaryResult.duration ? Math.round(cloudinaryResult.duration * 1000) : undefined,
  };

  const response = await apiClient.post<AdminTutorial>(
    `/api/v1/admin/tutorials/${tutorialId}/confirm-direct-video`,
    confirmPayload
  );

  if (onProgress) {
    onProgress({ stage: 'COMPLETED', percent: 100 });
  }

  return response.data;
}

/**
 * Full end-to-end Direct Video Tutorial Creation:
 * 1. Request signature from backend.
 * 2. Upload chunked video directly to Cloudinary.
 * 3. Create tutorial on backend with metadata and atomically commit DB.
 */
export async function createTutorialDirect({
  payload,
  file,
  onProgress,
}: {
  payload: Omit<AdminTutorialCreateDirectPayload, 'public_id' | 'upload_session_id'>;
  file: File;
  onProgress?: (event: DirectUploadProgressEvent) => void;
}): Promise<AdminTutorial> {
  if (onProgress) {
    onProgress({ stage: 'REQUESTING_SIGNATURE', percent: 0 });
  }
  const signatureData = await getTutorialUploadSignature();

  const cloudinaryResult = await uploadVideoDirectToCloudinary({
    file,
    signatureData,
    onProgress,
  });

  if (onProgress) {
    onProgress({ stage: 'VERIFYING_BACKEND', percent: 100 });
  }

  const createPayload: AdminTutorialCreateDirectPayload = {
    ...payload,
    public_id: cloudinaryResult.public_id,
    upload_session_id: signatureData.upload_session_id,
    secure_url: cloudinaryResult.secure_url,
    video_size_bytes: cloudinaryResult.bytes,
    duration_ms: cloudinaryResult.duration ? Math.round(cloudinaryResult.duration * 1000) : undefined,
  };

  const response = await apiClient.post<AdminTutorial>(
    '/api/v1/admin/tutorials/create-direct',
    createPayload
  );

  if (onProgress) {
    onProgress({ stage: 'COMPLETED', percent: 100 });
  }

  return response.data;
}
