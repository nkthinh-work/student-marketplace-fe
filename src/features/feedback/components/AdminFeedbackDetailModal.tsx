import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  ExternalLink,
  ImageIcon,
  Loader2,
  Maximize2,
  Trash2,
  User as UserIcon,
  Video as VideoIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAdminFeedbackEvidenceBlob } from '../api';
import { useAdminFeedbackDetail, useDeleteAdminFeedback } from '../hooks';
import type { AdminFeedbackListItem, FeedbackAttachment } from '../types';

interface AdminFeedbackDetailModalProps {
  feedback: AdminFeedbackListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

function formatDetailTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} • ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

interface EvidenceImageProps {
  feedbackId: number;
  attachment: FeedbackAttachment;
  onClick: () => void;
}

function FeedbackEvidenceThumbnail({ feedbackId, attachment, onClick }: EvidenceImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchBlob = useCallback(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    getAdminFeedbackEvidenceBlob(feedbackId, attachment.attachment_id, controller.signal)
      .then((blob) => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!active || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [feedbackId, attachment.attachment_id]);

  useEffect(() => {
    const cleanup = fetchBlob();
    return () => cleanup();
  }, [fetchBlob]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (loading) {
    return (
      <div className="aspect-square rounded-xl border border-brand-border bg-stone-50 flex flex-col items-center justify-center p-2 text-brand-text-muted">
        <Loader2 className="h-5 w-5 animate-spin text-brand-burgundy" />
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="aspect-square rounded-xl border border-brand-border bg-stone-50 flex flex-col items-center justify-center p-2 text-center text-brand-text-muted">
        <ImageIcon className="h-5 w-5 text-gray-400 mb-1" />
        <span className="text-[11px] text-gray-500">Không tải được ảnh</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fetchBlob();
          }}
          className="mt-1 text-[10px] font-semibold text-brand-burgundy hover:underline cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group relative aspect-square rounded-xl border border-brand-border overflow-hidden bg-stone-100 hover:opacity-95 transition-opacity cursor-pointer"
      title="Bấm để xem ảnh gốc"
    >
      <img
        src={blobUrl}
        alt="Minh chứng"
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
        <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm" />
      </div>
    </div>
  );
}

interface ImageLightboxProps {
  feedbackId: number;
  attachment: FeedbackAttachment;
  onClose: () => void;
}

function ImageLightbox({ feedbackId, attachment, onClose }: ImageLightboxProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    getAdminFeedbackEvidenceBlob(feedbackId, attachment.attachment_id, controller.signal)
      .then((blob) => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!active || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [feedbackId, attachment.attachment_id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-900 text-white overflow-hidden shadow-2xl border border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-semibold truncate">Minh chứng #{attachment.attachment_id}</p>
            <p className="text-[10px] text-zinc-400">
              {(attachment.size_bytes / (1024 * 1024)).toFixed(2)} MB &bull; {attachment.mime_type}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Đóng minh chứng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-3 overflow-hidden bg-black/40 min-h-[250px] max-h-[75vh]">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-white/80" />
              <span className="text-xs text-zinc-400">Đang tải ảnh kích thước gốc...</span>
            </div>
          ) : error || !blobUrl ? (
            <div className="text-center text-xs text-rose-400 p-4">
              Không thể tải ảnh minh chứng từ máy chủ. Vui lòng kiểm tra quyền quản trị viên.
            </div>
          ) : (
            <img
              src={blobUrl}
              alt="Minh chứng"
              className="max-h-[72vh] max-w-full rounded-lg object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const AdminFeedbackDetailModal: React.FC<AdminFeedbackDetailModalProps> = ({
  feedback,
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const { firebaseUser } = useAuth();
  const { data: detailData, isLoading } = useAdminFeedbackDetail(
    feedback?.feedback_id || 0,
    isOpen && Boolean(feedback)
  );

  const deleteMutation = useDeleteAdminFeedback();

  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<FeedbackAttachment | null>(null);
  const [videoToken, setVideoToken] = useState<string | null>(null);

  // Clear states on open/close
  useEffect(() => {
    setIsConfirmDelete(false);
    setErrorMessage(null);
    setSelectedLightboxImage(null);
  }, [feedback?.feedback_id, isOpen]);

  // Retrieve Firebase ID token for video streaming Range auth
  useEffect(() => {
    if (!isOpen || !firebaseUser) return;
    firebaseUser.getIdToken().then(setVideoToken).catch(() => {});
  }, [isOpen, firebaseUser]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !selectedLightboxImage) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedLightboxImage]);

  if (!isOpen || !feedback || typeof document === 'undefined') return null;

  const sender = detailData?.sender || feedback.sender;
  const content = detailData?.content || feedback.content;
  const createdAt = detailData?.created_at || feedback.created_at;
  const attachments = detailData?.attachments || [];

  const images = attachments.filter((a) => a.kind === 'IMAGE');
  const videos = attachments.filter((a) => a.kind === 'VIDEO');

  const handleDelete = async () => {
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(feedback.feedback_id);
      onActionComplete?.();
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMessage(typeof detail === 'string' ? detail : 'Không thể xóa phản hồi.');
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop click */}
        <button
          type="button"
          className="fixed inset-0 cursor-default"
          onClick={onClose}
          aria-label="Đóng"
        />

        <div className="relative z-10 max-h-[90vh] w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-brand-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-brand-border bg-brand-soft-pink/30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-semibold text-brand-text">
                Chi tiết Feedback #{feedback.feedback_id}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Sender Info */}
            <div className="rounded-xl border border-brand-border/70 bg-stone-50/60 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {sender.avatar_url ? (
                  <img
                    src={sender.avatar_url}
                    alt={sender.full_name}
                    className="h-10 w-10 rounded-full object-cover border border-brand-border flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-brand-soft-pink text-brand-burgundy flex items-center justify-center font-bold text-sm flex-shrink-0">
                    <UserIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-brand-text truncate">
                    {sender.full_name}
                  </p>
                  <p className="text-[11px] text-brand-text-muted">
                    ID: #{sender.user_id}
                  </p>
                </div>
              </div>

              <Link
                to={`/users/${sender.user_id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-burgundy hover:underline flex-shrink-0"
              >
                <span>Hồ sơ</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* 2. Content */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-brand-text-secondary">
                Nội dung Feedback
              </h4>
              <div className="rounded-xl border border-brand-border bg-white p-3.5 text-xs sm:text-sm text-brand-text whitespace-pre-line leading-relaxed">
                {content}
              </div>
            </div>

            {/* 3. Created Time */}
            <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>Gửi lúc: {formatDetailTime(createdAt)}</span>
            </div>

            {/* 4. Evidence Attachments */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-brand-text-secondary">
                Minh chứng ({attachments.length})
              </h4>

              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-burgundy" />
                </div>
              ) : attachments.length === 0 ? (
                <p className="text-xs text-brand-text-muted italic">
                  Không có ảnh hoặc video minh chứng kèm theo.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Images Grid */}
                  {images.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-brand-text-muted flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> Ảnh minh chứng ({images.length})
                      </span>
                      <div
                        className={`grid gap-2 ${
                          images.length === 1
                            ? 'grid-cols-1 max-w-[240px]'
                            : images.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                        }`}
                      >
                        {images.map((img) => (
                          <FeedbackEvidenceThumbnail
                            key={img.attachment_id}
                            feedbackId={feedback.feedback_id}
                            attachment={img}
                            onClick={() => setSelectedLightboxImage(img)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {videos.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-brand-text-muted flex items-center gap-1">
                        <VideoIcon className="h-3 w-3" /> Video minh chứng ({videos.length})
                      </span>
                      {videos.map((vid) => {
                        const videoSrc = videoToken
                          ? `${vid.stream_url}?token=${encodeURIComponent(videoToken)}`
                          : vid.stream_url;
                        return (
                          <div
                            key={vid.attachment_id}
                            className="rounded-xl border border-brand-border overflow-hidden bg-black"
                          >
                            <video
                              src={videoSrc}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full max-h-64 object-contain"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-4 sm:px-5 py-3 border-t border-brand-border bg-stone-50/80 flex items-center justify-between gap-3 shrink-0">
            {isConfirmDelete ? (
              <div className="w-full flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-red-600 truncate">
                  Xóa Feedback này khỏi hệ thống?
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsConfirmDelete(false)}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {deleteMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span>Xóa vĩnh viễn</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa Feedback</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-brand-border bg-white text-xs sm:text-sm font-semibold text-brand-text hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full Image Lightbox */}
      {selectedLightboxImage && (
        <ImageLightbox
          feedbackId={feedback.feedback_id}
          attachment={selectedLightboxImage}
          onClose={() => setSelectedLightboxImage(null)}
        />
      )}
    </>,
    document.body
  );
};
