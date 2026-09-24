export interface FeedbackAttachment {
  attachment_id: number;
  kind: 'IMAGE' | 'VIDEO';
  mime_type: string;
  size_bytes: number;
  duration_ms?: number | null;
  stream_url?: string;
}

export interface FeedbackCreateResponse {
  feedback_id: number;
  content: string;
  created_at: string;
  attachments: FeedbackAttachment[];
}

export interface PublicFeedbackItem {
  feedback_id: number;
  content: string;
  created_at: string;
}

export interface PublicFeedbackCursorPage {
  items: PublicFeedbackItem[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface MyFeedbackItem {
  feedback_id: number;
  content: string;
  created_at: string;
  attachments: FeedbackAttachment[];
}

export interface MyFeedbackCursorPage {
  items: MyFeedbackItem[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface AdminFeedbackSender {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
}

export interface AdminFeedbackListItem {
  feedback_id: number;
  sender: AdminFeedbackSender;
  content: string;
  created_at: string;
  image_count: number;
  video_count: number;
}

export interface AdminFeedbackListPage {
  items: AdminFeedbackListItem[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface AdminFeedbackDetail {
  feedback_id: number;
  sender: AdminFeedbackSender;
  content: string;
  created_at: string;
  attachments: FeedbackAttachment[];
}

export interface CreatorPublicInfo {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  title?: string;
}

export interface SupportResponse {
  creator?: CreatorPublicInfo | null;
  profile_path?: string | null;
  fixed_qr_url?: string;
  support_message?: string;
}
