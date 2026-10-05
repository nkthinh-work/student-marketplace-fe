import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Image as ImageIcon,
  Mic,
  FileText,
  Loader2,
  Download,
  Eye,
  ExternalLink,
  Play,
} from 'lucide-react';
import {
  useConversationPresence,
  useSharedAttachments,
  useSharedAttachmentsSummary,
} from '../hooks';
import { ConversationDetailResponse } from '../types';
import { AudioBubble } from './AudioBubble';
import { requestAttachmentDownload } from '../download';
import { FileTypeIcon } from './FileTypeIcon';
import { Avatar } from '@/components/common/Avatar';

interface DirectInfoDrawerProps {
  conversation: ConversationDetailResponse;
  isOpen: boolean;
  onClose: () => void;
  onBeforeNavigateAway?: () => void;
}

export const DirectInfoDrawer: React.FC<DirectInfoDrawerProps> = ({
  conversation,
  isOpen,
  onClose,
  onBeforeNavigateAway,
}) => {
  const navigate = useNavigate();
  const convId = conversation.conversation_id;
  const otherUser = conversation.other_participant;

  const [activeMediaCategory, setActiveMediaCategory] = useState<'media' | 'audio' | 'file'>('media');
  const [downloadingItemId, setDownloadingItemId] = useState<number | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    kind: 'IMAGE' | 'VIDEO';
    attachment_id?: number;
    original_name?: string;
  } | null>(null);

  const { data: presenceData } = useConversationPresence(convId);
  const { data: attachmentsSummary } = useSharedAttachmentsSummary(convId);

  const isOtherOnline = Boolean(
    otherUser && presenceData?.online_user_ids?.includes(otherUser.user_id)
  );

  const apiCategory =
    activeMediaCategory === 'media'
      ? 'media'
      : activeMediaCategory === 'audio'
      ? 'audio'
      : 'file';

  const {
    data: attachmentsData,
    isLoading: isAttachmentsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSharedAttachments(convId, apiCategory, 30);

  const attachmentItems = useMemo(() => {
    if (!attachmentsData?.pages) return [];
    return attachmentsData.pages.flatMap((p) => p.items);
  }, [attachmentsData]);

  if (!isOpen) return null;

  const navigateToProfile = () => {
    if (!otherUser?.public_id) return;
    onBeforeNavigateAway?.();
    onClose();
    navigate(`/users/${otherUser.public_id}`, {
      state: {
        fromApp: true,
        returnTo: `/messages/${convId}`,
        returnLabel: 'Quay lại cuộc trò chuyện',
        source: 'direct-info',
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/60 shrink-0">
            <h3 className="text-sm font-bold text-stone-900">
              Thông tin cuộc trò chuyện
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Identity Card */}
            <div className="flex flex-col items-center text-center p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div className="relative mb-3">
                <Avatar
                  src={otherUser?.avatar_url}
                  name={otherUser?.full_name}
                  size="xl"
                  className="w-16 h-16 sm:w-16 sm:h-16 border-2 border-white shadow-xs"
                />
                {isOtherOnline && (
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                    title="Đang hoạt động"
                  />
                )}
              </div>

              <h4 className="text-base font-bold text-stone-900">
                {otherUser?.full_name || 'Người dùng'}
              </h4>

              {isOtherOnline ? (
                <span className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Đang hoạt động
                </span>
              ) : (
                <span className="text-xs text-stone-400 mt-0.5">
                  Không hoạt động
                </span>
              )}

              <button
                type="button"
                onClick={navigateToProfile}
                className="mt-3 py-1.5 px-3.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>Xem trang cá nhân</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </button>
            </div>

            {/* Shared Media Section */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                File & phương tiện
              </h5>

              {/* 3 Inner Categories */}
              <div className="flex gap-1 p-1 bg-stone-50 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveMediaCategory('media')}
                  className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    activeMediaCategory === 'media'
                      ? 'bg-white text-brand-burgundy shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>Ảnh & video</span>
                  {attachmentsSummary?.media_count !== undefined && (
                    <span className="text-[10px] opacity-75">({attachmentsSummary.media_count})</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaCategory('audio')}
                  className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    activeMediaCategory === 'audio'
                      ? 'bg-white text-brand-burgundy shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>Âm thanh</span>
                  {attachmentsSummary?.audio_count !== undefined && (
                    <span className="text-[10px] opacity-75">({attachmentsSummary.audio_count})</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMediaCategory('file')}
                  className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                    activeMediaCategory === 'file'
                      ? 'bg-white text-brand-burgundy shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Tệp</span>
                  {attachmentsSummary?.file_count !== undefined && (
                    <span className="text-[10px] opacity-75">({attachmentsSummary.file_count})</span>
                  )}
                </button>
              </div>

              {/* Content List/Grid */}
              {isAttachmentsLoading ? (
                <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-burgundy" />
                  <span>Đang tải nội dung...</span>
                </div>
              ) : attachmentItems.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs">
                  Chưa có {activeMediaCategory === 'media' ? 'ảnh hoặc video' : activeMediaCategory === 'audio' ? 'tin nhắn thoại' : 'tệp tin'} nào được chia sẻ.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Media Grid */}
                  {activeMediaCategory === 'media' && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {attachmentItems.map((item) => (
                        <div
                          key={item.attachment_id}
                          className="relative group rounded-xl overflow-hidden bg-stone-100 aspect-square border border-stone-200"
                        >
                          {item.kind === 'VIDEO' ? (
                            <div
                              className="w-full h-full flex items-center justify-center bg-black/80 cursor-pointer relative group/vid"
                              onClick={() =>
                                setPreviewMedia({
                                  url: item.url,
                                  kind: 'VIDEO',
                                  attachment_id: item.attachment_id,
                                  original_name: item.original_name,
                                })
                              }
                            >
                              <video
                                src={item.url}
                                className="w-full h-full object-cover opacity-85 group-hover/vid:opacity-100 transition-opacity"
                                preload="metadata"
                              />
                              <div className="absolute inset-0 bg-black/30 group-hover/vid:bg-black/15 flex flex-col items-center justify-center transition-colors">
                                <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-white mb-0.5 group-hover/vid:scale-110 transition-transform shadow-md">
                                  <Play className="w-4 h-4 fill-white ml-0.5" />
                                </div>
                                <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                                  Video
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="w-full h-full cursor-pointer relative"
                              onClick={() =>
                                setPreviewMedia({
                                  url: item.url,
                                  kind: 'IMAGE',
                                  attachment_id: item.attachment_id,
                                  original_name: item.original_name,
                                })
                              }
                            >
                              <img
                                src={item.url}
                                alt={item.original_name}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4 drop-shadow-sm" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Audio List */}
                  {activeMediaCategory === 'audio' && (
                    <div className="space-y-2">
                      {attachmentItems.map((item) => (
                        <div
                          key={item.attachment_id}
                          className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-[10px] text-stone-500">
                            <span className="font-semibold text-stone-700">
                              {item.sender_name || 'Người dùng'}
                            </span>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                          <AudioBubble
                            url={item.url}
                            attachmentId={item.attachment_id}
                            durationMs={item.duration_ms}
                            isMine={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Files List */}
                  {activeMediaCategory === 'file' && (
                    <div className="space-y-1.5">
                      {attachmentItems.map((item) => {
                        return (
                          <div
                            key={item.attachment_id}
                            className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2.5 hover:border-stone-300 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileTypeIcon
                                filename={item.original_name}
                                mimeType={item.mime_type}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-stone-900 truncate">
                                  {item.original_name}
                                </p>
                                <p className="text-[10px] text-stone-500 mt-0.5 truncate">
                                  <span>{formatFileSize(item.size_bytes)}</span>
                                  <span className="mx-1">·</span>
                                  <span>{formatDate(item.created_at)}</span>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                if (downloadingItemId) return;
                                try {
                                  setDownloadingItemId(item.attachment_id);
                                  await requestAttachmentDownload(
                                    convId,
                                    item.attachment_id,
                                    item.original_name
                                  );
                                } catch {
                                  // Handled in requestAttachmentDownload
                                } finally {
                                  setDownloadingItemId(null);
                                }
                              }}
                              disabled={downloadingItemId === item.attachment_id}
                              className="p-1.5 text-stone-500 hover:text-brand-burgundy hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                              title="Tải về"
                            >
                              {downloadingItemId === item.attachment_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasNextPage && (
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="py-1 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tải...</span>
                          </>
                        ) : (
                          <span>Tải thêm</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Media Preview (Image & Video) */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (downloadingItemId) return;
                if (previewMedia.attachment_id) {
                  try {
                    setDownloadingItemId(previewMedia.attachment_id);
                    await requestAttachmentDownload(
                      convId,
                      previewMedia.attachment_id,
                      previewMedia.original_name
                    );
                  } catch {
                    // Handled in requestAttachmentDownload
                  } finally {
                    setDownloadingItemId(null);
                  }
                } else {
                  window.open(previewMedia.url, '_blank');
                }
              }}
              disabled={Boolean(downloadingItemId)}
              className="h-10 px-3.5 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center gap-1.5 transition-colors text-xs font-medium backdrop-blur-xs cursor-pointer disabled:opacity-50"
              title="Tải tệp xuống thiết bị"
            >
              {downloadingItemId === previewMedia.attachment_id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Tải xuống</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDownloadingItemId(null);
                setPreviewMedia(null);
              }}
              className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {previewMedia.kind === 'VIDEO' ? (
            <video
              src={previewMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewMedia.url}
              alt="Xem ảnh đính kèm"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
};
