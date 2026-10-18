export interface PublicTutorial {
  tutorial_id: number;
  feature_key: string;
  title: string;
  description?: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  duration_ms?: number | null;
  action_key?: string | null;
  sort_order: number;
}

export interface AdminTutorial {
  tutorial_id: number;
  feature_key: string;
  title: string;
  description?: string | null;
  video_url: string;
  video_storage_key: string;
  video_mime_type: string;
  video_size_bytes: number;
  duration_ms?: number | null;
  thumbnail_url?: string | null;
  action_key?: string | null;
  sort_order: number;
  is_published: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AdminTutorialUpdatePayload {
  feature_key?: string;
  title?: string;
  description?: string | null;
  action_key?: string | null;
  is_published?: boolean;
}

export interface AdminTutorialReorderPayload {
  feature_key: string;
  tutorial_ids: number[];
}

export const MAX_TUTORIAL_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export interface TutorialUploadSignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
  public_id: string;
  overwrite?: string;
  upload_session_id: string;
}

export interface CloudinaryDirectUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
}

export interface AdminTutorialConfirmDirectPayload {
  public_id: string;
  upload_session_id: string;
  secure_url?: string;
  video_size_bytes?: number;
  duration_ms?: number;
}

export interface AdminTutorialCreateDirectPayload {
  feature_key: string;
  title: string;
  description?: string | null;
  action_key?: string | null;
  is_published?: boolean;
  public_id: string;
  upload_session_id: string;
  secure_url?: string;
  video_size_bytes?: number;
  duration_ms?: number;
}

export type DirectUploadProgressStage =
  | 'REQUESTING_SIGNATURE'
  | 'UPLOADING_CLOUDINARY'
  | 'VERIFYING_BACKEND'
  | 'COMPLETED';

export interface DirectUploadProgressEvent {
  stage: DirectUploadProgressStage;
  percent: number;
  currentChunk?: number;
  totalChunks?: number;
  loadedBytes?: number;
  totalBytes?: number;
}
