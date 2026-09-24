import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { StreakFlame } from './StreakFlame';
import {
  useMyTodayDailyNeed,
  useMyDailyNeedSummary,
  useUpsertDailyNeed,
  useDeleteDailyNeed,
} from '../hooks';
import { useCurrentUser } from '@/features/users/hooks';

interface DailyNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJournalPublished?: (checkinCreated: boolean) => void;
}

export const DailyNeedModal: React.FC<DailyNeedModalProps> = ({
  isOpen,
  onClose,
  onJournalPublished,
}) => {
  const { data: currentUser } = useCurrentUser();
  const { data: myNote, isLoading: isNoteLoading } = useMyTodayDailyNeed(isOpen);
  const { data: journalSummary } = useMyDailyNeedSummary(isOpen);
  const hasCheckedInToday = Boolean(journalSummary?.has_checked_in_today);
  const upsertMutation = useUpsertDailyNeed(currentUser?.user_id);
  const deleteMutation = useDeleteDailyNeed(currentUser?.user_id);

  const [content, setContent] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(myNote?.content || '');
      setErrorMessage(null);
      setIsDeleting(false);
    }
  }, [isOpen, myNote]);

  // Robust scroll-preserving body lock
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(myNote);
  const charCount = content.length;
  const isTooLong = charCount > 120;
  const isSubmitting = upsertMutation.isPending || deleteMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();

    if (!trimmed) {
      setErrorMessage('Vui lòng nhập nội dung nhật ký của bạn.');
      return;
    }
    if (trimmed.length > 120) {
      setErrorMessage('Nội dung tối đa 120 ký tự.');
      return;
    }

    try {
      setErrorMessage(null);
      const res = await upsertMutation.mutateAsync({ content: trimmed });
      onJournalPublished?.(Boolean(res?.checkin_created));
      onClose();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail || 'Không thể lưu nhật ký. Vui lòng thử lại.';
      setErrorMessage(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  const handleDelete = async () => {
    try {
      setErrorMessage(null);
      await deleteMutation.mutateAsync();
      onClose();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail || 'Không thể xóa nhật ký. Vui lòng thử lại.';
      setErrorMessage(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };


  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-need-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200/80 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-brand-burgundy flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="daily-need-modal-title"
                className="text-base font-bold text-stone-900 tracking-tight"
              >
                Nhật ký hôm nay
              </h3>
              <p className="text-xs text-stone-500">
                Ghi lại một dòng chia sẻ, tìm kiếm hoặc trạng thái hôm nay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="daily-need-content"
              className="block text-xs font-semibold text-stone-700 mb-1.5"
            >
              Hôm nay bạn muốn chia sẻ điều gì?
            </label>
            <textarea
              id="daily-need-content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting || isNoteLoading}
              maxLength={120}
              placeholder="VD: Hôm nay cần tìm giáo trình Giải tích, Đang tìm bàn học nhỏ phòng trọ..."
              className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50/50 text-base md:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy transition-all resize-none"
            />
            {/* Helper & Counter Footer */}
            <div className="mt-2 space-y-1 text-[11px] sm:text-xs text-stone-400">
              {/* Line 1: Streak helper & Character counter */}
              <div className="flex items-center justify-between gap-2 leading-tight">
                <span className="min-w-0 truncate text-stone-500 select-none inline-flex items-center gap-1">
                  {hasCheckedInToday ? (
                    <>
                      <span>Bạn đã giữ chuỗi hôm nay</span>
                      <StreakFlame streakCount={1} isActive={true} size={13} />
                    </>
                  ) : (
                    <>
                      <span>Không đăng nhật ký mất chuỗi ráng chịu</span>
                      <StreakFlame streakCount={0} isActive={false} size={13} />
                    </>
                  )}
                </span>
                <span
                  className={`shrink-0 tabular-nums text-right font-medium ${
                    isTooLong ? 'text-rose-500 font-semibold' : 'text-stone-400'
                  }`}
                >
                  {charCount}/120
                </span>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
            {isEditing ? (
              isDeleting ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">Chắc chắn xóa?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    disabled={isSubmitting}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-all"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa nhật ký</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-semibold transition-colors"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim() || isTooLong}
                className="px-4 py-2 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isEditing ? 'Cập nhật' : 'Đăng nhật ký'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

