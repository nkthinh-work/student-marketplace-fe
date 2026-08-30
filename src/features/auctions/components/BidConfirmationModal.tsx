import React from 'react';
import { Gavel, AlertCircle, X } from 'lucide-react';
import { formatVND } from '@/lib/formatters';
import type { MoneyWire } from '../types';

interface BidConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: MoneyWire;
  currentPrice: MoneyWire;
  bidStep: MoneyWire;
  isLoading: boolean;
}

export const BidConfirmationModal: React.FC<BidConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currentPrice,
  bidStep,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-base">
            <Gavel className="w-5 h-5 text-emerald-600" />
            Xác nhận đặt giá đấu
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
            <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
              Số tiền bạn muốn đặt
            </span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">
              {formatVND(amount)}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Giá hiện tại:</span>
              <span className="font-semibold text-gray-900">
                {formatVND(currentPrice)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Bước giá tối thiểu:</span>
              <span className="font-semibold text-gray-900">
                +{formatVND(bidStep)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200/60 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Lưu ý: Sau khi đặt giá thành công, bạn không thể hủy lượt đặt giá này.
              Nếu thắng phiên đấu giá, bạn có trách nhiệm hoàn tất đặt mua sản phẩm.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200/70 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            {isLoading ? 'Đang gửi...' : 'Xác nhận đặt giá'}
          </button>
        </div>
      </div>
    </div>
  );
};
