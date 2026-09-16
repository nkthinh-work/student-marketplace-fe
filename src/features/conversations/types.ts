export type ConversationType = 'DIRECT' | 'GROUP' | 'COMMUNITY';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type InviteStatus = 'PENDING' | 'PENDING_APPROVAL' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'PRODUCT_CARD' | 'ORDER_CARD' | 'SYSTEM';

export interface ParticipantSummary {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
}

export interface UserSearchItem {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
}

export interface ProductContextSummary {
  product_id: number;
  title: string;
  price: number | string;
  status: string;
  thumbnail_url: string | null;
  listing_type: string;
}

export interface MessageAttachment {
  attachment_id: number;
  kind: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT';
  url: string;
  mime_type: string;
  original_name: string;
  size_bytes: number;
  duration_ms?: number | null;
}

export interface MessageMentionItem {
  mention_id: number;
  message_id: number;
  mentioned_user_id: number;
  display_text: string;
  start_offset: number;
  end_offset: number;
  created_at: string;
}

export interface MessageMentionInput {
  mentioned_user_id: number;
  display_text: string;
  start_offset: number;
  end_offset: number;
}

export type ReactionKey =
  | 'THICH'
  | 'HAHA'
  | 'WOW'
  | 'CAM_ON'
  | 'CHOT_DEAL'
  | 'UY_TIN'
  | 'DANG_TOI'
  | 'DOI_CHUT'
  | 'QUAN_TAM'
  | 'HET_TIEN'
  | 'HOC_BAI'
  | 'KHA_NGHI';

export interface ReactionAggregateItem {
  reaction_key: ReactionKey;
  count: number;
}

export interface MessageReactionSummaryResponse {
  message_id: number;
  reactions: ReactionAggregateItem[];
  my_reaction?: ReactionKey | null;
}

export interface MessageItem {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string | null;
  sender_avatar?: string | null;
  type?: MessageType;
  content: string | null;
  product_id?: number | null;
  product?: ProductContextSummary | null;
  sent_at: string;
  is_mine?: boolean;
  attachments?: MessageAttachment[];
  mentions?: MessageMentionItem[];
  reactions?: ReactionAggregateItem[];
  my_reaction?: ReactionKey | null;
}

export interface ConversationMemberItem {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
  role: MemberRole;
  joined_at: string;
  is_online?: boolean;
  nickname?: string | null;
}

export interface SharedAttachmentItem {
  attachment_id: number;
  message_id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string | null;
  kind: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT';
  url: string;
  mime_type: string;
  original_name: string;
  size_bytes: number;
  duration_ms?: number | null;
  created_at: string;
}

export interface SharedAttachmentListResponse {
  items: SharedAttachmentItem[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface SharedAttachmentSummary {
  media_count: number;
  audio_count: number;
  file_count: number;
}

export interface PresenceBatchResponse {
  presence_available: boolean;
  online_user_ids: number[];
}

export interface InviteCandidateItem {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
  last_interaction_at?: string | null;
}

export interface InviteCandidateListResponse {
  items: InviteCandidateItem[];
}

export interface ConversationInviteItem {
  invite_id: number;
  conversation_id: number;
  conversation_title: string;
  inviter_id: number;
  inviter_name: string;
  inviter_avatar: string | null;
  status: InviteStatus;
  created_at: string;
}

export interface ConversationSummary {
  conversation_id: number;
  type: ConversationType;
  title?: string | null;
  avatar_url?: string | null;
  other_participant?: ParticipantSummary | null;
  member_count?: number | null;
  my_role?: MemberRole | null;
  is_joined?: boolean | null;
  product_context?: ProductContextSummary | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

export interface ConversationListResponse {
  items: ConversationSummary[];
  next_cursor: string | null;
  has_more: boolean;
  owned_group_count?: number;
}

export interface OwnedGroupSummaryResponse {
  owned_group_count: number;
}

export interface ConversationDetailResponse {
  conversation_id: number;
  type: ConversationType;
  title?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  other_participant?: ParticipantSummary | null;
  member_count?: number | null;
  my_role?: MemberRole | null;
  is_joined?: boolean | null;
  product_context?: ProductContextSummary | null;
  created_at: string;
  requires_approval?: boolean;
}

export interface PendingApprovalItem {
  invite_id: number;
  conversation_id: number;
  invitee_id: number;
  invitee_name: string;
  invitee_avatar: string | null;
  inviter_id: number;
  inviter_name: string;
  inviter_avatar: string | null;
  created_at: string;
  responded_at?: string | null;
}

export interface PendingApprovalListResponse {
  items: PendingApprovalItem[];
}

export interface PendingApprovalActionPayload {
  action: 'APPROVE' | 'REJECT';
}

export interface MessageListResponse {
  items: MessageItem[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CreateConversationPayload {
  product_id: number;
}

export interface CreateDirectConversationPayload {
  recipient_user_id: number;
}

export interface CreateConversationFromOrderPayload {
  order_id: number;
}


export interface GroupCreatePayload {
  title: string;
  description?: string;
  initial_invitee_ids?: number[];
}

export interface GroupUpdatePayload {
  title?: string;
  description?: string;
  requires_approval?: boolean;
}

export interface SendMessagePayload {
  content?: string | null;
  product_id?: number | null;
  files?: File[];
  voice_duration_ms?: number | null;
  mentions?: MessageMentionInput[];
}
