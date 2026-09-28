import { apiClient } from '@/services/apiClient';
import {
  ConversationDetailResponse,
  ConversationInviteItem,
  ConversationListResponse,
  ConversationMemberItem,
  CreateConversationFromOrderPayload,
  CreateConversationPayload,
  CreateDirectConversationPayload,
  GroupCreatePayload,
  GroupUpdatePayload,
  InviteCandidateListResponse,
  MessageItem,
  MessageListResponse,
  MessageReactionSummaryResponse,
  OfficialSupportGroupMetadata,
  OwnedGroupSummaryResponse,
  PendingApprovalActionPayload,
  PendingApprovalListResponse,
  PresenceBatchResponse,
  ReactionKey,
  SendMessagePayload,
  SharedAttachmentListResponse,
  SharedAttachmentSummary,
  UserSearchItem,
} from './types';

export async function createOrOpenConversation(
  payload: CreateConversationPayload
): Promise<ConversationDetailResponse> {
  const { data } = await apiClient.post<ConversationDetailResponse>(
    '/api/v1/conversations',
    payload
  );
  return data;
}

export async function createOrOpenDirectConversation(
  payload: CreateDirectConversationPayload
): Promise<ConversationDetailResponse> {
  const { data } = await apiClient.post<ConversationDetailResponse>(
    '/api/v1/conversations/direct',
    payload
  );
  return data;
}


export async function createConversationFromOrder(
  payload: CreateConversationFromOrderPayload
): Promise<ConversationDetailResponse> {
  const { data } = await apiClient.post<ConversationDetailResponse>(
    '/api/v1/conversations/from-order',
    payload
  );
  return data;
}

export async function createGroupConversation(
  payload: GroupCreatePayload
): Promise<ConversationDetailResponse> {
  const { data } = await apiClient.post<ConversationDetailResponse>(
    '/api/v1/conversations/groups',
    payload
  );
  return data;
}

export async function listGroupInvites(): Promise<ConversationInviteItem[]> {
  const { data } = await apiClient.get<ConversationInviteItem[]>(
    '/api/v1/conversations/invites'
  );
  return data;
}

export async function respondToGroupInvite(
  inviteId: number,
  action: 'ACCEPT' | 'DECLINE'
): Promise<{ success: boolean; status: string; requires_approval?: boolean }> {
  const { data } = await apiClient.post<{ success: boolean; status: string; requires_approval?: boolean }>(
    `/api/v1/conversations/invites/${inviteId}/respond`,
    { action }
  );
  return data;
}

export async function getOfficialSupportGroup(): Promise<OfficialSupportGroupMetadata> {
  const { data } = await apiClient.get<OfficialSupportGroupMetadata>(
    '/api/v1/conversations/official-support'
  );
  return data;
}

export async function joinOfficialSupportGroup(): Promise<{ conversation_id: number }> {
  const { data } = await apiClient.post<{ conversation_id: number }>(
    '/api/v1/conversations/official-support/join'
  );
  return data;
}


export async function getConversations(params?: {
  type?: string;
  limit?: number;
  cursor?: string | null;
}): Promise<ConversationListResponse> {
  const { data } = await apiClient.get<ConversationListResponse>(
    '/api/v1/conversations',
    { params }
  );
  return data;
}

export async function getConversation(
  conversationId: number
): Promise<ConversationDetailResponse> {
  const { data } = await apiClient.get<ConversationDetailResponse>(
    `/api/v1/conversations/${conversationId}`
  );
  return data;
}

export async function updateGroupMetadata(
  conversationId: number,
  payload: GroupUpdatePayload
): Promise<ConversationDetailResponse> {
  const { data } = await apiClient.patch<ConversationDetailResponse>(
    `/api/v1/conversations/groups/${conversationId}`,
    payload
  );
  return data;
}

export async function inviteMembersToGroup(
  conversationId: number,
  inviteeIds: number[]
): Promise<ConversationInviteItem[]> {
  const { data } = await apiClient.post<ConversationInviteItem[]>(
    `/api/v1/conversations/groups/${conversationId}/invites`,
    { invitee_ids: inviteeIds }
  );
  return data;
}

export async function listGroupMembers(
  conversationId: number
): Promise<ConversationMemberItem[]> {
  const { data } = await apiClient.get<ConversationMemberItem[]>(
    `/api/v1/conversations/groups/${conversationId}/members`
  );
  return data;
}

export async function updateGroupMemberNickname(
  conversationId: number,
  nickname: string | null
): Promise<ConversationMemberItem> {
  const { data } = await apiClient.patch<ConversationMemberItem>(
    `/api/v1/conversations/groups/${conversationId}/me/nickname`,
    { nickname }
  );
  return data;
}

export async function updateMemberRole(
  conversationId: number,
  userId: number,
  role: 'ADMIN' | 'MEMBER'
): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/api/v1/conversations/groups/${conversationId}/members/${userId}/role`,
    { role }
  );
  return data;
}

export async function transferGroupOwnership(
  conversationId: number,
  newOwnerId: number
): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/api/v1/conversations/groups/${conversationId}/transfer-ownership`,
    { new_owner_id: newOwnerId }
  );
  return data;
}

