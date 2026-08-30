import React, { useState } from 'react';
import { History, ShieldCheck, Crown, User } from 'lucide-react';
import { useAuctionBids } from '../hooks';
import { formatVND, parseServerDateTime } from '@/lib/formatters';

interface RecentBidsListProps {
  auctionId: number;
}

const BidderAvatar: React.FC<{ avatarUrl?: string | null; displayName: string }> = ({
  avatarUrl,
  displayName,
}) => {
  const [hasError, setHasError] = useState(false);

  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        onError={() => setHasError(true)}
        className="w-7 h-7 rounded-full object-cover border border-gray-200/80 shadow-2xs shrink-0"
      />
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 border border-gray-200 flex items-center justify-center shrink-0">
      <User className="w-3.5 h-3.5" />
    </div>
  );
};

export const RecentBidsList: React.FC<RecentBidsListProps> = ({ auctionId }) => {
  const { data, isLoading } = useAuctionBids(auctionId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
          <History className="w-4 h-4 text-gray-500" />
          Lịch sử đặt giá
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const bids = data?.items || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <History className="w-4 h-4 text-emerald-600" />
          Lịch sử đặt giá ({bids.length})
        </h3>
        <span className="text-[11px] text-gray-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Bảo mật danh tính
        </span>
      </div>

      {bids.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">
          Chưa có lượt đặt giá nào. Hãy là người đầu tiên đặt giá!
        </div>
      ) : (
        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto pr-1 space-y-1">
          {bids.map((bid, index) => {
            const isLeading = bid.is_highest || index === 0;
            const displayName = bid.is_current_user ? 'Bạn' : bid.bidder_display;

            const timeMs = parseServerDateTime(bid.created_at);
            const timeFormatted = timeMs
              ? new Date(timeMs).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={bid.bid_id}
                className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                  isLeading
                    ? 'bg-amber-50/60 border border-amber-200/70 shadow-2xs'
                    : 'hover:bg-gray-50/80'
                }`}
              >
                {/* Left: Avatar + Names + Badges */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {isLeading && (
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                  )}

                  <BidderAvatar
                    avatarUrl={bid.bidder_avatar_url}
                    displayName={displayName}
                  />

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs truncate ${
                          bid.is_current_user
                            ? 'font-extrabold text-emerald-800'
                            : 'font-semibold text-gray-800'
                        }`}
                      >
                        {displayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      {isLeading && (
                        <>
                          <span className="font-bold text-[10px] text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-md border border-amber-200/80">
                            Dẫn đầu
                          </span>
                          <span>·</span>
                        </>
                      )}
                      <span>{timeFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right shrink-0 pl-2">
                  <span
                    className={`text-xs font-bold ${
                      isLeading
                        ? 'text-amber-800 font-extrabold'
                        : 'text-gray-900 font-semibold'
                    }`}
                  >
                    {formatVND(bid.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
