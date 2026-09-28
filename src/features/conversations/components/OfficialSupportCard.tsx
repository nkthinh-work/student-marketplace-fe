import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pin } from 'lucide-react';
import { OfficialSupportGroupMetadata } from '../types';
import { useJoinOfficialSupportGroup } from '../hooks';

interface OfficialSupportCardProps {
  officialSupport: OfficialSupportGroupMetadata;
  className?: string;
}

export const OfficialSupportCard: React.FC<OfficialSupportCardProps> = ({
  officialSupport,
  className = '',
}) => {
  const navigate = useNavigate();
  const joinSupportGroupMutation = useJoinOfficialSupportGroup();
  const [isJoining, setIsJoining] = useState(false);

  const formattedTime = useMemo(() => {
    if (!officialSupport.last_message_at) return '';
    try {
      const date = new Date(officialSupport.last_message_at);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      }
      if (diffDays < 7) {
        return date.toLocaleDateString('vi-VN', { weekday: 'short' });
      }
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return '';
    }
  }, [officialSupport.last_message_at]);

  const handleOpenOfficial = async () => {
    if (isJoining) return;
    let targetConvId = officialSupport.conversation_id;

    if (!officialSupport.is_member) {
      try {
        setIsJoining(true);
        const res = await joinSupportGroupMutation.mutateAsync();
        targetConvId = res.conversation_id;
      } catch (err) {
        console.error('Failed to join official support group on click:', err);
      } finally {
        setIsJoining(false);
      }
    }

    navigate(`/messages/${targetConvId}`, {
      state: {
        fromApp: true,
        returnTo: '/messages?tab=groups',
        returnLabel: 'Tin nhắn',
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenOfficial();
    }
  };

  const previewText =
    officialSupport.last_message_preview ||
    officialSupport.description ||
    'Mọi người cần giao lưu, hỏi đáp hay hỗ trợ thì nhắn ở đây nhé';

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="official-support-card"
      onClick={handleOpenOfficial}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-3 p-3.5 sm:p-4 bg-white border border-stone-200/80 rounded-2xl shadow-2xs hover:border-brand-burgundy/40 hover:shadow-xs transition-all cursor-pointer select-none ${className}`}
    >
      {/* 48px Branded Avatar (Burgundy background + PTITers local logo asset) */}
      <div className="relative shrink-0 pointer-events-none">
        <div
          role="img"
          aria-label={officialSupport.title}
          className="relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-burgundy to-rose-900 border border-rose-800 shadow-2xs"
        >
          <img
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            className="h-7 w-7 shrink-0 object-contain select-none"
          />
        </div>
      </div>

      {/* Main Metadata Content */}
      <div className="flex-1 min-w-0 pointer-events-none">
        <div className="flex items-baseline justify-between gap-1 mb-0.5">
          {/* Title + Official Badge + Pin Indicator */}
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <h3 className="text-sm font-bold text-stone-900 truncate">
              {officialSupport.title}
            </h3>
            <span className="shrink-0 text-[9px] px-2 py-0.5 rounded-full bg-rose-100 text-brand-burgundy font-bold uppercase tracking-wider">
              CHÍNH THỨC
            </span>
            <span
              title="Đã ghim"
              aria-label="Đã ghim"
              className="shrink-0 text-brand-burgundy flex items-center"
            >
              <Pin className="w-3.5 h-3.5 fill-brand-burgundy/80 text-brand-burgundy rotate-45" />
            </span>
          </div>

          {/* Right Timestamp (only rendered if real message time exists) */}
          {formattedTime ? (
            <span className="text-[11px] text-stone-400 shrink-0 ml-auto pl-1">
              {formattedTime}
            </span>
          ) : null}
        </div>

        {/* Preview line + optional unread badge */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-stone-500 truncate leading-relaxed">
            {previewText}
          </p>
          {(officialSupport.unread_count ?? 0) > 0 && (
            <span className="shrink-0 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-brand-burgundy rounded-full">
              {officialSupport.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
