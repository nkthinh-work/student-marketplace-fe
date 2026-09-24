import React, { useState, useMemo } from 'react';
import { Gavel, Clock, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ProductDetailResponse } from '@/features/products/types';
import { useCreateAuction } from '../hooks';
import { useUserAccessStatus } from '@/features/users/hooks';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { formatVND, formatNumberVND, normalizeMoney } from '@/lib/formatters';

interface SellerAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDetailResponse;
  isNewRound?: boolean;
}

const PRESET_DURATIONS = [
  { label: '30 phút', minutes: 30 },
  { label: '1 giờ', minutes: 60 },
  { label: '3 giờ', minutes: 180 },
  { label: '6 giờ', minutes: 360 },
  { label: '12 giờ', minutes: 720 },
  { label: '1 ngày', minutes: 1440 },
];

/**
 * Format Date to readable Vietnamese string (HH:mm dd/MM/yyyy)
 */
function formatDisplayDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export const SellerAuctionModal: React.FC<SellerAuctionModalProps> = ({
  isOpen,
  onClose,
  product,
  isNewRound = false,
}) => {
  const { data: accessStatus } = useUserAccessStatus();
  const isSellRestricted = accessStatus?.can_sell === false;

  const [bidStep, setBidStep] = useState<number>(10000);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [presetMinutes, setPresetMinutes] = useState<number>(180); // 3 hours default
  const [customHours, setCustomHours] = useState<number>(2);
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createMutation = useCreateAuction();

  // Total duration in minutes
  const totalDurationMinutes = useMemo(() => {
    if (!isCustomDuration) {
      return presetMinutes;
    }
    const h = isNaN(customHours) || customHours < 0 ? 0 : customHours;
    const m = isNaN(customMinutes) || customMinutes < 0 ? 0 : customMinutes;
    return h * 60 + m;
  }, [isCustomDuration, presetMinutes, customHours, customMinutes]);

  // Calculated preview end date
  const previewEndDate = useMemo(() => {
    const now = new Date();
    const duration = totalDurationMinutes > 0 ? totalDurationMinutes : 30;
    return new Date(now.getTime() + duration * 60 * 1000);
  }, [totalDurationMinutes]);

  if (!isOpen) return null;

  const handleBidStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setBidStep(num);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isSellRestricted) {
      setErrorMessage('Tài khoản của bạn đang bị giới hạn quyền bán hàng/đấu giá.');
      return;
    }

    const normalizedBidStep = normalizeMoney(bidStep);
    if (normalizedBidStep <= 0) {
      setErrorMessage('Bước giá tối thiểu phải lớn hơn 0 ₫.');
      return;
    }

    if (totalDurationMinutes <= 0) {
      setErrorMessage('Thời lượng đấu giá phải lớn hơn 0 phút.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        product_id: product.product_id,
        bid_step: normalizedBidStep,
        duration_minutes: totalDurationMinutes,
      });

      onClose();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể thiết lập phiên đấu giá.');
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-50/50">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-base">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Gavel className="w-4 h-4" />
            </div>
            <span>{isNewRound ? 'Mở vòng đấu giá mới' : 'Thiết lập phiên đấu giá'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. GIÁ KHỞI ĐIỂM */}
          <div className="rounded-2xl p-4 bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                Giá khởi điểm
              </span>
              <span className="text-xs text-emerald-700">
                (Tự động snapshot từ giá sản phẩm)
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-800">
              {formatVND(product.price)}
            </div>
          </div>

          {/* 2. BƯỚC GIÁ TỐI THIỂU */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Bước giá tối thiểu (VND) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={bidStep > 0 ? formatNumberVND(bidStep) : ''}
                onChange={handleBidStepChange}
                placeholder="10.000"
                className="w-full text-base font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-right"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                ₫
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Mỗi lượt đặt giá sau phải cao hơn giá hiện tại ít nhất số tiền này.
            </p>
          </div>

          {/* 3. THỜI LƯỢNG ĐẤU GIÁ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Thời lượng đấu giá
              </label>
              <button
                type="button"
                onClick={() => setIsCustomDuration(!isCustomDuration)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                {isCustomDuration ? 'Dùng thời lượng mẫu' : 'Tùy chỉnh thời gian'}
              </button>
            </div>

            {/* Duration Presets */}
            {!isCustomDuration ? (
              <div className="grid grid-cols-3 gap-2">
                {PRESET_DURATIONS.map((preset) => {
                  const isSelected = presetMinutes === preset.minutes;
                  return (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => setPresetMinutes(preset.minutes)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Custom Duration Input */
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                <div className="text-xs font-semibold text-gray-600">
                  Tùy chỉnh thời lượng:
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Số giờ:</label>
                    <input
                      type="number"
                      min={0}
                      max={168}
                      value={customHours}
                      onChange={(e) => setCustomHours(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 block mb-1">Số phút:</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. DỰ KIẾN KẾT THÚC (PREVIEW) */}
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/80 flex items-center gap-2 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Dự kiến kết thúc: <strong>{formatDisplayDateTime(previewEndDate)}</strong>
            </span>
          </div>

          {/* Sell restriction warning banner */}
          {isSellRestricted && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Tài khoản của bạn đang bị giới hạn quyền bán hàng/thiết lập đấu giá.</span>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || isSellRestricted}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Gavel className="w-4 h-4" />
              {createMutation.isPending ? 'Đang kích hoạt...' : 'Bắt đầu đấu giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
