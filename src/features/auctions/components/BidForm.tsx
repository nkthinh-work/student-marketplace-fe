import React, { useState, useEffect } from 'react';
import { Gavel, Plus, Sparkles } from 'lucide-react';
import type { AuctionDetailResponse } from '../types';
import { usePlaceBid } from '../hooks';
import { BidConfirmationModal } from './BidConfirmationModal';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { formatVND, formatNumberVND, normalizeMoney } from '@/lib/formatters';

interface BidFormProps {
  auction: AuctionDetailResponse;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const BidForm: React.FC<BidFormProps> = ({
  auction,
  isAuthenticated,
  onRequireAuth,
}) => {
  const minNextBid = normalizeMoney(auction.minimum_next_bid);
  const bidStep = normalizeMoney(auction.bid_step);

  const [bidAmount, setBidAmount] = useState<number>(minNextBid);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const placeBidMutation = usePlaceBid();

  useEffect(() => {
    setBidAmount(normalizeMoney(auction.minimum_next_bid));
    setErrorMessage(null);
  }, [auction.minimum_next_bid]);

  const handleQuickAdd = (multiplier: number) => {
    const stepAdd = bidStep * multiplier;
    setBidAmount((prev) => Math.max(minNextBid, (prev || minNextBid) + stepAdd));
    setErrorMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
    setBidAmount(val);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    if (bidAmount < minNextBid) {
      setErrorMessage(
        `Giá đặt tối thiểu phải là ${formatVND(minNextBid)}`
      );
      return;
    }

    setIsModalOpen(true);
  };

  const handleConfirmBid = async () => {
    try {
      await placeBidMutation.mutateAsync({
        auctionId: auction.auction_id,
        payload: { amount: bidAmount },
      });
      setIsModalOpen(false);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể đặt giá. Vui lòng thử lại.');
      setErrorMessage(msg);
      setIsModalOpen(false);
    }
  };

  if (auction.status !== 'ACTIVE') {
    return null;
  }

  const step1 = bidStep;
  const step2 = bidStep * 2;
  const step5 = bidStep * 5;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Gavel className="w-4 h-4 text-emerald-600" />
          Đặt giá đấu
        </h3>
        <span className="text-xs text-gray-500 font-medium">
          Tối thiểu: <strong className="text-emerald-700">{formatVND(minNextBid)}</strong>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={bidAmount > 0 ? formatNumberVND(bidAmount) : ''}
            onChange={handleInputChange}
            placeholder={`Tối thiểu ${formatVND(minNextBid)}`}
            className="w-full text-lg font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-right"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
            ₫
          </span>
        </div>

        {/* Dynamic Quick Buttons based on bid_step */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickAdd(1)}
            className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 text-xs font-semibold text-gray-700 hover:text-emerald-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {step1 >= 1000 ? `+${formatNumberVND(step1 / 1000)}k` : `+${formatNumberVND(step1)}`}
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(2)}
            className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 text-xs font-semibold text-gray-700 hover:text-emerald-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {step2 >= 1000 ? `+${formatNumberVND(step2 / 1000)}k` : `+${formatNumberVND(step2)}`}
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(5)}
            className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 text-xs font-semibold text-gray-700 hover:text-emerald-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {step5 >= 1000 ? `+${formatNumberVND(step5 / 1000)}k` : `+${formatNumberVND(step5)}`}
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={placeBidMutation.isPending}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {placeBidMutation.isPending ? 'Đang xử lý...' : 'Đặt giá ngay'}
        </button>
      </form>

      <BidConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmBid}
        amount={bidAmount}
        currentPrice={auction.current_price}
        bidStep={auction.bid_step}
        isLoading={placeBidMutation.isPending}
      />
    </div>
  );
};
