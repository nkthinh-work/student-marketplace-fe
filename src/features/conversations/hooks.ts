import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createConversationFromOrder,
  createGroupConversation,
  createOrOpenConversation,
  createOrOpenDirectConversation,
  deleteGroup,
  getConversation,
  getConversationPresence,
  getConversations,
  getGroupPendingApprovals,
  getInviteCandidates,
  getMessages,
  getOfficialSupportGroup,
  getOwnedGroupCount,
  getSharedAttachments,
  getSharedAttachmentsSummary,
  inviteMembersToGroup,
  joinOfficialSupportGroup,
  leaveGroup,
  listGroupInvites,
  listGroupMembers,
  markConversationRead,
  processGroupPendingApproval,
  removeGroupMember,
  removeMessageReaction,
  respondToGroupInvite,
  searchUsers,
  sendMessage,
  setMessageReaction,
  transferGroupOwnership,
  updateGroupMetadata,
  updateGroupMemberNickname,
  updateMemberRole,
} from './api';
import {
  ConversationDetailResponse,
  ConversationMemberItem,
  CreateConversationFromOrderPayload,
  CreateConversationPayload,
  CreateDirectConversationPayload,
  GroupCreatePayload,
  GroupUpdatePayload,
  MessageAttachment,
  MessageItem,
  MessageReactionSummaryResponse,
  ReactionKey,
  SendMessagePayload,
  SharedAttachmentSummary,
} from './types';
import { isAccessRevokedError } from '@/lib/apiErrors';
import { NOTIFICATION_QUERY_KEYS } from '../notifications/hooks';


export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...conversationKeys.lists(), params || {}] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: number) => [...conversationKeys.details(), id] as const,
  messageLists: (id: number) =>
    [...conversationKeys.detail(id), 'messages'] as const,
  messages: (id: number, params?: Record<string, unknown>) =>
    [...conversationKeys.messageLists(id), params || {}] as const,
  invites: () => [...conversationKeys.all, 'invites'] as const,
  members: (id: number) => [...conversationKeys.detail(id), 'members'] as const,
  attachments: (id: number, params?: Record<string, unknown>) =>
    [...conversationKeys.detail(id), 'attachments', params || {}] as const,
  attachmentSummary: (id: number) =>
    [...conversationKeys.detail(id), 'attachments-summary'] as const,
  presence: (id: number) => [...conversationKeys.detail(id), 'presence'] as const,
  inviteCandidates: (id: number, query?: string) =>
    [...conversationKeys.detail(id), 'invite-candidates', query || ''] as const,
  pendingApprovals: (id: number) =>
    [...conversationKeys.detail(id), 'pending-approvals'] as const,
  ownedGroupCount: () => [...conversationKeys.all, 'owned-group-count'] as const,
  usersSearch: (query: string, convId?: number) =>
    ['users', 'search', query, convId] as const,
};

export function useOwnedGroupCount() {
  return useQuery({
    queryKey: conversationKeys.ownedGroupCount(),
    queryFn: () => getOwnedGroupCount(),
    staleTime: 30 * 1000,
  });
}

export function useConversations(type?: string, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: conversationKeys.list({ type, limit }),
    queryFn: ({ pageParam }) =>
      getConversations({ type, limit, cursor: pageParam as string | null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useConversation(conversationId: number) {
  return useQuery({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: () => getConversation(conversationId),
    enabled: Boolean(conversationId),
    retry: (failureCount, error) => {
      if (isAccessRevokedError(error)) return false;
      return failureCount < 1;
    },
  });
}

export function useMessages(conversationId: number, limit: number = 30) {
  return useInfiniteQuery({
    queryKey: conversationKeys.messages(conversationId, { limit }),
    queryFn: ({ pageParam }) =>
      getMessages(conversationId, { limit, cursor: pageParam as string | null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: Boolean(conversationId),
    retry: (failureCount, error) => {
      if (isAccessRevokedError(error)) return false;
      return failureCount < 1;
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConversationPayload) =>
      createOrOpenConversation(payload),
    onSuccess: (data: ConversationDetailResponse) => {
      queryClient.setQueryData(
        conversationKeys.detail(data.conversation_id),
        data
      );
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.ownedGroupCount(),
      });
    },
  });
}

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDirectConversationPayload) =>
      createOrOpenDirectConversation(payload),
    onSuccess: (data: ConversationDetailResponse) => {
      queryClient.setQueryData(
        conversationKeys.detail(data.conversation_id),
        data
      );
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.ownedGroupCount(),
      });
    },
  });
}

