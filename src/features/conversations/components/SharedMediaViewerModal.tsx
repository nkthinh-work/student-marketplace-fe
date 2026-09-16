import React, { useState, useMemo } from 'react';
import {
  X,
  Image as ImageIcon,
  Mic,
  FileText,
  Download,
  Loader2,
  Eye,
  Play,
} from 'lucide-react';
import { useSharedAttachments, useSharedAttachmentsSummary } from '../hooks';
import { AudioBubble } from './AudioBubble';
import { requestAttachmentDownload } from '../download';
import { FileTypeIcon } from './FileTypeIcon';

interface SharedMediaViewerModalProps {
  conversationId: number;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'media' | 'audio' | 'file';
}

export const SharedMediaViewerModal: React.FC<SharedMediaViewerModalProps> = ({
  conversationId,
  isOpen,
  onClose,
  initialTab = 'media',
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'file'>(
    initialTab
  );
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    kind: 'IMAGE' | 'VIDEO';
    attachment_id: number;
    original_name: string;
  } | null>(null);
  const [downloadingItemId, setDownloadingItemId] = useState<number | null>(null);

  const { data: summary } = useSharedAttachmentsSummary(conversationId);

  // Map active tab to API filter kind
  const apiKind =
    activeTab === 'media'
      ? 'MEDIA'
      : activeTab === 'audio'
      ? 'AUDIO'
      : 'FILE';

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSharedAttachments(conversationId, apiKind, 30);

  const items = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.items);
  }, [data]);

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50/70">
          <h3 className="text-sm font-bold text-stone-900">
            Nội dung đã chia sẻ
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-white px-2">
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'media'
                ? 'border-brand-burgundy text-brand-burgundy'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Ảnh & video</span>
            {summary?.media_count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                {summary.media_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'audio'
                ? 'border-brand-burgundy text-brand-burgundy'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Âm thanh</span>
            {summary?.audio_count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                {summary.audio_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'file'
                ? 'border-brand-burgundy text-brand-burgundy'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tệp</span>
            {summary?.file_count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                {summary.file_count}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[250px] max-h-[60vh]">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-brand-burgundy" />
              <span>Đang tải nội dung...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs">
              Chưa có {activeTab === 'media' ? 'ảnh hoặc video' : activeTab === 'audio' ? 'tin nhắn thoại' : 'tệp tin'} nào được chia sẻ.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Media Tab Grid */}
              {activeTab === 'media' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {items.map((item) => (
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
                            <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-md font-mono">
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
                            <Eye className="w-5 h-5 drop-shadow-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Audio Tab List */}
              {activeTab === 'audio' && (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.attachment_id}
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
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

              {/* Files Tab List */}
              {activeTab === 'file' && (
                <div className="space-y-2">
                  {items.map((item) => {
                    return (
                      <div
                        key={item.attachment_id}
                        className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileTypeIcon
                            filename={item.original_name}
                            mimeType={item.mime_type}
                            size="md"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-900 truncate">
                              {item.original_name}
                            </p>
                            <p className="text-[10px] text-stone-500 mt-0.5">
                              <span>{formatFileSize(item.size_bytes)}</span>
                              <span className="mx-1.5">·</span>
                              <span>{item.sender_name || 'Người dùng'}</span>
                              <span className="mx-1.5">·</span>
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
                                conversationId,
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
                          className="p-2 text-stone-500 hover:text-brand-burgundy hover:bg-white rounded-xl border border-transparent hover:border-stone-200 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                          title="Tải về"
                        >
                          {downloadingItemId === item.attachment_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
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
                    className="py-1.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tải thêm...</span>
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
                      conversationId,
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
    </div>
  );
};