export async function removeGroupMember(
  conversationId: number,
  userId: number
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/api/v1/conversations/groups/${conversationId}/members/${userId}`
  );
  return data;
}

export async function leaveGroup(
  conversationId: number
): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/api/v1/conversations/groups/${conversationId}/leave`
  );
  return data;
}

export async function getMessages(
  conversationId: number,
  params?: { limit?: number; cursor?: string | null }
): Promise<MessageListResponse> {
  const { data } = await apiClient.get<MessageListResponse>(
    `/api/v1/conversations/${conversationId}/messages`,
    { params }
  );
  return data;
}

export async function sendMessage(
  conversationId: number,
  payload: SendMessagePayload
): Promise<MessageItem> {
  const formData = new FormData();
  if (payload.content !== undefined && payload.content !== null) {
    formData.append('content', payload.content);
  }
  if (payload.product_id !== undefined && payload.product_id !== null) {
    formData.append('product_id', String(payload.product_id));
  }
  if (payload.files && payload.files.length > 0) {
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
  }
  if (
    payload.voice_duration_ms !== undefined &&
    payload.voice_duration_ms !== null
  ) {
    formData.append('voice_duration_ms', String(payload.voice_duration_ms));
  }
  if (payload.mentions && payload.mentions.length > 0) {
    formData.append('mentions', JSON.stringify(payload.mentions));
  }
  if (
    payload.reply_to_message_id !== undefined &&
    payload.reply_to_message_id !== null
  ) {
    formData.append('reply_to_message_id', String(payload.reply_to_message_id));
  }

  const { data } = await apiClient.post<MessageItem>(
    `/api/v1/conversations/${conversationId}/messages`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data;
}

export async function getOwnedGroupCount(): Promise<OwnedGroupSummaryResponse> {
  const { data } = await apiClient.get<OwnedGroupSummaryResponse>(
    '/api/v1/conversations/owned-group-count'
  );
  return data;
}

export async function markConversationRead(
  conversationId: number
): Promise<{ success: boolean; read_count: number }> {
  const { data } = await apiClient.post<{ success: boolean; read_count: number }>(
    `/api/v1/conversations/${conversationId}/read`
  );
  return data;
}

export async function searchUsers(
  query: string,
  conversationId?: number
): Promise<UserSearchItem[]> {
  const { data } = await apiClient.get<UserSearchItem[]>('/api/v1/users/search', {
    params: {
      q: query,
      conversation_id: conversationId,
    },
  });
  return data;
}

export async function deleteGroup(
  conversationId: number
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/api/v1/conversations/groups/${conversationId}`
  );
  return data;
}

export async function getSharedAttachments(
  conversationId: number,
  params?: { kind?: string; limit?: number; cursor?: string | null }
): Promise<SharedAttachmentListResponse> {
  const { data } = await apiClient.get<SharedAttachmentListResponse>(
    `/api/v1/conversations/${conversationId}/attachments`,
    { params }
  );
  return data;
}

export async function getSharedAttachmentsSummary(
  conversationId: number
): Promise<SharedAttachmentSummary> {
  const { data } = await apiClient.get<SharedAttachmentSummary>(
    `/api/v1/conversations/${conversationId}/attachments/summary`
  );
  return data;
}

export async function getConversationPresence(
  conversationId: number
): Promise<PresenceBatchResponse> {
  const { data } = await apiClient.get<PresenceBatchResponse>(
    `/api/v1/conversations/${conversationId}/presence`
  );
  return data;
}

export async function getInviteCandidates(
  conversationId: number,
  params?: { q?: string; limit?: number }
): Promise<InviteCandidateListResponse> {
  const { data } = await apiClient.get<InviteCandidateListResponse>(
    `/api/v1/conversations/${conversationId}/invite-candidates`,
    { params }
  );
  return data;
}

export async function getGroupPendingApprovals(
  conversationId: number
): Promise<PendingApprovalListResponse> {
  const { data } = await apiClient.get<PendingApprovalListResponse>(
    `/api/v1/conversations/groups/${conversationId}/pending-approvals`
  );
  return data;
}

export async function processGroupPendingApproval(
  conversationId: number,
  inviteId: number,
  payload: PendingApprovalActionPayload
): Promise<{ success: boolean; status: string; already_active?: boolean }> {
  const { data } = await apiClient.post<{ success: boolean; status: string; already_active?: boolean }>(
    `/api/v1/conversations/groups/${conversationId}/pending-approvals/${inviteId}`,
    payload
  );
  return data;
}

export async function setMessageReaction(
  conversationId: number,
  messageId: number,
  reactionKey: ReactionKey
): Promise<MessageReactionSummaryResponse> {
  const { data } = await apiClient.put<MessageReactionSummaryResponse>(
    `/api/v1/conversations/${conversationId}/messages/${messageId}/reaction`,
    { reaction_key: reactionKey }
  );
  return data;
}

export async function removeMessageReaction(
  conversationId: number,
  messageId: number
): Promise<MessageReactionSummaryResponse> {
  const { data } = await apiClient.delete<MessageReactionSummaryResponse>(
    `/api/v1/conversations/${conversationId}/messages/${messageId}/reaction`
  );
  return data;
}