export function useCreateConversationFromOrder() {

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConversationFromOrderPayload) =>
      createConversationFromOrder(payload),
    onSuccess: (data: ConversationDetailResponse) => {
      queryClient.setQueryData(
        conversationKeys.detail(data.conversation_id),
        data
      );
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
}

export function useCreateGroupConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GroupCreatePayload) =>
      createGroupConversation(payload),
    onSuccess: (data: ConversationDetailResponse) => {
      queryClient.setQueryData(
        conversationKeys.detail(data.conversation_id),
        data
      );
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.ownedGroupCount(),
      });
    },
  });
}

export function useGroupInvites() {
  return useQuery({
    queryKey: conversationKeys.invites(),
    queryFn: () => listGroupInvites(),
  });
}

export function useRespondGroupInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      inviteId,
      action,
    }: {
      inviteId: number;
      action: 'ACCEPT' | 'DECLINE';
    }) => respondToGroupInvite(inviteId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.invites() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

export function useOfficialSupportGroup() {
  return useQuery({
    queryKey: ['conversations', 'official-support'],
    queryFn: () => getOfficialSupportGroup(),
    staleTime: 30000,
    retry: 1,
  });
}

export function useJoinOfficialSupportGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => joinOfficialSupportGroup(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', 'official-support'],
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(data.conversation_id),
      });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

export function useGroupMembers(conversationId: number) {
  return useQuery({
    queryKey: conversationKeys.members(conversationId),
    queryFn: () => listGroupMembers(conversationId),
    enabled: Boolean(conversationId),
    retry: (failureCount, error) => {
      if (isAccessRevokedError(error)) return false;
      return failureCount < 1;
    },
  });
}

export function useUpdateGroupMemberNickname(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nickname: string | null) =>
      updateGroupMemberNickname(conversationId, nickname),
    onSuccess: (updatedMember) => {
      queryClient.setQueryData<ConversationMemberItem[]>(
        conversationKeys.members(conversationId),
        (old) => {
          if (!old) return old;
          return old.map((m) =>
            m.user_id === updatedMember.user_id
              ? { ...m, nickname: updatedMember.nickname }
              : m
          );
        }
      );
      queryClient.invalidateQueries({
        queryKey: conversationKeys.members(conversationId),
      });
    },
  });
}

export function useInviteGroupMembers(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteeIds: number[]) =>
      inviteMembersToGroup(conversationId, inviteeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.members(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.inviteCandidates(conversationId),
      });
    },
  });
}

export function useUpdateMemberRole(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: number;
      role: 'ADMIN' | 'MEMBER';
    }) => updateMemberRole(conversationId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.members(conversationId),
      });
    },
  });
}

export function useTransferGroupOwnership(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newOwnerId: number) =>
      transferGroupOwnership(conversationId, newOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.members(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    },
  });
}

export function useRemoveGroupMember(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) =>
      removeGroupMember(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.members(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    },
  });
}

export function useLeaveGroup(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveGroup(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.ownedGroupCount(),
      });
    },
  });
}

export function useUpdateGroupMetadata(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GroupUpdatePayload) =>
      updateGroupMetadata(conversationId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(
        conversationKeys.detail(conversationId),
        data
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      sendMessage(conversationId, payload),
    onSuccess: async (data: MessageItem) => {
      // Invalidate message lists prefix so all infinite query pages refresh
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messageLists(conversationId),
      });
      // Invalidate inbox list to update latest message preview and timestamp
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });

      // Synchronize attachment summary and attachment queries if message contains attachments
      if (data?.attachments && data.attachments.length > 0) {
        await applyConfirmedAttachmentDelta(queryClient, conversationId, data.attachments);
      }
    },
  });
}

export function useMarkConversationRead(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: (res) => {
      if (res.read_count > 0) {
        // Invalidate inbox list so unread counter updates immediately
        queryClient.invalidateQueries({
          queryKey: conversationKeys.lists(),
        });
        // Invalidate notifications so Bell badge and list refresh (since the conversation notification is marked read)
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.all,
        });
      }
    },
  });
}

export function useUserSearch(query: string, convId?: number) {
  return useQuery({
    queryKey: conversationKeys.usersSearch(query, convId),
    queryFn: () => searchUsers(query, convId),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useDeleteGroup(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteGroup(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.ownedGroupCount(),
      });
    },
  });
}

