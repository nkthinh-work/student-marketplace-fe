import React, { useState, useEffect } from 'react';
import { X, Loader2, Tag, Trash2 } from 'lucide-react';
import { useUpdateGroupMemberNickname } from '../hooks';

interface GroupNicknameModalProps {
  conversationId: number;
  currentNickname?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupNicknameModal: React.FC<GroupNicknameModalProps> = ({
  conversationId,
  currentNickname,
  isOpen,
  onClose,
}) => {
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateNicknameMutation = useUpdateGroupMemberNickname(conversationId);

  useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname || '');
      setErrorMsg(null);
    }
  }, [isOpen, currentNickname]);

  if (!isOpen) return null;

  const validateInput = (value: string): string | null => {
    // Disallow newline, tab, carriage return, control characters
    // eslint-disable-next-line no-control-regex
    if (/[\r\n\t\x00-\x1f\x7f-\x9f]/.test(value)) {
      return 'Biệt danh không được chứa ký tự xuống dòng, khoảng tab hoặc ký tự đặc biệt không hợp lệ.';
    }
    if (value.length > 40) {
      return 'Biệt danh không được vượt quá 40 ký tự.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateInput(nickname);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const trimmed = nickname.trim();
    const targetNickname = trimmed.length > 0 ? trimmed : null;

    setErrorMsg(null);
    try {
      await updateNicknameMutation.mutateAsync(targetNickname);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || err?.message || 'Không thể cập nhật biệt danh.'
      );
    }
  };

  const handleClear = async () => {
    setErrorMsg(null);
    try {
      await updateNicknameMutation.mutateAsync(null);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || err?.message || 'Không thể xóa biệt danh.'
      );
    }
  };

  const isPending = updateNicknameMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100/80 flex items-center justify-center text-brand-burgundy">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                {currentNickname ? 'Đổi biệt danh' : 'Đặt biệt danh trong nhóm'}
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Chỉ hiển thị trong nhóm này
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Biệt danh của bạn
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={isPending}
                placeholder="Ví dụ: Mít, Cá Mập, Trưởng Ban..."
                maxLength={40}
                className="w-full text-xs sm:text-sm px-3 py-2 pr-12 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy bg-white transition-all disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 pointer-events-none">
                {nickname.length}/40
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
              Biệt danh giúp bạn bè trong nhóm dễ nhận biết bạn hơn. Tên tài khoản gốc của bạn vẫn được lưu giữ.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            {currentNickname ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="py-2 px-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Gỡ bỏ biệt danh và sử dụng tên tài khoản gốc"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa biệt danh</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="py-2 px-3.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="py-2 px-4 rounded-xl bg-brand-burgundy hover:bg-rose-900 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
