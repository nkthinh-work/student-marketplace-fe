import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Film,
  Flag,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import {
  REPORT_REASON_LABELS,
  REPORT_REASON_MATRIX,
  REPORT_TARGET_LABELS,
} from '../constants';
import { useCreateReport, useUploadReportEvidence } from '../hooks';
import type { ReportReason, ReportTargetType } from '../types';

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_VIDEO_COUNT = 1;
const MAX_VIDEO_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30MB
const MAX_VIDEO_DURATION_SECONDS = 60;
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

interface EvidenceFileItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface EvidenceVideoItem {
  id: string;
  file: File;
  previewUrl: string;
  duration?: number;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
  targetTitle?: string;
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onSuccess,
}) => {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Evidence files state (images & video)
  const [imageItems, setImageItems] = useState<EvidenceFileItem[]>([]);
  const [videoItem, setVideoItem] = useState<EvidenceVideoItem | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // Explicit partial-success tracking (Correction 13)
  const [createdReportId, setCreatedReportId] = useState<number | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const imageItemsRef = useRef<EvidenceFileItem[]>([]);
  imageItemsRef.current = imageItems;
  const videoItemRef = useRef<EvidenceVideoItem | null>(null);
  videoItemRef.current = videoItem;

  const createReportMutation = useCreateReport();
  const uploadEvidenceMutation = useUploadReportEvidence();

  // Helper to safely revoke all object URLs
  const cleanupObjectUrls = () => {
    imageItemsRef.current.forEach((item) => {
      try {
        URL.revokeObjectURL(item.previewUrl);
      } catch {
        // Ignore revocation errors
      }
    });
    if (videoItemRef.current) {
      try {
        URL.revokeObjectURL(videoItemRef.current.previewUrl);
      } catch {
        // Ignore revocation errors
      }
    }
  };

  // Reset form when dialog opens or target changes
  useEffect(() => {
    if (isOpen) {
      cleanupObjectUrls();
      setReason('');
      setDescription('');
      setErrorMsg(null);
      setImageItems([]);
      setVideoItem(null);
      setEvidenceError(null);
      setCreatedReportId(null);
      setIsUploadingEvidence(false);
    } else {
      cleanupObjectUrls();
    }
    return () => {
      cleanupObjectUrls();
    };
  }, [isOpen, targetId, targetType]);

  // If targetType changes while open, validate and clear any reason not allowed
  useEffect(() => {
    if (isOpen && reason) {
      const allowed = REPORT_REASON_MATRIX[targetType] || [];
      if (!allowed.includes(reason as ReportReason)) {
        setReason('');
      }
    }
  }, [targetType, isOpen, reason]);

  // Keyboard Escape support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, createdReportId]);

  if (!isOpen) return null;

  const allowedReasons = REPORT_REASON_MATRIX[targetType] || [];

  const handleModalClose = () => {
    cleanupObjectUrls();
    // If a report was already created in this session, signal success to parent
    if (createdReportId != null) {
      onSuccess?.();
    }
    onClose();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvidenceError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }

    if (imageItems.length + files.length > MAX_IMAGE_COUNT) {
      setEvidenceError(
        `Chỉ được chọn tối đa ${MAX_IMAGE_COUNT} ảnh minh chứng. Hiện đã có ${imageItems.length} ảnh.`
      );
      return;
    }

    const newItems: EvidenceFileItem[] = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        setEvidenceError(
          `Định dạng tệp "${file.name}" không được hỗ trợ. Vui lòng chỉ chọn ảnh JPEG, PNG hoặc WebP.`
        );
        return;
      }
      if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        setEvidenceError(
          `Dung lượng ảnh "${file.name}" vượt quá giới hạn 10MB.`
        );
        return;
      }

      newItems.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setImageItems((prev) => [...prev, ...newItems]);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvidenceError(null);
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (files.length > MAX_VIDEO_COUNT) {
      setEvidenceError('Mỗi báo cáo chỉ được đính kèm 1 video.');
      return;
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }

    const file = files[0];
    if (!file) return;

    const isAllowedMime = ALLOWED_VIDEO_MIME_TYPES.includes(file.type);
    const hasAllowedExt = /\.(mp4|webm|mov|qt)$/i.test(file.name);

    if (!isAllowedMime && !hasAllowedExt) {
      setEvidenceError(
        `Định dạng video "${file.name}" không được hỗ trợ. Vui lòng chọn tệp MP4, WebM hoặc MOV.`
      );
      return;
    }

    if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
      setEvidenceError('Video không được vượt quá 30 MB.');
      return;
    }

    // Client-side duration validation via loadedmetadata
    const tempUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      const duration = tempVideo.duration;
      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        URL.revokeObjectURL(tempUrl);
        setEvidenceError('Video chỉ được dài tối đa 60 giây.');
        return;
      }
      // Replace existing video if present
      if (videoItemRef.current) {
        try {
          URL.revokeObjectURL(videoItemRef.current.previewUrl);
        } catch {
          // Ignore
        }
      }
      setVideoItem({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: tempUrl,
        duration,
      });
    };
    tempVideo.onerror = () => {
      // If browser can't parse metadata locally, still allow backend authority to validate
      if (videoItemRef.current) {
        try {
          URL.revokeObjectURL(videoItemRef.current.previewUrl);
        } catch {
          // Ignore
        }
      }
      setVideoItem({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: tempUrl,
      });
    };
    tempVideo.src = tempUrl;
  };

  const handleRemoveImage = (idToRemove: string) => {
    setEvidenceError(null);
    setImageItems((prev) => {
      const item = prev.find((i) => i.id === idToRemove);
      if (item) {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          // Ignore
        }
      }
      return prev.filter((i) => i.id !== idToRemove);
    });
  };

  const handleRemoveVideo = () => {
    setEvidenceError(null);
    if (videoItem) {
      try {
        URL.revokeObjectURL(videoItem.previewUrl);
      } catch {
        // Ignore
      }
      setVideoItem(null);
    }
  };

  const getAllEvidenceFiles = (): File[] => {
    const files: File[] = [...imageItems.map((item) => item.file)];
    if (videoItem) {
      files.push(videoItem.file);
    }
    return files;
  };

  const handleRetryEvidenceUpload = async () => {
    const allFiles = getAllEvidenceFiles();
    if (!createdReportId || !allFiles.length) return;
    setErrorMsg(null);
    setEvidenceError(null);
    setIsUploadingEvidence(true);

    try {
      await uploadEvidenceMutation.mutateAsync({
        reportId: createdReportId,
        files: allFiles,
      });
      cleanupObjectUrls();
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setEvidenceError(
        typeof detail === 'string'
          ? detail
          : 'Không thể tải lên tệp minh chứng. Bạn có thể thử lại hoặc bỏ qua.'
      );
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setEvidenceError(null);

    // If report is already created, button acts as evidence upload retry
    if (createdReportId != null) {
      await handleRetryEvidenceUpload();
      return;
    }

    if (!reason) {
      setErrorMsg('Vui lòng chọn lý do báo cáo.');
      return;
    }

    const trimmedDesc = description.trim();

    if (reason === 'OTHER' && !trimmedDesc) {
      setErrorMsg("Vui lòng nhập mô tả chi tiết cho lý do 'Khác'.");
      return;
    }

    if (trimmedDesc.length > 1000) {
      setErrorMsg('Mô tả chi tiết không được vượt quá 1000 ký tự.');
      return;
    }

    let reportId: number;
    try {
      const newReport = await createReportMutation.mutateAsync({
        target_type: targetType,
        target_id: targetId,
        reason: reason as ReportReason,
        description: trimmedDesc || null,
      });
      reportId = newReport.report_id;
      setCreatedReportId(reportId);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMsg(
        typeof detail === 'string'
          ? detail
          : 'Không thể gửi báo cáo. Vui lòng thử lại sau.'
      );
      return;
    }

    // Report is now created. If no evidence files attached, finish immediately.
    const allFiles = getAllEvidenceFiles();
    if (!allFiles.length) {
      cleanupObjectUrls();
      onClose();
      onSuccess?.();
      return;
    }

    // Attempt evidence upload
    setIsUploadingEvidence(true);
    try {
      await uploadEvidenceMutation.mutateAsync({
        reportId,
        files: allFiles,
      });
      cleanupObjectUrls();
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setEvidenceError(
        typeof detail === 'string'
          ? detail
          : 'Báo cáo đã gửi thành công nhưng không thể tải lên tệp minh chứng. Bạn có thể thử lại hoặc đóng hộp thoại.'
      );
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const isSubmittingReport = createReportMutation.isPending;
  const isBusy = isSubmittingReport || isUploadingEvidence;
  const isPartialSuccess = createdReportId != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={handleModalClose}
    >
      <div
        className="relative w-full max-w-[540px] max-h-[calc(100dvh-24px)] flex flex-col rounded-3xl bg-brand-warm-white p-5 sm:p-6 shadow-2xl border border-brand-border my-auto overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-brand-border/60 pb-3.5 shrink-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-burgundy/10 text-brand-burgundy">
              <Flag className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-base sm:text-lg font-bold text-brand-text leading-snug">
                Báo cáo {REPORT_TARGET_LABELS[targetType]}
              </h3>
              {targetTitle && (
                <p
                  className="text-xs text-brand-text-muted mt-0.5 leading-relaxed break-words [overflow-wrap:anywhere] line-clamp-2"
                  title={targetTitle}
                >
                  {targetTitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            aria-label="Đóng hộp thoại báo cáo"
            className="shrink-0 rounded-full p-2 text-brand-text-muted hover:bg-brand-soft-pink hover:text-brand-text transition-colors -mr-1 -mt-1 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Partial Success Alert Banner */}
        {isPartialSuccess && (
          <div className="mt-3 shrink-0 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="leading-relaxed">
              <span className="font-bold">Báo cáo đã được tạo thành công (#{createdReportId}).</span>{' '}
              {evidenceError ? (
                <span>Tải ảnh minh chứng gặp sự cố. Bạn có thể thử lại tải ảnh hoặc đóng để hoàn tất.</span>
              ) : (
                <span>Đang tải lên ảnh minh chứng kèm theo...</span>
              )}
            </div>
          </div>
        )}

        {/* Main Error Banner */}
        {errorMsg && (
          <div className="mt-3 shrink-0 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Evidence Error Banner */}
        {evidenceError && (
          <div className="mt-3 shrink-0 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium leading-relaxed">{evidenceError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto min-h-0 flex-1 pr-0.5">
          {/* Reason selection (disabled if partial-success) */}
          <div>
            <label className="block text-xs font-semibold text-brand-text mb-2">
              Lý do báo cáo <span className="text-brand-burgundy">*</span>
            </label>
            <div className="space-y-2">
              {allowedReasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition-all ${
                    isPartialSuccess ? 'opacity-60 cursor-not-allowed bg-gray-50 border-brand-border' : ''
                  } ${
                    reason === r
                      ? 'border-brand-burgundy bg-brand-soft-pink/50 text-brand-burgundy font-semibold shadow-2xs'
                      : 'border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink/20 hover:border-brand-burgundy/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r}
                    disabled={isPartialSuccess}
                    checked={reason === r}
                    onChange={() => {
                      if (!isPartialSuccess) {
                        setReason(r);
                        setErrorMsg(null);
                      }
                    }}
                    className="h-4 w-4 accent-brand-burgundy text-brand-burgundy focus:ring-brand-burgundy shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-xs sm:text-sm select-none">
                    {REPORT_REASON_LABELS[r]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Description input (disabled if partial-success) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-brand-text">
                Mô tả chi tiết{' '}
                {reason === 'OTHER' && (
                  <span className="text-brand-burgundy font-bold">*</span>
                )}
              </label>
              <span className="text-[11px] text-brand-text-muted tabular-nums">
                {description.length}/1000
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              disabled={isPartialSuccess}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder={
                reason === 'OTHER'
                  ? 'Vui lòng cung cấp chi tiết vi phạm để Ban quản trị xem xét...'
                  : 'Cung cấp thêm thông tin hoặc bằng chứng (không bắt buộc)...'
              }
              className="w-full rounded-2xl border border-brand-border bg-white p-3 text-xs sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:border-brand-burgundy focus:outline-hidden focus:ring-2 focus:ring-brand-burgundy/20 resize-none transition-all shadow-2xs disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Evidence Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-brand-text">
                Bằng chứng <span className="text-brand-text-muted font-normal lowercase">(không bắt buộc)</span>
              </label>
              <span className="text-[11px] text-brand-text-muted tabular-nums">
                {imageItems.length}/5 ảnh &bull; {videoItem ? '1/1' : '0/1'} video
              </span>
            </div>

            {/* Dual Add Buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isBusy || imageItems.length >= MAX_IMAGE_COUNT}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-white hover:bg-brand-soft-pink/40 hover:border-brand-burgundy/40 text-brand-text-secondary hover:text-brand-burgundy text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Thêm ảnh ({imageItems.length}/5)</span>
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-white hover:bg-brand-soft-pink/40 hover:border-brand-burgundy/40 text-brand-text-secondary hover:text-brand-burgundy text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                <Film className="h-3.5 w-3.5" />
                <span>{videoItem ? 'Đổi video' : 'Thêm video'} (tối đa 1)</span>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isBusy}
            />

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoSelect}
              className="hidden"
              disabled={isBusy}
            />

            {/* Video Preview Card */}
            {videoItem && (
              <div className="mb-2 flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border border-brand-border/80 bg-white shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-burgundy/10 text-brand-burgundy">
                    <Film className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-brand-text truncate" title={videoItem.file.name}>
                      {videoItem.file.name}
                    </p>
                    <p className="text-[10px] text-brand-text-muted">
                      {(videoItem.file.size / (1024 * 1024)).toFixed(1)} MB
                      {videoItem.duration != null && ` • ${Math.round(videoItem.duration)}s`}
                    </p>
                  </div>
                </div>
                {!isBusy && (
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-brand-text-muted hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                    title="Xóa video này"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Image Previews Grid */}
            {imageItems.length > 0 && (
              <div className="grid grid-cols-5 gap-2 pt-1">
                {imageItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-2xl border border-brand-border/80 bg-white overflow-hidden shadow-2xs"
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Minh chứng ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {!isBusy && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(item.id)}
                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-[11px] text-brand-text-muted">
              Thêm tối đa 5 ảnh và 1 video. Ảnh tối đa 10 MB/ảnh. Video tối đa 60 giây, 30 MB.
            </p>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border/60 shrink-0">
            {isPartialSuccess ? (
              <>
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isBusy}
                  className="btn-interactive rounded-2xl px-4 py-2.5 text-xs font-semibold text-brand-text-muted hover:bg-brand-soft-pink/50 hover:text-brand-text transition-colors cursor-pointer disabled:opacity-50"
                >
                  Bỏ qua & Đóng
                </button>
                <button
                  type="button"
                  onClick={handleRetryEvidenceUpload}
                  disabled={isBusy || (!imageItems.length && !videoItem)}
                  className="btn-interactive inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy-dark px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUploadingEvidence ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang tải tệp...</span>
                    </>
                  ) : (
                    <span>Thử tải lại minh chứng</span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isBusy}
                  className="btn-interactive rounded-2xl px-4 py-2.5 text-xs font-semibold text-brand-text-muted hover:bg-brand-soft-pink/50 hover:text-brand-text transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="btn-interactive inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy-dark px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang gửi báo cáo...</span>
                    </>
                  ) : isUploadingEvidence ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang tải minh chứng...</span>
                    </>
                  ) : (
                    <span>Gửi báo cáo</span>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
