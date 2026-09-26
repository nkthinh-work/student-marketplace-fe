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

export interface SupporterPublicIdentity {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  profile_path: string;
}

export interface SupporterLeaderboardItem {
  rank: number;
  supporter: SupporterPublicIdentity;
  total_amount_vnd: number;
  contribution_count: number;
  last_supported_at: string;
}

export interface SupporterLeaderboardResponse {
  items: SupporterLeaderboardItem[];
}

export interface AdminUserSafeIdentity {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
}

export interface AdminSupportContributionItem {
  contribution_id: number;
  supporter: AdminUserSafeIdentity;
  amount_vnd: number;
  is_public: boolean;
  received_at: string;
  transaction_ref?: string | null;
  admin_note?: string | null;
  recorded_by: AdminUserSafeIdentity;
  created_at: string;
}

export interface AdminSupportContributionCursorPage {
  items: AdminSupportContributionItem[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface AdminSupportContributionCreatePayload {
  supporter_id: number;
  amount_vnd: number;
  received_at: string;
  is_public: boolean;
  transaction_ref?: string | null;
  admin_note?: string | null;
}

export interface AdminSupportContributionVisibilityPayload {
  is_public: boolean;
}

export type SupportClaimStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface SupportClaimItem {
  claim_id: number;
  claimed_amount_vnd: number;
  claimed_transferred_at: string;
  sender_account_name?: string | null;
  wants_public: boolean;
  status: SupportClaimStatus;
  created_at: string;
}

export interface SupportClaimCreatePayload {
  claimed_amount_vnd: number;
  claimed_transferred_at: string;
  sender_account_name: string;
  wants_public: boolean;
}

export interface SupporterSearchResult {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  profile_path: string;
}

export interface SupportClaimUserListPage {
  items: SupportClaimItem[];
}

export interface AdminSupportClaimItem {
  claim_id: number;
  supporter: SupporterPublicIdentity;
  claimed_amount_vnd: number;
  claimed_transferred_at: string;
  sender_account_name?: string | null;
  wants_public: boolean;
  status: SupportClaimStatus;
  reviewed_by?: AdminUserSafeIdentity | null;
  reviewed_at?: string | null;
  contribution_id?: number | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface AdminSupportClaimCursorPage {
  items: AdminSupportClaimItem[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface AdminSupportClaimVerifyPayload {
  amount_vnd: number;
  received_at: string;
  transaction_ref?: string | null;
  admin_note?: string | null;
}

export interface AdminSupportClaimRejectPayload {
  rejection_reason?: string | null;
}