export function useSharedAttachments(
  conversationId: number,
  kind?: string,
  limit: number = 30
) {
  return useInfiniteQuery({
    queryKey: conversationKeys.attachments(conversationId, { kind, limit }),
    queryFn: ({ pageParam }) =>
      getSharedAttachments(conversationId, {
        kind,
        limit,
        cursor: pageParam as string | null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: Boolean(conversationId),
  });
}

export function useSharedAttachmentsSummary(conversationId: number) {
  return useQuery({
    queryKey: conversationKeys.attachmentSummary(conversationId),
    queryFn: () => getSharedAttachmentsSummary(conversationId),
    enabled: Boolean(conversationId),
    staleTime: 30 * 1000,
  });
}

/**
 * Synchronizes attachment summary and shared attachment queries
 * after a message with attachments is confirmed.
 *
 * Semantic ordering:
 * 1. Cancel in-flight attachmentSummary queries (protects against stale in-flight response overwriting delta).
 * 2. If old cached summary exists, apply confirmed delta immediately (zero-latency UI).
 * 3. Invalidate attachmentSummary (refetchType: 'active') to reconcile canonically with PostgreSQL.
 * 4. Invalidate attachments lists so active media panel refreshes.
 */
export async function applyConfirmedAttachmentDelta(
  queryClient: QueryClient,
  conversationId: number,
  attachments: MessageAttachment[]
) {
  if (!conversationId || !attachments || attachments.length === 0) return;

  let mediaDelta = 0;
  let audioDelta = 0;
  let fileDelta = 0;

  for (const att of attachments) {
    if (att.kind === 'IMAGE' || att.kind === 'VIDEO') {
      mediaDelta += 1;
    } else if (att.kind === 'AUDIO') {
      audioDelta += 1;
    } else if (att.kind === 'PDF' || att.kind === 'DOCUMENT') {
      fileDelta += 1;
    }
  }

  const summaryKey = conversationKeys.attachmentSummary(conversationId);

  // 1. Cancel in-flight summary queries to prevent stale server responses from overwriting delta
  await queryClient.cancelQueries({ queryKey: summaryKey });

  // 2. Apply delta only if cache exists; never initialize an unknown summary as zero
  queryClient.setQueryData<SharedAttachmentSummary>(summaryKey, (old) => {
    if (!old) return old;
    return {
      media_count: (old.media_count || 0) + mediaDelta,
      audio_count: (old.audio_count || 0) + audioDelta,
      file_count: (old.file_count || 0) + fileDelta,
    };
  });

  // 3. Invalidate to reconcile with canonical backend PostgreSQL snapshot
  queryClient.invalidateQueries({
    queryKey: summaryKey,
    refetchType: 'active',
  });

  // 4. Invalidate shared attachment collection so open media drawer displays the new item
  queryClient.invalidateQueries({
    queryKey: [...conversationKeys.detail(conversationId), 'attachments'],
  });
}

/**
 * Canonically invalidates attachment summary and attachment list queries.
 */
export function invalidateAttachmentCaches(
  queryClient: QueryClient,
  conversationId: number
) {
  if (!conversationId) return;
  queryClient.invalidateQueries({
    queryKey: conversationKeys.attachmentSummary(conversationId),
  });
  queryClient.invalidateQueries({
    queryKey: [...conversationKeys.detail(conversationId), 'attachments'],
  });
}

export function useConversationPresence(conversationId: number) {
  return useQuery({
    queryKey: conversationKeys.presence(conversationId),
    queryFn: () => getConversationPresence(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 30 * 1000,
  });
}

export function useInviteCandidates(conversationId: number, query?: string) {
  return useQuery({
    queryKey: conversationKeys.inviteCandidates(conversationId, query),
    queryFn: () => getInviteCandidates(conversationId, { q: query }),
    enabled: Boolean(conversationId),
    staleTime: 10 * 1000,
  });
}

export function useGroupPendingApprovals(
  conversationId: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: conversationKeys.pendingApprovals(conversationId),
    queryFn: () => getGroupPendingApprovals(conversationId),
    enabled: enabled && Boolean(conversationId),
  });
}

export function useProcessGroupPendingApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      inviteId,
      action,
    }: {
      conversationId: number;
      inviteId: number;
      action: 'APPROVE' | 'REJECT';
    }) => processGroupPendingApproval(conversationId, inviteId, { action }),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.pendingApprovals(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.members(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    },
  });
}

