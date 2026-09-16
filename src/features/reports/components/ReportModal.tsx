import React, { useEffect, useState } from 'react';
import { AlertCircle, Flag, Loader2, X } from 'lucide-react';
import { REPORT_REASON_LABELS, REPORT_REASON_MATRIX, REPORT_TARGET_LABELS } from '../constants';
import { useCreateReport } from '../hooks';
import type { ReportReason, ReportTargetType } from '../types';

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

  const createReportMutation = useCreateReport();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDescription('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  // If targetType changes while open, validate and clear any reason not allowed for new targetType
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
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allowedReasons = REPORT_REASON_MATRIX[targetType] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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

    try {
      await createReportMutation.mutateAsync({
        target_type: targetType,
        target_id: targetId,
        reason: reason as ReportReason,
        description: trimmedDesc || null,
      });

      // Successful 201: close modal and trigger parent feedback
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMsg(
        typeof detail === 'string'
          ? detail
          : 'Không thể gửi báo cáo. Vui lòng thử lại sau.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[520px] max-h-[calc(100dvh-24px)] flex flex-col rounded-3xl bg-brand-warm-white p-5 sm:p-6 shadow-2xl border border-brand-border my-auto overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with shrink-safe layout: icon (shrink-0), text (min-w-0 flex-1), close (shrink-0) */}
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
            onClick={onClose}
            aria-label="Đóng hộp thoại báo cáo"
            className="shrink-0 rounded-full p-2 text-brand-text-muted hover:bg-brand-soft-pink hover:text-brand-text transition-colors -mr-1 -mt-1 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mt-3.5 shrink-0 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Form Body - scrollable vertically when viewport is compact */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto min-h-0 flex-1 pr-0.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
              Lý do báo cáo <span className="text-brand-burgundy">*</span>
            </label>
            <div className="space-y-2">
              {allowedReasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition-all ${
                    reason === r
                      ? 'border-brand-burgundy bg-brand-soft-pink/50 text-brand-burgundy font-semibold shadow-2xs'
                      : 'border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink/20 hover:border-brand-burgundy/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => {
                      setReason(r);
                      setErrorMsg(null);
                    }}
                    className="h-4 w-4 accent-brand-burgundy text-brand-burgundy focus:ring-brand-burgundy shrink-0 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm select-none">
                    {REPORT_REASON_LABELS[r]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
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
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder={
                reason === 'OTHER'
                  ? 'Vui lòng cung cấp chi tiết vi phạm để Ban quản trị xem xét...'
                  : 'Cung cấp thêm thông tin hoặc bằng chứng (không bắt buộc)...'
              }
              className="w-full rounded-2xl border border-brand-border bg-white p-3 text-xs sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:border-brand-burgundy focus:outline-hidden focus:ring-2 focus:ring-brand-burgundy/20 resize-none transition-all shadow-2xs"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive rounded-2xl px-4 py-2.5 text-xs font-semibold text-brand-text-muted hover:bg-brand-soft-pink/50 hover:text-brand-text transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createReportMutation.isPending}
              className="btn-interactive inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy-dark px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {createReportMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Flag className="h-3.5 w-3.5" />
                  <span>Gửi báo cáo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
