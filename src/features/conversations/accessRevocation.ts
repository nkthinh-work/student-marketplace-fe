import { QueryClient } from '@tanstack/react-query';
import { matchPath, NavigateFunction } from 'react-router-dom';
import { conversationKeys } from './hooks';

// Track in-progress/executed revocations to ensure idempotency across WebSocket and REST fallback
const activeRevocations = new Set<number>();

export interface AccessRevocationOptions {
  conversationId: number;
  queryClient: QueryClient;
  navigate?: NavigateFunction;
  currentPath?: string;
  notice?: string;
}

/**
 * Centrally and idempotently handles revocation of group/conversation access:
 * 1. Prevents duplicate concurrent cleanups/navigations
 * 2. Cancels relevant in-flight queries so late responses cannot resurrect stale state
 * 3. Evicts protected conversation detail, messages, and member caches
 * 4. Removes conversation immediately from visible list cache
 * 5. Invalidates canonical list snapshot
 * 6. Replace-navigates away to /messages if the user is currently viewing that conversation
 */
export async function handleConversationAccessRevoked({
  conversationId,
  queryClient,
  navigate,
  currentPath,
  notice = 'Bạn đã bị xóa khỏi nhóm.',
}: AccessRevocationOptions): Promise<void> {
  if (!conversationId) return;

  // 1. Idempotency guard: prevent duplicate concurrent cleanups/navigations
  if (activeRevocations.has(conversationId)) {
    return;
  }
  activeRevocations.add(conversationId);

  // Auto-cleanup tracking after 5 seconds to avoid memory leak while protecting against immediate races
  setTimeout(() => {
    activeRevocations.delete(conversationId);
  }, 5000);

  try {
    // 2. Cancel in-flight queries first so late responses don't resurrect stale state
    await Promise.all([
      queryClient.cancelQueries({ queryKey: conversationKeys.detail(conversationId) }),
      queryClient.cancelQueries({ queryKey: conversationKeys.messageLists(conversationId) }),
      queryClient.cancelQueries({ queryKey: conversationKeys.members(conversationId) }),
      queryClient.cancelQueries({ queryKey: conversationKeys.pendingApprovals(conversationId) }),
    ]);

    // 3. Evict protected conversation caches
    queryClient.removeQueries({ queryKey: conversationKeys.detail(conversationId) });
    queryClient.removeQueries({ queryKey: conversationKeys.messageLists(conversationId) });
    queryClient.removeQueries({ queryKey: conversationKeys.members(conversationId) });
    queryClient.removeQueries({ queryKey: conversationKeys.pendingApprovals(conversationId) });

    // 4. Immediately remove conversation from visible conversation list cache
    queryClient.setQueriesData({ queryKey: conversationKeys.lists() }, (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: (page.items || []).filter(
            (item: any) => item.conversation_id !== conversationId
          ),
        })),
      };
    });

    // 5. Invalidate canonical list snapshot and owned group count
    queryClient.invalidateQueries({
      queryKey: conversationKeys.lists(),
      refetchType: 'active',
    });
    queryClient.invalidateQueries({
      queryKey: conversationKeys.ownedGroupCount(),
    });

    // 6. Navigate away with replace semantics if currently viewing that conversation
    if (navigate && currentPath) {
      const match = matchPath({ path: '/messages/:conversationId', end: true }, currentPath);
      const matchedId = match?.params.conversationId ? Number(match.params.conversationId) : null;

      if (matchedId === conversationId) {
        navigate('/messages', {
          replace: true,
          state: { notice },
        });
      }
    }
  } catch (err) {
    console.error('Error handling conversation access revocation:', err);
  }
}
