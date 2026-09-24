import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gavel,
  Trophy,
  RotateCcw,
  Tag,
  Ban,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  Clock,
  Package,
  Crown,
} from 'lucide-react';
import type { ProductDetailResponse } from '@/features/products/types';
import {
  useAuctionByProduct,
  useAuctionWebSocket,
  useCancelAuction,
  useConvertToFixedPrice,
} from '../hooks';
import { AuctionCountdown } from './AuctionCountdown';
import { BidForm } from './BidForm';
import { RecentBidsList } from './RecentBidsList';
import { WinnerCheckoutModal } from './WinnerCheckoutModal';
import { SellerAuctionModal } from './SellerAuctionModal';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { formatVND, parseServerDateTime } from '@/lib/formatters';

interface AuctionPanelProps {
  productId: number;
  product: ProductDetailResponse;
  isSeller: boolean;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
}

export const AuctionPanel: React.FC<AuctionPanelProps> = ({
  productId,
  product,
  isSeller,
  isAuthenticated,
  onRequireAuth,
}) => {
  const navigate = useNavigate();

  const { data: auction, isLoading, error, refetch } = useAuctionByProduct(productId);
  const cancelAuctionMutation = useCancelAuction();
  const convertFixedPriceMutation = useConvertToFixedPrice();

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSellerNewRoundOpen, setIsSellerNewRoundOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Controlled refetch immediately on countdown expire
  const handleCountdownExpire = useCallback(() => {
    refetch();
  }, [refetch]);

  // Controlled short polling if auction is past deadline but still marked ACTIVE
  useEffect(() => {
    if (!auction || auction.status !== 'ACTIVE') return;

    const endsAtMs = parseServerDateTime(auction.ends_at);
    const isPastDeadline = endsAtMs > 0 && Date.now() >= endsAtMs;

    if (!isPastDeadline) return;

    // Retry every 1.5s until backend finalizes and returns ENDED
    const timer = window.setInterval(() => {
      refetch();
    }, 1500);

    return () => {
      window.clearInterval(timer);
    };
  }, [auction?.status, auction?.ends_at, refetch]);

  // Realtime WebSocket integration
  useAuctionWebSocket(auction?.auction_id || 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-32 bg-gray-100 rounded-lg" />
        <div className="h-12 w-48 bg-gray-100 rounded-xl" />
        <div className="h-20 bg-gray-50 rounded-2xl" />
      </div>
    );
  }

  if (error || !auction) {
    return null;
  }

  const handleCancelAuction = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy phiên đấu giá này không?')) return;
    try {
      setActionError(null);
      await cancelAuctionMutation.mutateAsync(auction.auction_id);
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Không thể hủy phiên đấu giá.'));
    }
  };

  const handleConvertToFixedPrice = async () => {
    if (!window.confirm('Bạn có muốn chuyển sản phẩm này sang hình thức bán giá cố định không?')) return;
    try {
      setActionError(null);
      await convertFixedPriceMutation.mutateAsync(productId);
    } catch (err: unknown) {
      setActionError(getApiErrorMessage(err, 'Không thể chuyển hình thức bán.'));
    }
  };

  const currentPriceFormatted = formatVND(auction.current_price);
  const startingPriceFormatted = formatVND(auction.starting_price);
  const bidStepFormatted = formatVND(auction.bid_step);
  const finalPriceFormatted = formatVND(auction.final_price || auction.current_price);

  const winnerState = auction.winner_checkout_state;
  const isEnded = auction.status === 'ENDED';
  const hasNoBids = isEnded && (winnerState === 'NO_BIDS' || !auction.has_winner);
  const isWinnerWaiting = isEnded && winnerState === 'WAITING';
  const isOrderCreated = isEnded && winnerState === 'ORDER_CREATED';
  const isWinnerExpired = isEnded && winnerState === 'EXPIRED';

  return (
    <div className="bg-gradient-to-b from-white to-gray-50/50 rounded-3xl p-6 border border-gray-200/80 shadow-md space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner shrink-0">
            <Gavel className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-nowrap shrink-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 whitespace-nowrap shrink-0">
                Phiên đấu giá
              </h2>
              {auction.status === 'ACTIVE' && (
                <span
                  data-ui-role="auction-header-status-badge"
                  className="ui-auction-status-badge bg-emerald-600 text-white animate-pulse"
                >
                  ĐANG DIỄN RA
                </span>
              )}
              {auction.status === 'SCHEDULED' && (
                <span
                  data-ui-role="auction-header-status-badge"
                  className="ui-auction-status-badge bg-amber-100 text-amber-800 border border-amber-200/80"
                >
                  SẮP BẮT ĐẦU
                </span>
              )}
              {auction.status === 'ENDED' && (
                <span
                  data-ui-role="auction-header-status-badge"
                  className="ui-auction-status-badge bg-gray-100 text-gray-700 border border-gray-200/80"
                >
                  ĐÃ KẾT THÚC
                </span>
              )}
              {auction.status === 'CANCELLED' && (
                <span
                  data-ui-role="auction-header-status-badge"
                  className="ui-auction-status-badge bg-red-100 text-red-700 border border-red-200/80"
                >
                  ĐÃ HỦY
                </span>
              )}
            </div>
            <p
              className="text-xs text-gray-500 mt-0.5"
              style={{ color: '#4B5563', WebkitTextFillColor: '#4B5563' }}
            >
              Bước giá: +{bidStepFormatted}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <AuctionCountdown
            status={auction.status}
            startsAt={auction.starts_at}
            endsAt={auction.ends_at}
            serverTime={auction.server_time}
            onExpire={handleCountdownExpire}
          />
        </div>
      </div>

      {/* Main Pricing Block */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100/80 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span
            className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
            style={{ color: '#4B5563', WebkitTextFillColor: '#4B5563' }}
          >
            {isEnded
              ? 'Giá chốt phiên'
              : auction.bid_count > 0
                ? 'Giá cao nhất hiện tại'
                : 'Giá khởi điểm'}
          </span>
          <div
            className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight mt-1"
            style={{ color: '#047857', WebkitTextFillColor: '#047857' }}
          >
            {isEnded ? finalPriceFormatted : currentPriceFormatted}
          </div>
          <div
            className="text-xs text-gray-400 mt-1"
            style={{ color: '#4B5563', WebkitTextFillColor: '#4B5563' }}
          >
            Khởi điểm: <span className="font-medium text-gray-600" style={{ color: '#374151', WebkitTextFillColor: '#374151' }}>{startingPriceFormatted}</span> • {auction.bid_count} lượt đặt giá
          </div>

          {/* Social Leading Bidder Display */}
          {auction.status === 'ACTIVE' && auction.bid_count > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-lg mt-2 w-fit">
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
              <span>
                {auction.is_current_user_highest_bidder
                  ? 'Bạn đang dẫn đầu'
                  : `${auction.highest_bidder_display || 'Người đặt giá'} đang dẫn đầu`}
              </span>
            </div>
          )}
        </div>

        {/* Highest Bidder Notification */}
        {auction.is_current_user_highest_bidder && auction.status === 'ACTIVE' && (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Bạn đang là người trả giá cao nhất!</span>
          </div>
        )}
      </div>

      {/* WINNER UX BANNER: Authenticated winner waiting to checkout */}
      {auction.is_current_user_winner && isEnded && !isOrderCreated && (
        <div
          data-ui-role="auction-winner-banner"
          className="ui-auction-winner-surface rounded-2xl p-5 text-white shadow-lg space-y-3"
          style={{ backgroundColor: '#047857', backgroundImage: 'none', color: '#FFFFFF' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white" style={{ color: '#FFFFFF' }}>
                Chúc mừng! Bạn đã thắng phiên đấu giá
              </h3>
              <p
                data-ui-role="auction-winner-copy"
                className="ui-auction-winner-copy text-xs mt-0.5"
                style={{ color: '#ECFDF5', WebkitTextFillColor: '#ECFDF5' }}
              >
                Giá thắng:{' '}
                <strong
                  data-ui-role="auction-winner-price"
                  className="ui-auction-winner-price"
                  style={{ color: '#FEF08A', WebkitTextFillColor: '#FEF08A' }}
                >
                  {finalPriceFormatted}
                </strong>
                . Vui lòng hoàn tất đặt mua trước thời hạn để nhận hàng.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              data-ui-role="auction-winner-cta"
              type="button"
              onClick={() => setIsCheckoutModalOpen(true)}
              className="ui-auction-winner-cta px-6 py-2.5 font-bold text-sm rounded-xl transition-all flex items-center gap-2"
              style={{
                backgroundColor: '#722F37',
                color: '#FFFFFF',
                WebkitTextFillColor: '#FFFFFF',
                border: '1px solid #722F37',
                appearance: 'none',
                WebkitAppearance: 'none',
                opacity: 1,
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              Tiến hành đặt mua
            </button>
          </div>
        </div>
      )}

      {/* WINNER UX BANNER: Winner already created order */}
      {auction.is_current_user_winner && isEnded && isOrderCreated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Bạn đã tạo đơn hàng thành công</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Đơn hàng trúng đấu giá đã được tạo và đang được người bán xử lý.
              </p>
            </div>
          </div>
          {auction.winner_order_id && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/orders/${auction.winner_order_id}`)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Xem chi tiết đơn hàng
              </button>
            </div>
          )}
        </div>
      )}

      {/* SELLER STATE CARDS: Clear post-auction guidance */}
      {isSeller && isEnded && (
        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
          {/* Case 1: No Bids */}
          {hasNoBids && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Đấu giá đã kết thúc</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Phiên đấu giá đã kết thúc mà không có người tham gia đặt giá. Bạn có thể mở vòng đấu giá mới hoặc chuyển về bán giá cố định.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSellerNewRoundOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đấu giá lại (Vòng mới)
                </button>
                <button
                  type="button"
                  onClick={handleConvertToFixedPrice}
                  disabled={convertFixedPriceMutation.isPending}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {convertFixedPriceMutation.isPending ? 'Đang chuyển...' : 'Chuyển sang bán giá cố định'}
                </button>
              </div>
            </div>
          )}

          {/* Case 2: Winner exists, waiting for order */}
          {isWinnerWaiting && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Đấu giá đã kết thúc · Đã có người thắng</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Giá thắng chốt: <strong className="text-emerald-700">{finalPriceFormatted}</strong>. Hệ thống đang chờ người thắng tiến hành đặt mua sản phẩm.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Case 3: Winner created order */}
          {isOrderCreated && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Người thắng đã tạo đơn hàng</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Người thắng đấu giá đã hoàn tất bước đặt mua. Vui lòng vào trang quản lý đơn hàng để xác nhận và chuẩn bị giao hàng.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (auction.winner_order_id) {
                      navigate(`/orders/${auction.winner_order_id}`);
                    } else {
                      navigate('/orders?tab=selling');
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Xử lý đơn hàng
                </button>
              </div>
            </div>
          )}

          {/* Case 4: Winner checkout expired */}
          {isWinnerExpired && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Người thắng đã quá hạn đặt mua</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Người thắng phiên đấu giá không hoàn tất đặt mua trước thời hạn. Tồn kho đã được giải phóng. Bạn có thể mở phiên đấu giá mới hoặc chuyển sang bán giá cố định.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSellerNewRoundOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đấu giá lại (Vòng mới)
                </button>
                <button
                  type="button"
                  onClick={handleConvertToFixedPrice}
                  disabled={convertFixedPriceMutation.isPending}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {convertFixedPriceMutation.isPending ? 'Đang chuyển...' : 'Chuyển sang bán giá cố định'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seller Cancel Action when 0 bids and ACTIVE/SCHEDULED */}
      {isSeller && (auction.status === 'ACTIVE' || auction.status === 'SCHEDULED') && auction.bid_count === 0 && (
        <div
          className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between"
          style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
        >
          <span
            className="text-xs text-gray-600 font-medium"
            style={{ color: '#374151', WebkitTextFillColor: '#374151' }}
          >
            Chưa có lượt đặt giá nào:
          </span>
          <button
            type="button"
            onClick={handleCancelAuction}
            disabled={cancelAuctionMutation.isPending}
            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: '#FFFFFF', color: '#DC2626', WebkitTextFillColor: '#DC2626', borderColor: '#FECACA' }}
          >
            <Ban className="w-3.5 h-3.5" />
            {cancelAuctionMutation.isPending ? 'Đang hủy...' : 'Hủy phiên đấu giá'}
          </button>
        </div>
      )}

      {/* Error alert */}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Bid placement form for buyers when ACTIVE */}
      {!isSeller && auction.status === 'ACTIVE' && (
        <BidForm
          auction={auction}
          isAuthenticated={isAuthenticated}
          onRequireAuth={onRequireAuth}
        />
      )}

      {/* Recent Bids Feed */}
      <RecentBidsList auctionId={auction.auction_id} />

      {/* Winner Checkout Modal */}
      <WinnerCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        auction={auction}
        productTitle={product.title}
      />

      {/* Seller New Round Modal */}
      <SellerAuctionModal
        isOpen={isSellerNewRoundOpen}
        onClose={() => setIsSellerNewRoundOpen(false)}
        product={product}
        isNewRound={true}
      />
    </div>
  );
};
