import { useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Lock,
  ShieldAlert,
  X,
} from 'lucide-react';

interface CapabilityRestrictionModalProps {
  targetName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    capabilities: ('BUY' | 'SELL')[],
    durationDays: 1 | 3 | 7 | 14
  ) => Promise<void>;
  isSubmitting: boolean;
}

export function CapabilityRestrictionModal({
  targetName,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CapabilityRestrictionModalProps) {
  const [canBuyChecked, setCanBuyChecked] = useState(false);
  const [canSellChecked, setCanSellChecked] = useState(true);
  const [durationDays, setDurationDays] = useState<1 | 3 | 7 | 14>(3);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const caps: ('BUY' | 'SELL')[] = [];
    if (canBuyChecked) caps.push('BUY');
    if (canSellChecked) caps.push('SELL');

    if (caps.length === 0) {
      setValidationError('Vui lòng chọn ít nhất một quyền (Mua hàng hoặc Bán hàng) để hạn chế.');
      return;
    }

    try {
      await onSubmit(caps, durationDays);
    } catch {
      // Error handled by parent or mutation
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-brand-border overflow-hidden space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/60 bg-amber-50/60 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800">
              <Lock className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-text">
                Hạn chế quyền tài khoản
              </h3>
              <p className="text-[11px] text-brand-text-secondary truncate max-w-[240px]">
                Áp dụng đối với: <span className="font-semibold text-brand-text">{targetName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1.5 text-brand-text-secondary hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Đóng modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-800 border border-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Capabilities Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-text uppercase tracking-wider">
              Chọn quyền hạn chế <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                  canBuyChecked
                    ? 'border-amber-500 bg-amber-50/40 text-amber-900 font-semibold'
                    : 'border-brand-border bg-stone-50/50 text-brand-text hover:bg-stone-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={canBuyChecked}
                  onChange={(e) => {
                    setCanBuyChecked(e.target.checked);
                    setValidationError(null);
                  }}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Mua hàng</span>
              </label>

              <label
                className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all ${
                  canSellChecked
                    ? 'border-amber-500 bg-amber-50/40 text-amber-900 font-semibold'
                    : 'border-brand-border bg-stone-50/50 text-brand-text hover:bg-stone-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={canSellChecked}
                  onChange={(e) => {
                    setCanSellChecked(e.target.checked);
                    setValidationError(null);
                  }}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Bán hàng</span>
              </label>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-text uppercase tracking-wider">
              Thời hạn áp dụng <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '1 ngày', value: 1 as const },
                { label: '3 ngày', value: 3 as const },
                { label: '7 ngày', value: 7 as const },
                { label: '14 ngày', value: 14 as const },
              ].map((option) => (
                <label
                  key={String(option.value)}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer text-xs transition-all ${
                    durationDays === option.value
                      ? 'border-amber-500 bg-amber-50/40 text-amber-900 font-semibold'
                      : 'border-brand-border bg-stone-50/50 text-brand-text hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="duration"
                    checked={durationDays === option.value}
                    onChange={() => setDurationDays(option.value)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Consequence Details Box */}
          <div className="rounded-xl bg-stone-50 p-3.5 border border-brand-border/60 text-xs space-y-2">
            <span className="font-semibold text-brand-text flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
              Tác động khi áp dụng:
            </span>
            <ul className="space-y-1.5 text-brand-text-secondary text-[11px] leading-relaxed list-disc list-inside">
              {canBuyChecked && (
                <>
                  <li><b className="text-brand-text">Quyền Mua:</b> Người dùng không thể đặt mua mới, không thể đặt giá đấu, không thể thanh toán phiên thắng đấu giá.</li>
                </>
              )}
              {canSellChecked && (
                <>
                  <li><b className="text-brand-text">Quyền Bán:</b> Người dùng không thể đăng tin mới, không thể tạo phiên đấu giá. Tin đăng hiện tại tạm thời không hiển thị công khai. Các phiên đấu giá đang diễn ra hoặc đã lên lịch sẽ bị hủy.</li>
                </>
              )}
              <li><b className="text-brand-text">Đơn hàng hiện tại:</b> Tất cả các đơn hàng đã tạo trước đó vẫn tiếp tục theo quy trình bình thường.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-brand-border px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-interactive flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Xác nhận hạn chế</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
