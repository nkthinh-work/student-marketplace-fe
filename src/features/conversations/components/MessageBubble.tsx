import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, X, Download, Loader2, Reply, ImageOff } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { MessageItem, MessageAttachment, ReactionKey } from '../types';
import { ProductCardBubble } from './ProductCardBubble';
import { AudioBubble } from './AudioBubble';
import { DocumentBubble } from './DocumentBubble';
import { requestAttachmentDownload } from '../download';
import { useSetMessageReaction, useRemoveMessageReaction } from '../hooks';
import { MessageReactionPicker, MessageReactionBar } from './reactions';
import { formatMessageTime } from '@/lib/formatters';

interface MessageBubbleProps {
  message: MessageItem;
  conversationId?: number;
  showSenderInfo?: boolean;
  onBeforeNavigateAway?: () => void;
  senderNickname?: string | null;
  onReply?: (message: MessageItem) => void;
  memberNicknameMap?: Record<number, string | null>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  conversationId,
  showSenderInfo = false,
  onBeforeNavigateAway,
  senderNickname,
  onReply,
  memberNicknameMap,
}) => {
  const navigate = useNavigate();
  const isMine = message.is_mine;
  const [activePreviewImage, setActivePreviewImage] = useState<{
    url: string;
    attachment_id: number;
    original_name: string;
  } | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [failedImageMap, setFailedImageMap] = useState<Record<number, boolean>>({});
  const [downloadingVideoId, setDownloadingVideoId] = useState<number | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);

  // Gesture state & refs for swipe-to-reply and long-press reaction
  const bubbleRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startCoordRef = useRef<{ x: number; y: number } | null>(null);
  const gestureStateRef = useRef<
    'IDLE' | 'POSSIBLE_PRESS' | 'SWIPE_REPLY' | 'VERTICAL_SCROLL' | 'LONG_PRESS_REACTION'
  >('IDLE');
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragXRef = useRef<number>(0);
  const isThresholdReachedRef = useRef<boolean>(false);
  const [isThresholdActive, setIsThresholdActive] = useState<boolean>(false);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  // Clean up long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  const rawConvId = conversationId ?? message.conversation_id;
  const targetConvId =
    typeof rawConvId === 'number' && !isNaN(rawConvId) && rawConvId > 0
      ? rawConvId
      : 0;
  const hasActiveReactions = (message.reactions || []).some((r) => r.count > 0);
  const isEligible = message.type !== 'SYSTEM' && targetConvId > 0;

  const setReactionMutation = useSetMessageReaction(targetConvId);
  const removeReactionMutation = useRemoveMessageReaction(targetConvId);

  const handleSelectReaction = (key: ReactionKey) => {
    if (message.my_reaction === key) {
      removeReactionMutation.mutate({ messageId: message.message_id });
    } else {
      setReactionMutation.mutate({ messageId: message.message_id, reactionKey: key });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || e.button !== 0) return;

    // Eligibility check: SYSTEM and deleted messages cannot reply/react
    if (!isEligible) return;

    // Interactive child check: don't intercept clicks on links, buttons, media controls
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, video, audio, [data-no-message-gesture]')) {
      return;
    }

    pointerIdRef.current = e.pointerId;
    startCoordRef.current = { x: e.clientX, y: e.clientY };
    gestureStateRef.current = 'POSSIBLE_PRESS';
    dragXRef.current = 0;
    isThresholdReachedRef.current = false;

    // 450ms long-press timer for reaction picker
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (gestureStateRef.current === 'POSSIBLE_PRESS') {
        gestureStateRef.current = 'LONG_PRESS_REACTION';
        try {
          navigator.vibrate?.(40);
        } catch {
          // ignore unsupported vibration
        }
        if (bubbleRef.current && isEligible) {
          setPickerAnchor(bubbleRef.current);
        }
      }
    }, 450);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId || !startCoordRef.current) return;

    const dx = e.clientX - startCoordRef.current.x;
    const dy = e.clientY - startCoordRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (gestureStateRef.current === 'LONG_PRESS_REACTION') return;

    if (gestureStateRef.current === 'POSSIBLE_PRESS') {
      // If moving vertically beyond tolerance, transition to native vertical scroll and cancel long press
      if (absDy > 16 && absDy >= absDx) {
        gestureStateRef.current = 'VERTICAL_SCROLL';
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        return;
      }

      // If moving rightwards clearly dominating dy: establish SWIPE_REPLY intent
      if (onReply && dx > 24 && dx > absDy * 1.5) {
        gestureStateRef.current = 'SWIPE_REPLY';
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        // Capture pointer only after horizontal intent is established
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        setIsSwiping(true);
      } else if (absDx > 24 || absDy > 24) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }

    if (gestureStateRef.current === 'SWIPE_REPLY') {
      const rawDx = Math.max(0, dx);
      // Resistance curve: 0 -> max 60px visual translation
      const tx = Math.min(60, Math.floor(rawDx * 0.45));
      dragXRef.current = tx;

      if (bubbleRef.current) {
        bubbleRef.current.style.transform = `translate3d(${tx}px, 0, 0)`;
        bubbleRef.current.style.transition = 'none';
      }

      const reached = tx >= 44;
      if (reached !== isThresholdReachedRef.current) {
        isThresholdReachedRef.current = reached;
        setIsThresholdActive(reached);
      }
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    const wasLongPress = gestureStateRef.current === 'LONG_PRESS_REACTION';

    // If threshold reached and not a consumed long press, trigger Reply
    if (!wasLongPress && isThresholdReachedRef.current && onReply) {
      try {
        navigator.vibrate?.(25);
      } catch {
        // ignore
      }
      onReply(message);
    }

    // Reset translation with smooth spring snap-back
    if (bubbleRef.current) {
      bubbleRef.current.style.transform = 'translate3d(0, 0, 0)';
      bubbleRef.current.style.transition = 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)';
    }

    pointerIdRef.current = null;
    startCoordRef.current = null;
    gestureStateRef.current = 'IDLE';
    dragXRef.current = 0;
    isThresholdReachedRef.current = false;
    setIsThresholdActive(false);
    setIsSwiping(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, video, audio, [data-no-message-gesture]')) {
      return;
    }

    if (!isEligible) return;

    // Prevent native Android context menu on message bubble
    e.preventDefault();

    if (gestureStateRef.current === 'POSSIBLE_PRESS' || gestureStateRef.current === 'IDLE') {
      gestureStateRef.current = 'LONG_PRESS_REACTION';
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      try {
        navigator.vibrate?.(40);
      } catch {
        // ignore
      }
      if (bubbleRef.current && isEligible) {
        setPickerAnchor(bubbleRef.current);
      }
    }
  };

  const handleVideoDownload = async (att: MessageAttachment) => {
    if (downloadingVideoId) return;
    if (!targetConvId || isNaN(targetConvId) || targetConvId <= 0) {
      window.open(att.url, '_blank');
      return;
    }
    try {
      setDownloadingVideoId(att.attachment_id);
      await requestAttachmentDownload(
        targetConvId,
        att.attachment_id,
        att.original_name
      );
    } catch {
      // Handled in requestAttachmentDownload
    } finally {
      setDownloadingVideoId(null);
    }
  };

  const handleImageDownload = async () => {
    if (!activePreviewImage || isDownloadingImage) return;
    if (!targetConvId || isNaN(targetConvId) || targetConvId <= 0) {
      window.open(activePreviewImage.url, '_blank');
      return;
    }
    try {
      setIsDownloadingImage(true);
      await requestAttachmentDownload(
        targetConvId,
        activePreviewImage.attachment_id,
        activePreviewImage.original_name
      );
    } catch {
      // Handled in requestAttachmentDownload
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const formattedTime = React.useMemo(() => {
    return formatMessageTime(message.sent_at);
  }, [message.sent_at]);

  const attachments = message.attachments || [];
  const isAudioAtt = (a: MessageAttachment) => {
    if (a.kind === 'AUDIO') return true;
    const name = (a.original_name || '').toLowerCase();
    const mime = (a.mime_type || '').toLowerCase();
    const url = (a.url || '').toLowerCase();
    if (mime.startsWith('audio/')) return true;
    if (name.startsWith('voice_note_') || url.includes('voice_note_')) return true;
    if (
      name.endsWith('.mp3') ||
      name.endsWith('.m4a') ||
      name.endsWith('.wav') ||
      name.endsWith('.aac') ||
      name.endsWith('.ogg') ||
      name.endsWith('.webm') && (name.includes('voice') || url.includes('voice'))
    ) {
      return true;
    }
    return false;
  };

  const audioAttachments = attachments.filter(isAudioAtt);
  const videoAttachments = attachments.filter((a) => a.kind === 'VIDEO' && !isAudioAtt(a));
  const imageAttachments = attachments.filter((a) => a.kind === 'IMAGE');
  const docAttachments = attachments.filter(
    (a) => a.kind === 'PDF' || a.kind === 'DOCUMENT'
  );

  return (
    <>
      <div
        data-message-id={message.message_id}
        className={`flex w-full mb-3 gap-2 ${isMine ? 'justify-end' : 'justify-start'
          }`}
      >
        {/* Sender Avatar for group/community (when not mine) */}
        {!isMine && showSenderInfo && (
          <div
            onClick={() => {
              onBeforeNavigateAway?.();
              navigate(`/users/${message.sender_id}`, {
                state: {
                  fromApp: true,
                  returnTo: `/messages/${message.conversation_id}`,
                  returnLabel: 'Quay lại nhóm',
                  source: 'conversation-member',
                },
              });
            }}
            className="shrink-0 self-start mt-0.5 cursor-pointer hover:opacity-85 transition-opacity"
            title="Xem trang cá nhân"
          >
            <Avatar
              src={message.sender_avatar}
              name={message.sender_name}
              size="sm"
              className="border border-stone-200 shadow-2xs"
            />
          </div>
        )}

        <div
          className={`flex flex-col ${!isMine && showSenderInfo
              ? 'max-w-[calc(100%-40px)] sm:max-w-[75%]'
              : 'max-w-[85%] sm:max-w-[75%]'
            } min-w-0 ${isMine ? 'items-end' : 'items-start'}`}
        >
          {/* Sender Name in group */}
          {!isMine && showSenderInfo && (senderNickname || message.sender_name) && (
            <span
              onClick={() => {
                onBeforeNavigateAway?.();
                navigate(`/users/${message.sender_id}`, {
                  state: {
                    fromApp: true,
                    returnTo: `/messages/${message.conversation_id}`,
                    returnLabel: 'Quay lại nhóm',
                    source: 'conversation-member',
                  },
                });
              }}
              className="text-[11px] font-semibold text-stone-500 mb-1 ml-1 truncate max-w-full cursor-pointer hover:text-brand-burgundy transition-colors"
            >
              {(senderNickname && senderNickname.trim())
                ? senderNickname.trim()
                : (message.sender_name || 'Người dùng')}
            </span>
          )}

          <div className="relative group/msg max-w-full">
            {/* Bubble wrapper: flexible container with natural content sizing */}
            <div className="relative min-w-0 max-w-full shrink flex-initial">
              {/* Swipe Reply indicator revealed behind/left of bubble */}
              {onReply && (
                <div
                  className={`pointer-events-none absolute -left-8 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150 z-0 ${isSwiping ? 'opacity-100' : 'opacity-0'
                    } ${isThresholdActive
                      ? 'bg-brand-burgundy text-white scale-110 shadow-xs'
                      : 'bg-stone-200 text-stone-500 scale-90'
                    }`}
                  aria-hidden="true"
                >
                  <Reply className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                ref={bubbleRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUpOrCancel}
                onPointerCancel={handlePointerUpOrCancel}
                onContextMenu={handleContextMenu}
                style={{
                  touchAction: 'pan-y',
                  WebkitTouchCallout: 'none',
                }}
                className={`relative z-1 rounded-2xl p-3 sm:p-3.5 shadow-xs text-sm break-words [overflow-wrap:break-word] min-w-0 w-fit max-w-full select-none sm:select-text ${isMine
                    ? 'bg-brand-burgundy text-white rounded-br-xs'
                    : 'bg-white text-stone-900 border border-stone-200 rounded-bl-xs'
                  }`}
              >
                {/* Quoted Reply Banner */}
                {message.reply_to && (
                  <div
                    className={`mb-2 px-2.5 py-1.5 rounded-lg text-xs border-l-2 select-none ${isMine
                        ? 'bg-rose-950/30 border-rose-300 text-rose-100'
                        : 'bg-stone-100 border-brand-burgundy text-stone-700'
                      }`}
                  >
                    <span className="font-semibold block truncate text-[11px]">
                      {(() => {
                        const senderId = message.reply_to.sender_id;
                        if (memberNicknameMap && memberNicknameMap[senderId]) {
                          return memberNicknameMap[senderId];
                        }
                        return message.reply_to.sender_name || 'Người dùng';
                      })()}
                    </span>
                    <span className={`block truncate text-[11px] ${isMine ? 'text-rose-200/80' : 'text-stone-500'}`}>
                      {message.reply_to.preview}
                    </span>
                  </div>
                )}

                {/* Inline Product Card */}
                {message.product && (
                  <ProductCardBubble
                    product={message.product}
                    isMine={isMine}
                    conversationId={message.conversation_id}
                    isGroup={showSenderInfo}
                    onBeforeNavigateAway={onBeforeNavigateAway}
                  />
                )}

                {/* Images Grid */}
                {imageAttachments.length > 0 && (
                  <div
                    className={`mb-2 rounded-xl overflow-hidden ${imageAttachments.length === 1
                        ? 'max-w-xs'
                        : 'grid grid-cols-2 gap-1.5'
                      }`}
                  >
                    {imageAttachments.map((att) => {
                      const isFailed = failedImageMap[att.attachment_id];
                      if (isFailed) {
                        return (
                          <div
                            key={att.attachment_id}
                            data-no-message-gesture="true"
                            className="rounded-xl border border-stone-200 bg-stone-50 p-3 flex flex-col items-center justify-center gap-1.5 text-center aspect-square max-h-60"
                            title={`Không thể tải ảnh: ${att.original_name}`}
                          >
                            <ImageOff className="w-6 h-6 text-stone-400 shrink-0" />
                            <span className="text-xs font-medium text-stone-600 truncate max-w-[90%]">
                              {att.original_name}
                            </span>
                            <span className="text-[10px] text-stone-400">Không thể hiển thị ảnh</span>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-[11px] text-brand-burgundy font-medium hover:underline inline-flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Mở liên kết
                            </a>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={att.attachment_id}
                          data-no-message-gesture="true"
                          onClick={() =>
                            setActivePreviewImage({
                              url: att.url,
                              attachment_id: att.attachment_id,
                              original_name: att.original_name,
                            })
                          }
                          className="relative group cursor-pointer overflow-hidden rounded-lg bg-black/5 aspect-square max-h-60 flex items-center justify-center"
                        >
                          <img
                            src={att.url}
                            alt={att.original_name}
                            onError={() =>
                              setFailedImageMap((prev) => ({
                                ...prev,
                                [att.attachment_id]: true,
                              }))
                            }
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5 drop-shadow-sm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Videos */}
                {videoAttachments.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {videoAttachments.map((att) => (
                      <div
                        key={att.attachment_id}
                        className="rounded-xl overflow-hidden bg-black/90 max-w-full border border-stone-800"
                      >
                        <video
                          src={att.url}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-72 object-contain"
                        />
                        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-stone-900 text-stone-300 text-xs border-t border-stone-800/80">
                          <span className="truncate flex-1 font-medium" title={att.original_name}>
                            {att.original_name || 'Video'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleVideoDownload(att)}
                            disabled={downloadingVideoId === att.attachment_id}
                            className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-rose-400 hover:text-rose-300 bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded-lg transition disabled:opacity-50 cursor-pointer"
                            title="Tải video xuống thiết bị"
                          >
                            {downloadingVideoId === att.attachment_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Tải xuống</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Audios / Voice Notes */}
                {audioAttachments.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    {audioAttachments.map((att) => (
                      <AudioBubble
                        key={att.attachment_id}
                        url={att.url}
                        isMine={isMine}
                        attachmentId={att.attachment_id}
                        durationMs={att.duration_ms}
                      />
                    ))}
                  </div>
                )}

                {/* Documents (PDF, DOCX, XLSX, PPTX, TXT) */}
                {docAttachments.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    {docAttachments.map((att) => (
                      <DocumentBubble
                        key={att.attachment_id}
                        attachment={att}
                        conversationId={targetConvId}
                        isMine={isMine}
                      />
                    ))}
                  </div>
                )}

                {/* Message Text Content with Structured Mentions */}
                {message.content && (
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {(() => {
                      const text = message.content;
                      const mentions = message.mentions;
                      if (!mentions || mentions.length === 0) {
                        return text;
                      }

                      const sortedMentions = [...mentions].sort(
                        (a, b) => a.start_offset - b.start_offset
                      );

                      const elements: React.ReactNode[] = [];
                      let lastIndex = 0;

                      sortedMentions.forEach((m, idx) => {
                        if (
                          m.start_offset >= lastIndex &&
                          m.end_offset <= text.length &&
                          m.start_offset < m.end_offset
                        ) {
                          if (m.start_offset > lastIndex) {
                            elements.push(text.slice(lastIndex, m.start_offset));
                          }

                          const mentionDisplayText =
                            m.display_text || text.slice(m.start_offset, m.end_offset);

                          elements.push(
                            <span
                              key={`mention-${m.mention_id ?? idx}-${m.start_offset}`}
                              className={`font-semibold select-none sm:select-text ${isMine
                                  ? 'text-rose-100 font-bold'
                                  : 'text-brand-burgundy font-bold'
                                }`}
                            >
                              {mentionDisplayText}
                            </span>
                          );

                          lastIndex = m.end_offset;
                        }
                      });

                      if (lastIndex < text.length) {
                        elements.push(text.slice(lastIndex));
                      }

                      return elements;
                    })()}
                  </p>
                )}

                {/* Message Timestamp */}
                <div
                  className={`flex items-center justify-end mt-1 text-[11px] select-none ${isMine ? 'text-rose-200' : 'text-stone-400'
                    }`}
                >
                  <span>{formattedTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reaction Bar (Pills) underneath bubble, width independent */}
          {isEligible && hasActiveReactions && (
            <MessageReactionBar
              reactions={message.reactions || []}
              myReaction={message.my_reaction}
              onSelect={handleSelectReaction}
              onOpenPicker={(btnEl) => setPickerAnchor(btnEl)}
              isMine={isMine}
            />
          )}

          {/* Popover Reaction Picker (Portaled to document.body, clamped to viewport) */}
          {pickerAnchor && (
            <MessageReactionPicker
              anchorElement={pickerAnchor}
              currentReaction={message.my_reaction}
              onSelect={(key) => {
                handleSelectReaction(key);
                setPickerAnchor(null);
              }}
              onClose={() => setPickerAnchor(null)}
              isMine={isMine}
            />
          )}
        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {activePreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setIsDownloadingImage(false);
            setActivePreviewImage(null);
          }}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleImageDownload();
              }}
              disabled={isDownloadingImage}
              className="h-10 px-3.5 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center gap-1.5 transition-colors text-xs font-medium backdrop-blur-xs cursor-pointer disabled:opacity-50"
              title="Tải ảnh xuống thiết bị"
            >
              {isDownloadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Tải xuống</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDownloadingImage(false);
                setActivePreviewImage(null);
              }}
              className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng xem ảnh"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img
            src={activePreviewImage.url}
            alt={activePreviewImage.original_name || 'Xem ảnh đính kèm'}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
