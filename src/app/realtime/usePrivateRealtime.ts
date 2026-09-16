import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ORDER_QUERY_KEYS } from '@/features/orders/hooks';
import { AUCTION_QUERY_KEYS } from '@/features/auctions/hooks';
import { conversationKeys, invalidateAttachmentCaches } from '@/features/conversations/hooks';
import { handleConversationAccessRevoked } from '@/features/conversations/accessRevocation';
import { useCurrentUser } from '@/features/users/hooks';
import { NOTIFICATION_QUERY_KEYS } from '@/features/notifications/hooks';

export interface PrivateRealtimeEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'AUCTION_WINNER_CHECKED_OUT' | 'MESSAGE_CREATED' | string;
  order_id?: number;
  auction_id?: number;
  conversation_id?: number;
  message_id?: number;
  sender_id?: number;
  reason?: string;
  action?: string;
  [key: string]: unknown;
}

export function usePrivateRealtime() {
  const { firebaseUser, initializing } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  const { data: currentUser } = useCurrentUser();
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const attemptRef = useRef<number>(0);
  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    // If still initializing auth or not logged in, ensure socket is closed
    if (initializing || !firebaseUser) {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
      currentUidRef.current = null;
      return;
    }

    const currentUser = firebaseUser;
    const uid = currentUser.uid;
    currentUidRef.current = uid;
    let isMounted = true;

    // Resolve base WebSocket URL
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    let wsBaseUrl = import.meta.env.VITE_WS_URL;
    if (!wsBaseUrl) {
      const isHttps = apiBase.startsWith('https:') || window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      let host = apiBase.replace(/^https?:\/\//, '');
      if (host.includes(':3000')) {
        host = 'localhost:8000';
      }
      wsBaseUrl = `${wsProtocol}//${host}`;
    }

    function cleanupSocket() {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (!isMounted || currentUidRef.current !== uid) return;
      const delay = Math.min(1000 * Math.pow(2, attemptRef.current), 30000);
      attemptRef.current += 1;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (!isMounted || currentUidRef.current !== uid) return;
        // Reconcile state
        queryClient.invalidateQueries({
          queryKey: ORDER_QUERY_KEYS.all,
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: conversationKeys.lists(),
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.all,
          refetchType: 'active',
        });
        connect();
      }, delay);
    }

    async function connect() {
      if (!isMounted || currentUidRef.current !== uid) return;
      cleanupSocket();

      try {
        const token = await currentUser.getIdToken();
        if (!isMounted || currentUidRef.current !== uid) return;

        const wsUrl = `${wsBaseUrl}/ws/me?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted || currentUidRef.current !== uid) {
            ws.close();
            return;
          }
          attemptRef.current = 0; // Reset backoff
          pingIntervalRef.current = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          if (event.data === 'pong') return;
          try {
            const data: PrivateRealtimeEvent = JSON.parse(event.data);

            if (data.type === 'ORDER_UPDATED') {
              if (data.order_id) {
                queryClient.invalidateQueries({
                  queryKey: ORDER_QUERY_KEYS.detail(data.order_id),
                });
              }
              queryClient.invalidateQueries({
                queryKey: ORDER_QUERY_KEYS.all,
                refetchType: 'active',
              });
            } else if (data.type === 'ORDER_CREATED') {
              queryClient.invalidateQueries({
                queryKey: ORDER_QUERY_KEYS.all,
                refetchType: 'active',
              });
            } else if (data.type === 'AUCTION_WINNER_CHECKED_OUT') {
              if (data.auction_id) {
                queryClient.invalidateQueries({
                  queryKey: AUCTION_QUERY_KEYS.detail(data.auction_id),
                });
              }
              queryClient.invalidateQueries({
                queryKey: AUCTION_QUERY_KEYS.all,
                refetchType: 'active',
              });
              queryClient.invalidateQueries({
                queryKey: ORDER_QUERY_KEYS.all,
                refetchType: 'active',
              });
              queryClient.invalidateQueries({
                queryKey: ['products'],
                refetchType: 'active',
              });
            } else if (data.type === 'MESSAGE_CREATED') {
              if (data.conversation_id) {
                queryClient.invalidateQueries({
                  queryKey: conversationKeys.messageLists(data.conversation_id),
                  refetchType: 'active',
                });

                // Only synchronize attachment caches for remote messages.
                // Sender already handled their own message in useSendMessage mutation,
                // preventing double-counting and redundant refetches on self-echo.
                const currentUserId = currentUserRef.current?.user_id;
                const isSelfEcho = Boolean(
                  currentUserId && data.sender_id === currentUserId
                );
                if (!isSelfEcho) {
                  if (data.has_attachments !== false) {
                    invalidateAttachmentCaches(queryClient, data.conversation_id);
                  }
                }
              }
              queryClient.invalidateQueries({
                queryKey: conversationKeys.lists(),
                refetchType: 'active',
              });
            } else if (data.type === 'GROUP_MEMBERSHIP_CHANGED') {
              const convId = data.conversation_id;
              const action = data.action;

              if (convId && (action === 'REMOVED' || action === 'LEFT')) {
                const notice =
                  action === 'REMOVED'
                    ? 'Bạn đã bị xóa khỏi nhóm.'
                    : 'Bạn đã rời khỏi nhóm.';

                handleConversationAccessRevoked({
                  conversationId: convId,
                  queryClient,
                  navigate,
                  currentPath: locationRef.current.pathname,
                  notice,
                });
              } else if (convId && action === 'NICKNAME_UPDATED') {
                // Display refresh only: invalidate group members query without affecting conversation access or navigation
                queryClient.invalidateQueries({
                  queryKey: conversationKeys.members(convId),
                  refetchType: 'active',
                });
              } else {
                // Non-revocation events: role changes, member joined, someone else removed/left
                if (convId) {
                  queryClient.invalidateQueries({
                    queryKey: conversationKeys.members(convId),
                    refetchType: 'active',
                  });
                  queryClient.invalidateQueries({
                    queryKey: conversationKeys.detail(convId),
                    refetchType: 'active',
                  });
                  queryClient.invalidateQueries({
                    queryKey: conversationKeys.pendingApprovals(convId),
                    refetchType: 'active',
                  });
                }
                queryClient.invalidateQueries({
                  queryKey: conversationKeys.lists(),
                  refetchType: 'active',
                });
              }
            } else if (data.type === 'GROUP_INVITE_UPDATED' || data.type === 'GROUP_INVITE_CREATED') {
              queryClient.invalidateQueries({
                queryKey: conversationKeys.invites(),
                refetchType: 'active',
              });
              if (data.conversation_id) {
                queryClient.invalidateQueries({
                  queryKey: conversationKeys.pendingApprovals(data.conversation_id),
                  refetchType: 'active',
                });
              }
            } else if (data.type === 'NOTIFICATION_CREATED') {
              queryClient.invalidateQueries({
                queryKey: NOTIFICATION_QUERY_KEYS.all,
                refetchType: 'active',
              });
            } else if (data.type === 'MESSAGE_REACTIONS_UPDATED') {
              const convId = data.conversation_id as number;
              const msgId = data.message_id as number;
              const actorUserId = data.actor_user_id as number;
              const actorReaction = data.actor_reaction as string | null;
              const newReactions = data.reactions as { reaction_key: any; count: number }[];

              if (convId && msgId) {
                const currentUserId = currentUserRef.current?.user_id;
                const isSelf = currentUserId === actorUserId;

                // 1. Immediate optimistic cache update for low-latency UX
                queryClient.setQueriesData(
                  { queryKey: conversationKeys.messageLists(convId) },
                  (oldData: any) => {
                    if (!oldData || !oldData.pages) return oldData;
                    return {
                      ...oldData,
                      pages: oldData.pages.map((page: any) => ({
                        ...page,
                        items: (page.items || []).map((msg: any) => {
                          if (msg.message_id !== msgId) return msg;
                          return {
                            ...msg,
                            reactions: newReactions || [],
                            my_reaction: isSelf ? actorReaction : msg.my_reaction,
                          };
                        }),
                      })),
                    };
                  }
                );

                // 2. Authoritative PostgreSQL/REST reconciliation
                queryClient.invalidateQueries({
                  queryKey: conversationKeys.messageLists(convId),
                  refetchType: 'active',
                });
              }
            }
          } catch (e) {
            console.error('Error parsing private WS event:', e);
          }
        };

        ws.onclose = () => {
          cleanupSocket();
          scheduleReconnect();
        };

        ws.onerror = () => {
          cleanupSocket();
        };
      } catch (err) {
        console.warn('Failed to establish private user WebSocket, continuing with REST:', err);
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      cleanupSocket();
    };
  }, [firebaseUser, initializing, queryClient]);
}
