import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  User as UserIcon,
  Users,
  Sparkles,
  Pin,
  GripVertical,
} from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { ConversationSummary } from '../types';
import { parseServerDateTime } from '@/lib/formatters';

interface ConversationCardProps {
  conversation: ConversationSummary;
  isReorderable?: boolean;
  justDraggedRef?: React.MutableRefObject<boolean>;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isReorderable = false,
  justDraggedRef,
}) => {
  const navigate = useNavigate();
  const isGroup = conversation.type === 'GROUP';
  const isCommunity = conversation.type === 'COMMUNITY';
  const isDirect = conversation.type === 'DIRECT';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: conversation.conversation_id,
    disabled: !isReorderable,
  });

  // Enforce strictly zero horizontal offset (Lock X-axis completely)
  const combinedStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(
      transform
        ? {
            ...transform,
            x: 0,
          }
        : null
    ),
    transition,
    touchAction: isDragging ? 'none' : 'pan-y',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  };

  const other = conversation.other_participant;
  const hasUnread = conversation.unread_count > 0;

  const displayName = isDirect
    ? other?.full_name || 'Người dùng'
    : conversation.title || (isCommunity ? 'Cộng đồng Chợ PTITers' : 'Nhóm trò chuyện');

  const avatarUrl = isDirect ? other?.avatar_url : conversation.avatar_url;

  const formattedDate = React.useMemo(() => {
    if (!conversation.last_message_at) return '';
    try {
      const timestamp = parseServerDateTime(conversation.last_message_at);
      if (!timestamp) {
        if (import.meta.env.DEV) {
          console.warn(`[ConversationCard] Invalid last_message_at: "${conversation.last_message_at}"`);
        }
        return '';
      }
      const date = new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
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
  }, [conversation.last_message_at]);

  const handleCardClick = (e: React.MouseEvent) => {
    // If just finished a drag operation, suppress click navigation
    if (justDraggedRef?.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Ignore clicks if originating from nested interactive buttons
    if ((e.target as HTMLElement).closest('button, [role="button"]:not([data-conversation-card])')) {
      return;
    }

    navigate(`/messages/${conversation.conversation_id}`, {
      state: {
        fromApp: true,
        returnTo: `/messages?tab=${isGroup || isCommunity ? 'group' : 'direct'}`,
        returnLabel: 'Tin nhắn',
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/messages/${conversation.conversation_id}`, {
        state: {
          fromApp: true,
          returnTo: `/messages?tab=${isGroup || isCommunity ? 'group' : 'direct'}`,
          returnLabel: 'Tin nhắn',
        },
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...attributes}
      {...(isReorderable ? listeners : {})}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => {
        if (isReorderable) {
          e.preventDefault();
        }
      }}
      role="button"
      tabIndex={0}
      data-conversation-card
      className={`group relative flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all select-none cursor-pointer outline-none ${
        isDragging
          ? 'z-30 opacity-95 scale-[1.01] shadow-xl border-brand-burgundy/60 ring-2 ring-brand-burgundy/30 bg-white cursor-grabbing'
          : isCommunity
          ? 'bg-gradient-to-r from-rose-50/70 via-white to-white border-brand-burgundy/25 shadow-2xs hover:border-brand-burgundy/50 ring-1 ring-brand-burgundy/5'
          : hasUnread
          ? 'bg-rose-50/40 border-brand-burgundy/20 hover:bg-rose-50/70 shadow-xs'
          : 'bg-white border-stone-200/80 hover:bg-stone-50/80 hover:border-stone-300'
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0 pointer-events-none">
        {isCommunity ? (
          <div
            role="img"
            aria-label={displayName}
            className="relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-burgundy to-rose-900 border border-rose-800 shadow-2xs"
          >
            <img
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              className="h-7 w-7 shrink-0 object-contain select-none"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div style={{ display: 'none' }} className="items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
          </div>
        ) : (
          <Avatar
            src={avatarUrl}
            name={displayName}
            rounded="2xl"
            size="lg"
            className={`border ${
              isGroup
                ? 'bg-brand-burgundy/10 text-brand-burgundy border-brand-burgundy/20'
                : 'bg-stone-100 text-stone-500 border-stone-200'
            }`}
            fallbackIcon={
              isGroup ? (
                <Users className="w-6 h-6" />
              ) : (
                <UserIcon className="w-6 h-6 text-stone-400" />
              )
            }
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pointer-events-none">
        <div className="flex items-baseline justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <h3
              className={`text-sm truncate ${
                hasUnread
                  ? 'font-bold text-stone-900'
                  : isCommunity
                  ? 'font-bold text-stone-900'
                  : 'font-medium text-stone-800'
              }`}
            >
              {displayName}
            </h3>
            {isCommunity && (
              <span className="shrink-0 text-[9px] px-2 py-0.5 rounded-full bg-rose-100 text-brand-burgundy font-bold uppercase tracking-wider">
                Chính thức
              </span>
            )}
            {isGroup && !isCommunity && conversation.member_count && (
              <span className="shrink-0 text-[10px] text-stone-400 font-normal">
                ({conversation.member_count})
              </span>
            )}
          </div>

          {/* Right: Pin Indicator & Time */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isCommunity && (
              <span
                title="Cuộc trò chuyện được ghim"
                className="w-5 h-5 rounded-full bg-rose-100/80 border border-rose-200/80 flex items-center justify-center text-brand-burgundy shadow-2xs"
              >
                <Pin className="w-2.5 h-2.5 rotate-45 fill-brand-burgundy text-brand-burgundy" />
              </span>
            )}
            <span
              className={`text-[11px] ${
                hasUnread
                  ? 'font-semibold text-brand-burgundy'
                  : 'text-stone-400'
              }`}
            >
              {formattedDate}
            </span>
          </div>
        </div>

        {conversation.product_context && isDirect && (
          <div className="mb-1">
            <span className="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-normal truncate max-w-[200px]">
              {conversation.product_context.title}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate ${
              hasUnread ? 'font-semibold text-stone-900' : 'text-stone-500'
            }`}
          >
            {conversation.last_message_preview || 'Bắt đầu cuộc trò chuyện...'}
          </p>

          {hasUnread && (
            <span className="shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-burgundy text-white text-[10px] font-bold">
              {conversation.unread_count > 99
                ? '99+'
                : conversation.unread_count}
            </span>
          )}
        </div>
      </div>

      {/* Reorder Grip Handle Visual Affordance */}
      {isReorderable && (
        <div
          title="Giữ và kéo để sắp xếp"
          className="p-1 text-stone-300 group-hover:text-stone-400 flex items-center justify-center shrink-0 pointer-events-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

