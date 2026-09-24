export type CommunityMomentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PublicCommunityMomentItem {
  moment_id: number;
  image_url: string;
  note?: string | null;
  approved_at: string | null;
}

export interface PublicHeroResponse {
  items: PublicCommunityMomentItem[];
}

export interface CommunityMomentSubmissionResponse {
  moment_id: number;
  status: CommunityMomentStatus;
  created_at: string;
}

export interface AdminCommunityMomentUploader {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
}

export interface AdminCommunityMomentReviewer {
  user_id: number;
  full_name: string;
}

export interface AdminCommunityMomentItem {
  moment_id: number;
  image_url: string;
  thumbnail_url?: string | null;
  detail_image_url?: string | null;
  note?: string | null;
  status: CommunityMomentStatus;
  created_at: string;
  reviewed_at?: string | null;
  uploader: AdminCommunityMomentUploader;
  reviewer?: AdminCommunityMomentReviewer | null;
}

export interface AdminCommunityMomentCursorPage {
  items: AdminCommunityMomentItem[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface AdminCommunityMomentFilters {
  status?: CommunityMomentStatus;
  cursor?: string;
  limit?: number;
}

export interface CommunityMomentActionResponse {
  moment_id: number;
  status: string;
  message: string;
}
