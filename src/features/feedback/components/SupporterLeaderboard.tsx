import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Heart } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { formatVND } from '@/lib/formatters';
import { useSupporterLeaderboard } from '../hooks';
import type { SupporterLeaderboardItem } from '../types';

export const SupporterLeaderboard: React.FC = () => {
  const { data, isLoading } = useSupporterLeaderboard();

  const items: SupporterLeaderboardItem[] = data?.items || [];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-xs space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-stone-200 rounded w-1/3" />
          <div className="h-4 bg-stone-100 rounded w-1/4" />
        </div>
        <div className="space-y-2.5">
          <div className="h-14 bg-stone-100 rounded-xl" />
          <div className="h-14 bg-stone-100 rounded-xl" />
          <div className="h-14 bg-stone-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const renderRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-amber-100/80 text-amber-700 text-sm sm:text-base shadow-xs" title="Hạng 1">
            🥇
          </span>
        );
      case 2:
        return (
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-sm sm:text-base shadow-xs" title="Hạng 2">
            🥈
          </span>
        );
      case 3:
        return (
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-orange-100/80 text-amber-800 text-sm sm:text-base shadow-xs" title="Hạng 3">
            🥉
          </span>
        );
      default:
        return (
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 text-xs sm:text-sm font-bold">
            #{rank}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-1 border-b border-brand-border/40">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-brand-soft-pink text-brand-burgundy">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-brand-text tracking-tight flex items-center gap-1.5">
              <span>Bảng tri ân</span>
              <span className="text-[11px] font-semibold text-brand-burgundy bg-brand-soft-pink px-2 py-0.5 rounded-full">
                Top 10
              </span>
            </h2>
          </div>
        </div>
        <p className="text-xs text-brand-text-muted leading-tight">
          Cảm ơn những bạn đã đồng hành cùng Chợ PTITers 💛
        </p>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-7 px-4 text-center bg-brand-cream/20 rounded-2xl border border-dashed border-brand-border/80">
          <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-lg mb-2 shadow-xs">
            💛
          </div>
          <p className="text-xs sm:text-sm font-semibold text-brand-text">
            Chưa có tên nào trên Bảng tri ân.
          </p>
          <p className="text-xs text-brand-text-muted mt-0.5 max-w-sm leading-relaxed">
            Mọi sự ủng hộ đều là động lực để Chợ PTITers tốt hơn 💛
          </p>
        </div>
      ) : (
        <div className="divide-y divide-brand-border/40 -mx-1">
          {items.map((item) => (
            <Link
              key={item.supporter.user_id}
              to={item.supporter.profile_path || `/users/${item.supporter.user_id}`}
              className="group flex items-center justify-between gap-2.5 px-2 py-2.5 sm:px-3 sm:py-3 rounded-xl hover:bg-brand-cream/40 transition-colors no-underline min-w-0"
              title={`Xem hồ sơ của ${item.supporter.full_name}`}
            >
              {/* Left: Rank + Avatar + Name & count */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {renderRankBadge(item.rank)}
                <Avatar
                  src={item.supporter.avatar_url}
                  name={item.supporter.full_name}
                  size="sm"
                  className="shrink-0 border border-brand-border/60"
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-brand-text group-hover:text-brand-burgundy transition-colors truncate max-w-[130px] min-[390px]:max-w-[170px] sm:max-w-[240px]">
                    {item.supporter.full_name}
                  </div>
                  <div className="text-[11px] text-brand-text-muted flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-amber-400 text-amber-500" />
                    <span>{item.contribution_count} lần ủng hộ</span>
                  </div>
                </div>
              </div>

              {/* Right: Formatted VND Amount */}
              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-bold text-brand-burgundy">
                  {formatVND(item.total_amount_vnd)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
