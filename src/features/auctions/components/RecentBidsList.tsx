import React from 'react';
import { History, ShieldCheck, Crown } from 'lucide-react';
import { useAuctionBids } from '../hooks';
import { formatVND, parseServerDateTime } from '@/lib/formatters';
import { Avatar } from '@/components/common/Avatar';

interface RecentBidsListProps {
  auctionId: number;
}


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
    <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-sm space-y-3 text-brand-text">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-text flex items-center gap-1.5">
          <History className="w-4 h-4 text-emerald-600" />
          Lịch sử đặt giá ({bids.length})
        </h3>
        <span className="text-[11px] text-brand-text-muted flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Bảo mật danh tính
        </span>
      </div>

      {bids.length === 0 ? (
        <div
          className="py-6 text-center text-xs text-brand-text-muted"
          style={{ color: '#4B5563', WebkitTextFillColor: '#4B5563' }}
        >
          Chưa có lượt đặt giá nào. Hãy là người đầu tiên đặt giá!
        </div>
      ) : (
        <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto pr-1 space-y-1">
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
                className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition-colors ${
                  isLeading
                    ? 'bg-amber-50/60 border border-amber-200/70 shadow-2xs'
                    : 'hover:bg-stone-50/80'
                }`}
              >
                {/* Crown (Leader only) */}
                {isLeading && (
                  <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                )}

                {/* Avatar */}
                <Avatar
                  src={bid.bidder_avatar_url}
                  name={displayName}
                  size="xs"
                  className="w-7 h-7 border border-stone-200/80 shadow-2xs"
                />

                {/* Middle: Identity + Meta (flex-1 min-w-0) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="min-w-0">
                    <span
                      className={`text-xs truncate block ${
                        bid.is_current_user
                          ? 'font-extrabold text-emerald-800'
                          : 'font-semibold text-brand-text'
                      }`}
                      title={displayName}
                    >
                      {displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-brand-text-muted min-w-0">
                    {isLeading && (
                      <>
                        <span className="font-bold text-[10px] text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded-md border border-amber-200/80 shrink-0 leading-tight">
                          Dẫn đầu
                        </span>
                        <span className="shrink-0">·</span>
                      </>
                    )}
                    <span className="truncate">{timeFormatted}</span>
                  </div>
                </div>

                {/* Right: Amount (shrink-0 whitespace-nowrap text-right) */}
                <div className="shrink-0 text-right whitespace-nowrap pl-1">
                  <span
                    className={`text-xs font-bold block ${
                      isLeading
                        ? 'text-amber-800 font-extrabold'
                        : 'text-brand-text font-semibold'
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
