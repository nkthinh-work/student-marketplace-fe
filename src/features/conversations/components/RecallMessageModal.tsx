import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface RecallMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const RecallMessageModal: React.FC<RecallMessageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recall-modal-title"
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-stone-200 p-5 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-rose-50 text-brand-burgundy shrink-0 border border-rose-100">
            <AlertTriangle className="w-5 h-5 text-brand-burgundy" />
          </div>
          <div className="space-y-1">
            <h3
              id="recall-modal-title"
              className="text-base font-bold text-stone-900"
            >
              Thu hồi tin nhắn?
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Tin nhắn này sẽ bị thu hồi đối với tất cả thành viên trong cuộc trò chuyện. Các tệp đính kèm liên quan sẽ được xóa an toàn.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isLoading) onConfirm();
            }}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-burgundy hover:bg-rose-900 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Thu hồi</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
