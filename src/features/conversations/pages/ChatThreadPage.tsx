import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
  useCallback,
} from 'react';
import {
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import {
  ArrowLeft,
  Info,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  useConversation,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
  useGroupMembers,
} from '../hooks';
import { useQueryClient } from '@tanstack/react-query';
import { isAccessRevokedError } from '@/lib/apiErrors';
import { Avatar } from '@/components/common/Avatar';
import { handleConversationAccessRevoked } from '../accessRevocation';
import { MessageBubble } from '../components/MessageBubble';
import { GroupSystemMessage } from '../components/GroupSystemMessage';
import { MessageComposer } from '../components/MessageComposer';
import { GroupInfoDrawer } from '../components/GroupInfoDrawer';
import { DirectInfoDrawer } from '../components/DirectInfoDrawer';
import { ChatProductContextCard } from '../components/ChatProductContextCard';
import { MessageMentionInput, ReplyMessageSummary } from '../types';
import { useCurrentUser } from '@/features/users/hooks';
import { getSafeBackAction } from '@/lib/navigation';

interface ChatScrollRestorationState {
  scrollTop: number;
  anchorMessageId?: number;
  anchorOffsetTop?: number;
  timestamp: number;
}

export const ChatThreadPage: React.FC = () => {
  const { conversationId: convIdParam } = useParams<{
    conversationId: string;
  }>();
  const conversationId = Number(convIdParam);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isDirectInfoOpen, setIsDirectInfoOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyMessageSummary | null>(null);

  const {
    data: conversation,
    isLoading: isConvLoading,
    isError: isConvError,
    error: convError,
  } = useConversation(conversationId);

  const isDirect = conversation?.type === 'DIRECT';
  const isGroup = conversation?.type === 'GROUP';

  const tabFallback =
    isGroup ? '/messages?tab=group' : '/messages?tab=direct';
  const { handleBack } = getSafeBackAction(location.state, tabFallback);

  const {
    data: messagesData,
    isLoading: isMsgsLoading,
    error: msgsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId, 30);

  const sendMessageMutation = useSendMessage(conversationId);
  const markReadMutation = useMarkConversationRead(conversationId);

  const { data: groupMembers = [] } = useGroupMembers(
    isGroup ? conversationId || 0 : 0
  );

  const memberNicknameMap = useMemo(() => {
    const map = new Map<number, string | null>();
    if (!isGroup) return map;
    for (const m of groupMembers) {
      map.set(m.user_id, m.nickname || null);
    }
    return map;
  }, [isGroup, groupMembers]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shellContainerRef = useRef<HTMLDivElement>(null);
  const [chatAvailableHeight, setChatAvailableHeight] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const prevScrollHeightRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false);

  const { data: currentUser } = useCurrentUser();
  const userId =
    currentUser?.user_id && currentUser.user_id > 0
      ? currentUser.user_id
      : null;
  const scrollKey = userId
    ? `chat_scroll_${userId}_${conversationId}`
    : null;

  // Flatten and reverse pages to maintain strictly chronological [oldest ... newest]
  const messages = useMemo(() => {
    if (!messagesData?.pages) return [];
    const flattened = messagesData.pages.flatMap((page) => page.items);
    return [...flattened].reverse();
  }, [messagesData]);

  // Explicitly persist view state BEFORE internal sub-navigation
  const saveConversationViewState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !scrollKey) return;

    const containerRect = container.getBoundingClientRect();
    const messageElements = container.querySelectorAll<HTMLElement>(
      '[data-message-id]'
    );

    let anchorMessageId: number | undefined;
    let anchorOffsetTop: number | undefined;

    for (const el of messageElements) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom >= containerRect.top + 8) {
        anchorMessageId = Number(el.dataset.messageId);
        anchorOffsetTop = rect.top - containerRect.top;
        break;
      }
    }

    const state: ChatScrollRestorationState = {
      scrollTop: container.scrollTop,
      anchorMessageId,
      anchorOffsetTop,
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem(scrollKey, JSON.stringify(state));
    } catch {
      // quota safeguard
    }
  }, [scrollKey]);

  // Header Back button action: Intentional exit
  const onHeaderBack = () => {
    if (scrollKey) {
      sessionStorage.removeItem(scrollKey);
    }
    handleBack(navigate);
  };

  // Clear replyingTo when switching conversation
  useEffect(() => {
    setReplyingTo(null);
  }, [conversationId]);

  // REST Authorization Fallback: if deterministic loss of access occurs (403/404),
  // immediately and idempotently cancel queries, clear caches, and replace-navigate away.
  useEffect(() => {
    const isRevoked = isAccessRevokedError(convError) || isAccessRevokedError(msgsError);
    if (isRevoked && conversationId) {
      handleConversationAccessRevoked({
        conversationId,
        queryClient,
        navigate,
        currentPath: location.pathname,
        notice: 'Bạn không còn là thành viên của nhóm trò chuyện này.',
      });
    }
  }, [convError, msgsError, conversationId, navigate, location.pathname, queryClient]);

  // Mark as read on mount and when new incoming messages arrive (strictly guarded against revoked access)
  useEffect(() => {
    const isRevoked = isAccessRevokedError(convError) || isAccessRevokedError(msgsError);
    if (conversationId && conversation && !isRevoked) {
      markReadMutation.mutate();
    }
  }, [conversationId, conversation, messages.length, convError, msgsError]);

  // Handle scroll position tracking
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 120;

    // Trigger loading older messages when scrolled to the very top
    if (scrollTop < 40 && hasNextPage && !isFetchingNextPage) {
      isPrependingRef.current = true;
      prevScrollHeightRef.current = scrollHeight;
      fetchNextPage();
    }
  };

  // Helper to scroll strictly within the MessageList container without moving window/ancestors
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  // Anchor scroll position when prepending older pages
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isPrependingRef.current) {
      isPrependingRef.current = false;
      const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop += heightDiff;
    } else if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);


  // Scroll Restoration & Transient 500ms Settlement Observer
  const hasRestoredScrollRef = useRef<boolean>(false);
  const settlementObserverRef = useRef<ResizeObserver | null>(null);
  const settlementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchAnchorRetriesRef = useRef<number>(0);

  const startSettlementObserver = (
    anchorEl: HTMLElement,
    targetOffset: number
  ) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    settlementObserverRef.current?.disconnect();
    if (settlementTimeoutRef.current) clearTimeout(settlementTimeoutRef.current);

    const observer = new ResizeObserver(() => {
      const containerRect = container.getBoundingClientRect();
      const anchorRect = anchorEl.getBoundingClientRect();
      const currentOffset = anchorRect.top - containerRect.top;
      const delta = currentOffset - targetOffset;

      if (Math.abs(delta) > 1) {
        container.scrollTop += delta;
      }
    });

    observer.observe(container);
    settlementObserverRef.current = observer;

    // Disconnect after 500ms settlement window
    settlementTimeoutRef.current = setTimeout(() => {
      observer.disconnect();
      settlementObserverRef.current = null;
    }, 500);
  };

  useEffect(() => {
    return () => {
      settlementObserverRef.current?.disconnect();
      if (settlementTimeoutRef.current)
        clearTimeout(settlementTimeoutRef.current);
    };
  }, []);

  // One-shot Anchor Restoration on Mount
  useLayoutEffect(() => {
    if (!isMsgsLoading && messages.length > 0 && !hasRestoredScrollRef.current) {
      const container = scrollContainerRef.current;
      if (!container) return;

      if (scrollKey) {
        const raw = sessionStorage.getItem(scrollKey);
        if (raw) {
          // Consume immediately (one-shot)
          sessionStorage.removeItem(scrollKey);

          try {
            const saved: ChatScrollRestorationState = JSON.parse(raw);
            const TTL_MS = 15 * 60 * 1000;
            if (Date.now() - saved.timestamp <= TTL_MS) {
              // 1. Try Anchor Message restoration
              if (saved.anchorMessageId) {
                const anchorEl = container.querySelector<HTMLElement>(
                  `[data-message-id="${saved.anchorMessageId}"]`
                );
                if (anchorEl) {
                  const containerRect = container.getBoundingClientRect();
                  const anchorRect = anchorEl.getBoundingClientRect();
                  const currentOffset = anchorRect.top - containerRect.top;
                  const targetOffset = saved.anchorOffsetTop ?? 0;
                  const delta = currentOffset - targetOffset;

                  const maxScroll =
                    container.scrollHeight - container.clientHeight;
                  container.scrollTop = Math.max(
                    0,
                    Math.min(container.scrollTop + delta, maxScroll)
                  );

                  startSettlementObserver(anchorEl, targetOffset);
                  hasRestoredScrollRef.current = true;
                  return;
                } else if (
                  hasNextPage &&
                  !isFetchingNextPage &&
                  fetchAnchorRetriesRef.current < 2
                ) {
                  // Bounded retry for paginated anchor
                  fetchAnchorRetriesRef.current += 1;
                  fetchNextPage();
                  return;
                } else if (fetchAnchorRetriesRef.current >= 2) {
                  // Safe fallback: scroll to top of loaded historical messages
                  container.scrollTop = 0;
                  hasRestoredScrollRef.current = true;
                  return;
                }
              }

              // 2. Pixel fallback
              if (typeof saved.scrollTop === 'number') {
                container.scrollTop = saved.scrollTop;
                hasRestoredScrollRef.current = true;
                return;
              }
            }
          } catch {
            // JSON parse error fallback
          }
        }
      }

      // 3. Fresh entry: default to bottom
      scrollToBottom('instant');
      hasRestoredScrollRef.current = true;
    }
  }, [isMsgsLoading, messages.length, scrollKey, hasNextPage, isFetchingNextPage, scrollToBottom]);

  const handleSend = (
    content?: string | null,
    files?: File[],
    productId?: number | null,
    voiceDurationMs?: number | null,
    mentions?: MessageMentionInput[],
    replyToMessageId?: number | null
  ) => {
    sendMessageMutation.mutate(
      {
        content: content || null,
        product_id: productId || null,
        files: files,
        voice_duration_ms: voiceDurationMs || null,
        mentions: mentions,
        reply_to_message_id: replyToMessageId || null,
      },
      {
        onSuccess: () => {
          setReplyingTo(null);
          setTimeout(() => {
            scrollToBottom('smooth');
          }, 50);
        },
      }
    );
  };

  // Canonical Chat VisualViewport reconciliation with synchronized focus and bounded transition tracking
  const lastHeightRef = useRef<number | null>(null);
  const rafTrackerIdRef = useRef<number | null>(null);
  const consecutiveStableFramesRef = useRef<number>(0);
  const trackerFrameCountRef = useRef<number>(0);

  // Initial measurement in useLayoutEffect after DOM commit but before paint to prevent two-phase flash
  useLayoutEffect(() => {
    // Ensure clean route entry without stale scroll from prior route
    if (typeof window !== 'undefined' && window.scrollY !== 0) {
      window.scrollTo(0, 0);
    }
    const vv = window.visualViewport;
    if (!vv || !shellContainerRef.current) return;
    const rect = shellContainerRef.current.getBoundingClientRect();
    const available = Math.max(0, Math.floor(vv.height + vv.offsetTop - rect.top));
    lastHeightRef.current = available;
    setChatAvailableHeight(available);
  }, []);

  const cancelTracker = useCallback(() => {
    if (rafTrackerIdRef.current !== null) {
      cancelAnimationFrame(rafTrackerIdRef.current);
      rafTrackerIdRef.current = null;
    }
    consecutiveStableFramesRef.current = 0;
    trackerFrameCountRef.current = 0;
  }, []);

  const requestChatViewportReconcile = useCallback(
    (startContinuousTracking = false) => {
      const vv = window.visualViewport;
      if (!vv) return;

      const STABLE_FRAMES_REQUIRED = 5;
      const MAX_TRACKER_FRAMES = 60; // ~1000ms bounded safety guard

      if (startContinuousTracking) {
        cancelTracker();

        const step = () => {
          rafTrackerIdRef.current = null;
          trackerFrameCountRef.current++;

          if (!shellContainerRef.current || !window.visualViewport) {
            cancelTracker();
            return;
          }

          const currentVv = window.visualViewport;
          // READ live geometry
          const rect = shellContainerRef.current.getBoundingClientRect();
          const available = Math.max(0, Math.floor(currentVv.height + currentVv.offsetTop - rect.top));

          // CHECK STABILITY
          const hasChanged =
            lastHeightRef.current === null || Math.abs(lastHeightRef.current - available) > 0.5;

          if (hasChanged) {
            consecutiveStableFramesRef.current = 0;
            lastHeightRef.current = available;
            // WRITE
            setChatAvailableHeight(available);
            if (isNearBottomRef.current && scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          } else {
            consecutiveStableFramesRef.current++;
          }

          // TERMINATION
          if (
            consecutiveStableFramesRef.current >= STABLE_FRAMES_REQUIRED ||
            trackerFrameCountRef.current >= MAX_TRACKER_FRAMES
          ) {
            cancelTracker();
            return;
          }

          rafTrackerIdRef.current = requestAnimationFrame(step);
        };

        rafTrackerIdRef.current = requestAnimationFrame(step);
      } else {
        // Single frame reconciliation
        if (rafTrackerIdRef.current !== null) return;
        rafTrackerIdRef.current = requestAnimationFrame(() => {
          rafTrackerIdRef.current = null;
          if (!shellContainerRef.current || !window.visualViewport) return;
          const currentVv = window.visualViewport;
          // READ live geometry
          const rect = shellContainerRef.current.getBoundingClientRect();
          const available = Math.max(0, Math.floor(currentVv.height + currentVv.offsetTop - rect.top));

          if (lastHeightRef.current === null || Math.abs(lastHeightRef.current - available) > 0.5) {
            lastHeightRef.current = available;
            // WRITE
            setChatAvailableHeight(available);
            if (isNearBottomRef.current && scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          }
        });
      }
    },
    [cancelTracker]
  );

  const handleComposerFocus = useCallback(() => {
    requestChatViewportReconcile(true);
  }, [requestChatViewportReconcile]);

  const handleComposerBlur = useCallback(() => {
    requestChatViewportReconcile(true);
  }, [requestChatViewportReconcile]);

  // Single unified listener for VisualViewport & window events
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleVvChange = () => requestChatViewportReconcile(true);
    const handleWindowResize = () => requestChatViewportReconcile(false);

    vv.addEventListener('resize', handleVvChange);
    vv.addEventListener('scroll', handleVvChange);
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleVvChange);

    return () => {
      cancelTracker();
      vv.removeEventListener('resize', handleVvChange);
      vv.removeEventListener('scroll', handleVvChange);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleVvChange);
    };
  }, [requestChatViewportReconcile, cancelTracker]);

  // If conversation does not exist or user is not authorized, show clean fallback UI
  if (!isConvLoading && (isConvError || !conversation)) {
    // If access was revoked, transition smoothly while replace navigation completes
    if (isAccessRevokedError(convError) || isAccessRevokedError(msgsError)) {
      return null;
    }

    return (
      <div className="flex flex-col h-[calc(100dvh-56px)] bg-brand-warm-white items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-900 mb-1">
            Cuộc trò chuyện không tồn tại
          </h3>
          <p className="text-xs text-stone-500 mb-5 leading-relaxed">
            Cuộc trò chuyện này không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/messages')}
              className="w-full py-2.5 px-4 bg-brand-burgundy text-white rounded-xl text-sm font-medium hover:bg-brand-burgundy/90 transition-colors shadow-xs"
            >
              Xem danh sách tin nhắn
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const otherUser = conversation?.other_participant;
  const otherUserId = isDirect ? otherUser?.user_id : undefined;

  const headerTitle = isDirect
    ? otherUser?.full_name || 'Người dùng'
    : conversation?.title || 'Nhóm trò chuyện';

  return (
    <div
      ref={shellContainerRef}
      data-ui-role="chat-thread-shell"
      style={chatAvailableHeight ? { height: `${chatAvailableHeight}px` } : undefined}
      className="flex flex-col h-[100dvh] md:h-[calc(100dvh-56px)] bg-brand-warm-white overflow-hidden"
    >
      {/* Top Thread Header */}
      <header className="shrink-0 flex items-center justify-between bg-white border-b border-stone-200 px-2 sm:px-4 py-2 sm:py-2.5 z-10 shadow-xs">
        {/* Left Slot: Back Button */}
        <div className="w-9 h-9 flex-none flex items-center justify-start">
          <button
            onClick={onHeaderBack}
            aria-label="Quay lại"
            className="h-9 w-9 -ml-1 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>


        {/* Identity Block */}
        {isDirect ? (
          /* Direct 1-to-1: Left-aligned identity block after Back button - clickable to open Direct Info */
          <div
            className="flex-1 min-w-0 flex items-center gap-2.5 pl-1 pr-2 cursor-pointer group hover:opacity-85 transition-opacity"
            onClick={() => setIsDirectInfoOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsDirectInfoOpen(true);
              }
            }}
          >
            <Avatar
              src={otherUser?.avatar_url}
              name={headerTitle}
              size="sm"
              className="w-9 h-9 border border-stone-200"
            />
            <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
              <h2 className="text-sm font-semibold text-stone-900 group-hover:text-brand-burgundy transition-colors truncate leading-tight">
                {headerTitle}
              </h2>
            </div>
          </div>
        ) : (
          /* Group: Symmetrically Centered Identity with subtitle info (Clickable to open Group Info) */
          <div
            className="flex-1 min-w-0 flex flex-col items-center justify-center text-center px-1 cursor-pointer group hover:opacity-85 transition-opacity"
            onClick={() => setIsGroupInfoOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsGroupInfoOpen(true);
              }
            }}
          >
            <div className="flex flex-col items-center justify-center text-center max-w-full">
              <h2 className="text-sm font-bold text-stone-900 group-hover:text-brand-burgundy transition-colors truncate max-w-full leading-tight">
                {headerTitle}
              </h2>
              <span className="text-[11px] text-stone-400 mt-0.5">
                {conversation?.member_count || 0} thành viên
              </span>
            </div>
          </div>
        )}

        {/* Right Slot: Info Button */}
        <div className="w-9 h-9 flex-none flex items-center justify-end">
          {isGroup ? (
            <button
              type="button"
              onClick={() => setIsGroupInfoOpen(true)}
              aria-label="Thông tin nhóm"
              className="h-9 w-9 -mr-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full flex items-center justify-center transition-colors active:scale-95"
            >
              <Info className="w-5 h-5" />
            </button>
          ) : isDirect ? (
            <button
              type="button"
              onClick={() => setIsDirectInfoOpen(true)}
              aria-label="Thông tin cuộc trò chuyện"
              className="h-9 w-9 -mr-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-full flex items-center justify-center transition-colors active:scale-95"
            >
              <Info className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9" />
          )}
        </div>
      </header>


      {/* Product Context Banner if 1-1 conversation is linked to a product */}
      {isDirect && conversation?.product_context && (
        <ChatProductContextCard
          product={conversation.product_context}
          conversationId={conversationId}
          onBeforeNavigateAway={saveConversationViewState}
        />
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        data-ui-role="message-list"
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-1"
      >
        {/* Load older spinner */}
        {isFetchingNextPage && (
          <div className="py-2 text-center text-xs text-stone-400 flex items-center justify-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-burgundy" />
            <span>Đang tải tin nhắn cũ hơn...</span>
          </div>
        )}

        {/* Loading skeleton */}
        {isMsgsLoading && (
          <div className="space-y-3 py-6">
            <div className="h-10 w-48 bg-stone-200/60 rounded-2xl animate-pulse" />
            <div className="h-12 w-64 bg-stone-200/60 rounded-2xl ml-auto animate-pulse" />
            <div className="h-10 w-52 bg-stone-200/60 rounded-2xl animate-pulse" />
          </div>
        )}

        {/* Empty state */}
        {!isMsgsLoading && messages.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-xs sm:text-sm text-stone-500">
              {isDirect ? (
                <>
                  Bắt đầu trò chuyện với{' '}
                  <span className="font-semibold text-stone-700">
                    {otherUser?.full_name || 'người dùng'}
                  </span>
                </>
              ) : (
                'Chưa có tin nhắn nào trong nhóm. Hãy là người đầu tiên gửi tin nhắn!'
              )}
            </p>
          </div>
        )}

        {/* Message bubbles */}
        {!isMsgsLoading &&
          messages.map((msg) =>
            isGroup && msg.type === 'SYSTEM' ? (
              <GroupSystemMessage key={msg.message_id} message={msg} />
            ) : (
              <MessageBubble
                key={msg.message_id}
                message={msg}
                conversationId={conversationId || msg.conversation_id}
                showSenderInfo={!isDirect}
                senderNickname={isGroup ? memberNicknameMap.get(msg.sender_id) : undefined}
                memberNicknameMap={isGroup ? Object.fromEntries(memberNicknameMap) : undefined}
                onReply={(m) => {
                  const sName = (isGroup && memberNicknameMap.get(m.sender_id)) || m.sender_name || 'Người dùng';
                  let preview = m.content ? m.content.trim() : '';
                  if (!preview) {
                    const firstAtt = m.attachments?.[0];
                    if (firstAtt) {
                      const k = firstAtt.kind;
                      if (k === 'IMAGE') preview = 'Hình ảnh';
                      else if (k === 'VIDEO') preview = 'Video';
                      else if (k === 'AUDIO') preview = 'Tin nhắn thoại';
                      else preview = 'Tệp đính kèm';
                    } else if (m.product) {
                      preview = 'Sản phẩm';
                    } else {
                      preview = 'Tin nhắn';
                    }
                  } else if (preview.length > 120) {
                    preview = preview.slice(0, 120).trimEnd() + '...';
                  }
                  setReplyingTo({
                    message_id: m.message_id,
                    sender_id: m.sender_id,
                    sender_name: sName,
                    type: m.type,
                    preview,
                  });
                }}
                onBeforeNavigateAway={saveConversationViewState}
              />
            )
          )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Message Composer Footer */}
      {conversation && (
        <MessageComposer
          onSend={handleSend}
          disabled={sendMessageMutation.isPending}
          conversationType={conversation?.type || 'DIRECT'}
          otherUserId={otherUserId}
          otherUserName={otherUser?.full_name}
          conversationId={conversationId}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onFocus={handleComposerFocus}
          onBlur={handleComposerBlur}
          placeholder={
            isDirect
              ? `Nhắn cho ${otherUser?.full_name || 'người bán'}...`
              : 'Nhập tin nhắn vào nhóm... (gõ @ để nhắc tên)'
          }
        />
      )}

      {/* Group Info Drawer */}
      {conversation && isGroup && (
        <GroupInfoDrawer
          conversation={conversation}
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          onBeforeNavigateAway={saveConversationViewState}
        />
      )}

      {/* Direct Info Drawer */}
      {conversation && isDirect && (
        <DirectInfoDrawer
          conversation={conversation}
          isOpen={isDirectInfoOpen}
          onClose={() => setIsDirectInfoOpen(false)}
          onBeforeNavigateAway={saveConversationViewState}
        />
      )}
    </div>
  );
};

export default ChatThreadPage;
