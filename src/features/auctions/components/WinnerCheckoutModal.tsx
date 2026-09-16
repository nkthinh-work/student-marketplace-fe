import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Truck, MapPin, CreditCard, Banknote, X, AlertCircle } from 'lucide-react';
import type { AuctionDetailResponse, WinnerCheckoutPayload } from '../types';
import { useWinnerCheckout } from '../hooks';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { formatVND } from '@/lib/formatters';

interface WinnerCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionDetailResponse;
  productTitle: string;
}

export const WinnerCheckoutModal: React.FC<WinnerCheckoutModalProps> = ({
  isOpen,
  onClose,
  auction,
  productTitle,
}) => {
  const navigate = useNavigate();
  const checkoutMutation = useWinnerCheckout();

  const [fulfillmentMethod, setFulfillmentMethod] = useState<'MEETUP' | 'SHIPPING'>('MEETUP');
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_MEETUP' | 'BANK_TRANSFER'>('CASH_ON_MEETUP');
  const [meetupPlace, setMeetupPlace] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!contactName.trim()) {
      setErrorMessage('Vui lòng nhập họ tên người nhận.');
      return;
    }
    if (!contactPhone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (fulfillmentMethod === 'MEETUP' && !meetupPlace.trim()) {
      setErrorMessage('Vui lòng nhập địa điểm hẹn gặp.');
      return;
    }
    if (fulfillmentMethod === 'SHIPPING' && !shippingAddress.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    const payload: WinnerCheckoutPayload = {
      fulfillment_method: fulfillmentMethod,
      payment_method: paymentMethod,
      meetup_place: fulfillmentMethod === 'MEETUP' ? meetupPlace.trim() : undefined,
      shipping_address: fulfillmentMethod === 'SHIPPING' ? shippingAddress.trim() : undefined,
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      buyer_note: buyerNote.trim() || undefined,
    };

    try {
      const order = await checkoutMutation.mutateAsync({
        auctionId: auction.auction_id,
        payload,
      });
      onClose();
      navigate(`/orders/${order.order_id}`);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      setErrorMessage(msg);
    }
  };

  const finalPrice = auction.final_price || auction.current_price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-200" />
            <h2 className="font-bold text-base">Hoàn tất đặt mua sản phẩm trúng đấu giá</h2>
          </div>
          <button
            onClick={onClose}
            disabled={checkoutMutation.isPending}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-1.5">
            <div className="text-xs text-gray-500 font-medium">Sản phẩm:</div>
            <div className="text-sm font-semibold text-gray-900 line-clamp-1">{productTitle}</div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200/60 mt-2">
              <span className="text-xs text-gray-500">Giá chốt đấu giá:</span>
              <span className="text-base font-extrabold text-emerald-700">
                {formatVND(finalPrice)}
              </span>
            </div>
          </div>

          {/* Fulfillment Method */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Hình thức giao nhận
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentMethod('MEETUP')}
                className={`flex items-center justify-center sm:justify-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  fulfillmentMethod === 'MEETUP'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">Gặp mặt trực tiếp</span>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentMethod('SHIPPING')}
                className={`flex items-center justify-center sm:justify-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  fulfillmentMethod === 'SHIPPING'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">Giao hàng tận nơi</span>
              </button>
            </div>
          </div>

          {/* Location details */}
          {fulfillmentMethod === 'MEETUP' ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Địa điểm hẹn gặp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={meetupPlace}
                onChange={(e) => setMeetupPlace(e.target.value)}
                placeholder="VD: Cổng trường PTIT, Sảnh nhà A2..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Địa chỉ nhận hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Nhập địa chỉ nhận hàng chi tiết..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Phương thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH_ON_MEETUP')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  paymentMethod === 'CASH_ON_MEETUP'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Tiền mặt</div>
                  <div className="text-[10px] text-gray-500">Thanh toán khi nhận</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Chuyển khoản (VietQR)</div>
                  <div className="text-[10px] text-gray-500">Quét mã QR tiện lợi</div>
                </div>
              </button>
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Tên người nhận <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Họ và tên..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="09..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Ghi chú cho người bán</label>
            <input
              type="text"
              value={buyerNote}
              onChange={(e) => setBuyerNote(e.target.value)}
              placeholder="Ghi chú thêm (không bắt buộc)..."
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer CTA */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={checkoutMutation.isPending}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Để sau
            </button>
            <button
              type="submit"
              disabled={checkoutMutation.isPending}
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-sm transition-all"
            >
              {checkoutMutation.isPending ? 'Đang tạo đơn...' : 'Tạo đơn hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