export function useSetMessageReaction(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      reactionKey,
    }: {
      messageId: number;
      reactionKey: ReactionKey;
    }) => setMessageReaction(conversationId, messageId, reactionKey),
    onMutate: async ({ messageId, reactionKey }) => {
      await queryClient.cancelQueries({
        queryKey: conversationKeys.messageLists(conversationId),
      });

      const previousData = queryClient.getQueryData(
        conversationKeys.messages(conversationId, { limit: 30 })
      );

      queryClient.setQueriesData(
        { queryKey: conversationKeys.messageLists(conversationId) },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: (page.items || []).map((msg: MessageItem) => {
                if (msg.message_id !== messageId) return msg;

                const prevMyReaction = msg.my_reaction;
                let newReactions = [...(msg.reactions || [])];

                // Decrement previous if different
                if (prevMyReaction && prevMyReaction !== reactionKey) {
                  newReactions = newReactions
                    .map((r) =>
                      r.reaction_key === prevMyReaction
                        ? { ...r, count: r.count - 1 }
                        : r
                    )
                    .filter((r) => r.count > 0);
                }

                // Add or increment new
                if (prevMyReaction !== reactionKey) {
                  const existing = newReactions.find(
                    (r) => r.reaction_key === reactionKey
                  );
                  if (existing) {
                    newReactions = newReactions.map((r) =>
                      r.reaction_key === reactionKey
                        ? { ...r, count: r.count + 1 }
                        : r
                    );
                  } else {
                    newReactions.push({
                      reaction_key: reactionKey,
                      count: 1,
                    });
                  }
                }

                return {
                  ...msg,
                  reactions: newReactions,
                  my_reaction: reactionKey,
                };
              }),
            })),
          };
        }
      );

      return { previousData };
    },
    onSuccess: (data: MessageReactionSummaryResponse) => {
      queryClient.setQueriesData(
        { queryKey: conversationKeys.messageLists(conversationId) },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: (page.items || []).map((msg: MessageItem) => {
                if (msg.message_id !== data.message_id) return msg;
                return {
                  ...msg,
                  reactions: data.reactions,
                  my_reaction: data.my_reaction,
                };
              }),
            })),
          };
        }
      );

      queryClient.invalidateQueries({
        queryKey: conversationKeys.messageLists(conversationId),
        refetchType: 'active',
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          conversationKeys.messages(conversationId, { limit: 30 }),
          context.previousData
        );
      }
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messageLists(conversationId),
      });
    },
  });
}

export function useRemoveMessageReaction(conversationId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: number }) =>
      removeMessageReaction(conversationId, messageId),
    onMutate: async ({ messageId }) => {
      await queryClient.cancelQueries({
        queryKey: conversationKeys.messageLists(conversationId),
      });

      const previousData = queryClient.getQueryData(
        conversationKeys.messages(conversationId, { limit: 30 })
      );

      queryClient.setQueriesData(
        { queryKey: conversationKeys.messageLists(conversationId) },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: (page.items || []).map((msg: MessageItem) => {
                if (msg.message_id !== messageId) return msg;

                const prevMyReaction = msg.my_reaction;
                let newReactions = [...(msg.reactions || [])];

                if (prevMyReaction) {
                  newReactions = newReactions
                    .map((r) =>
                      r.reaction_key === prevMyReaction
                        ? { ...r, count: r.count - 1 }
                        : r
                    )
                    .filter((r) => r.count > 0);
                }

                return {
                  ...msg,
                  reactions: newReactions,
                  my_reaction: null,
                };
              }),
            })),
          };
        }
      );

      return { previousData };
    },
    onSuccess: (data: MessageReactionSummaryResponse) => {
      queryClient.setQueriesData(
        { queryKey: conversationKeys.messageLists(conversationId) },
        (oldData: any) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: (page.items || []).map((msg: MessageItem) => {
                if (msg.message_id !== data.message_id) return msg;
                return {
                  ...msg,
                  reactions: data.reactions,
                  my_reaction: data.my_reaction,
                };
              }),
            })),
          };
        }
      );

      queryClient.invalidateQueries({
        queryKey: conversationKeys.messageLists(conversationId),
        refetchType: 'active',
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          conversationKeys.messages(conversationId, { limit: 30 }),
          context.previousData
        );
      }
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messageLists(conversationId),
      });
    },
  });
}


