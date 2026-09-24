import React, { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDeleteMyFeedback, useMyFeedbacks } from '../hooks';
import type { MyFeedbackItem } from '../types';
import { Loader2, Trash2 } from 'lucide-react';

function formatTime(dateStr: string): string {
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

export const MyFeedbackSection: React.FC = () => {
  const { firebaseUser } = useAuth();
  const { data, isLoading } = useMyFeedbacks(Boolean(firebaseUser));
  const deleteMutation = useDeleteMyFeedback();

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  if (!firebaseUser) return null;

  const items: MyFeedbackItem[] = data?.items || [];
  if (!isLoading && items.length === 0) return null;

  const handleDelete = async (feedbackId: number) => {
    try {
      await deleteMutation.mutateAsync(feedbackId);
      setConfirmDeleteId(null);
    } catch {
      // Handled by mutation / api error
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-brand-border/60">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-brand-text-secondary">
          Feedback của bạn ({items.length})
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-brand-burgundy" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const imgCount = item.attachments.filter((a) => a.kind === 'IMAGE').length;
            const vidCount = item.attachments.filter((a) => a.kind === 'VIDEO').length;
            const isDeleting = deleteMutation.isPending && confirmDeleteId === item.feedback_id;

            return (
              <div
                key={item.feedback_id}
                className="rounded-xl border border-brand-border bg-brand-soft-pink/20 p-3 shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-line flex-1">
                    {item.content}
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.feedback_id)}
                    className="p-1.5 rounded-lg text-brand-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                    title="Xóa Feedback"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-brand-text-muted">
                  <span>{formatTime(item.created_at)}</span>
                  {(imgCount > 0 || vidCount > 0) && (
                    <span className="font-medium text-brand-burgundy">
                      {[
                        imgCount > 0 ? `${imgCount} ảnh` : '',
                        vidCount > 0 ? `${vidCount} video` : '',
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  )}
                </div>

                {/* Confirm Delete Inline Modal / Bar */}
                {confirmDeleteId === item.feedback_id && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 space-y-2 animate-in fade-in duration-150">
                    <p className="text-xs text-red-700 font-medium">
                      Xóa Feedback này? Nội dung và minh chứng đính kèm sẽ bị xóa.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.feedback_id)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>Xác nhận xóa</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
