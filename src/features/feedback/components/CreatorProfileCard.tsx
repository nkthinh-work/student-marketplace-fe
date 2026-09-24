import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Sparkles } from 'lucide-react';
import type { SupportResponse } from '../types';

interface CreatorProfileCardProps {
  support?: SupportResponse | null;
  isLoading?: boolean;
}

export const CreatorProfileCard: React.FC<CreatorProfileCardProps> = ({
  support,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs animate-pulse space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-stone-200" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-stone-200 rounded w-1/3" />
            <div className="h-3 bg-stone-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const creator = support?.creator;
  if (!creator) {
    return null;
  }

  const profileHref = support.profile_path || `/users/${creator.user_id}`;

  return (
    <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-white via-white to-brand-soft-pink/30 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-burgundy">
          <Code2 className="h-4 w-4" />
          <span>Về người phát triển</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-burgundy bg-brand-soft-pink/60 px-2 py-0.5 rounded-md border border-brand-burgundy/15">
          <Sparkles className="h-3 w-3" /> Đội ngũ phát triển
        </span>
      </div>

      {/* Creator Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.full_name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-brand-burgundy/20 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-brand-burgundy text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-xs shrink-0">
              {creator.full_name.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-brand-text truncate">
              {creator.full_name}
            </h3>
            <p className="text-xs sm:text-sm text-brand-text-secondary font-medium mt-0.5">
              Người phát triển Chợ PTITers
            </p>
          </div>
        </div>

        {/* Link to actual public profile */}
        <div className="shrink-0 self-start sm:self-center">
          <Link
            to={profileHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-burgundy/30 bg-white hover:bg-brand-soft-pink text-brand-burgundy text-xs sm:text-sm font-semibold shadow-2xs active:scale-95 transition-all"
          >
            <span>Xem trang cá nhân →</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
