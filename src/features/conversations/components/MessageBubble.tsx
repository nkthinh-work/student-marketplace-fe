import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, X, Download, Loader2, SmilePlus } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { MessageItem, MessageAttachment, ReactionKey } from '../types';
import { ProductCardBubble } from './ProductCardBubble';
import { AudioBubble } from './AudioBubble';
import { DocumentBubble } from './DocumentBubble';
import { requestAttachmentDownload } from '../download';
import { useSetMessageReaction, useRemoveMessageReaction } from '../hooks';
import { MessageReactionPicker, MessageReactionBar } from './reactions';

interface MessageBubbleProps {
  message: MessageItem;
  conversationId?: number;
  showSenderInfo?: boolean;
  isCommunity?: boolean;
  onBeforeNavigateAway?: () => void;
  senderNickname?: string | null;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  conversationId,
  showSenderInfo = false,
  isCommunity = false,
  onBeforeNavigateAway,
  senderNickname,
}) => {
  const navigate = useNavigate();
  const isMine = message.is_mine;
  const [activePreviewImage, setActivePreviewImage] = useState<{
    url: string;
    attachment_id: number;
    original_name: string;
  } | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadingVideoId, setDownloadingVideoId] = useState<number | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);

  const targetConvId = conversationId ?? message.conversation_id;
  const hasActiveReactions = (message.reactions || []).some((r) => r.count > 0);

  const setReactionMutation = useSetMessageReaction(targetConvId);
  const removeReactionMutation = useRemoveMessageReaction(targetConvId);

  const handleSelectReaction = (key: ReactionKey) => {
    if (message.my_reaction === key) {
      removeReactionMutation.mutate({ messageId: message.message_id });
    } else {
      setReactionMutation.mutate({ messageId: message.message_id, reactionKey: key });
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
    try {
      const d = new Date(message.sent_at);
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }, [message.sent_at]);

  const attachments = message.attachments || [];
  const imageAttachments = attachments.filter((a) => a.kind === 'IMAGE');
  const videoAttachments = attachments.filter((a) => a.kind === 'VIDEO');
  const audioAttachments = attachments.filter((a) => a.kind === 'AUDIO');
  const docAttachments = attachments.filter(
    (a) => a.kind === 'PDF' || a.kind === 'DOCUMENT'
  );

  return (
    <>
      <div
        data-message-id={message.message_id}
        className={`flex w-full mb-3 gap-2 ${
          isMine ? 'justify-end' : 'justify-start'
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
                  returnLabel: isCommunity ? 'Quay lại cộng đồng' : 'Quay lại nhóm',
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
              className="border border-stone-300 shadow-2xs"
            />
          </div>
        )}

        <div
          className={`flex flex-col max-w-[85%] sm:max-w-[72%] min-w-0 ${
            isMine ? 'items-end' : 'items-start'
          }`}
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
                    returnLabel: isCommunity ? 'Quay lại cộng đồng' : 'Quay lại nhóm',
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

          <div
            className={`relative group/msg flex items-center gap-1.5 max-w-full ${
              isMine ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`relative rounded-2xl p-3 sm:p-3.5 shadow-xs text-sm break-words [overflow-wrap:anywhere] min-w-0 w-fit max-w-full ${
                isMine
                  ? 'bg-brand-burgundy text-white rounded-br-xs'
                  : 'bg-white text-stone-900 border border-stone-200 rounded-bl-xs'
              }`}
            >
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
                className={`mb-2 rounded-xl overflow-hidden ${
                  imageAttachments.length === 1
                    ? 'max-w-xs'
                    : 'grid grid-cols-2 gap-1.5'
                }`}
              >
                {imageAttachments.map((att) => (
                  <div
                    key={att.attachment_id}
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
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-5 h-5 drop-shadow-sm" />
                    </div>
                  </div>
                ))}
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
                          className={`font-semibold select-text ${
                            isMine
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
              className={`flex items-center justify-end mt-1 text-[11px] select-none ${
                isMine ? 'text-rose-200' : 'text-stone-400'
              }`}
            >
              <span>{formattedTime}</span>
            </div>
          </div>

            {/* Reaction Trigger Button (Direct & Group only - shown when no reactions yet) */}
            {!isCommunity && targetConvId > 0 && !hasActiveReactions && (
              <div className="relative shrink-0 self-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerAnchor(pickerAnchor ? null : e.currentTarget);
                  }}
                  className={`p-1.5 rounded-full text-stone-400 hover:text-brand-burgundy hover:bg-stone-100 transition-all opacity-80 sm:opacity-0 sm:group-hover/msg:opacity-100 focus:opacity-100 cursor-pointer ${
                    pickerAnchor ? 'opacity-100! bg-stone-100 text-brand-burgundy' : ''
                  }`}
                  aria-label="Bày tỏ cảm xúc"
                  title="Bày tỏ cảm xúc"
                >
                  <SmilePlus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Reaction Bar (Pills) underneath bubble, width independent */}
          {!isCommunity && hasActiveReactions && (
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
