import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Truck,
  MessageSquare,
  Star,
  Gavel,
  Bell,
  Trophy,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { NotificationItem as NotificationItemType, NotificationType } from '../types';
import { useMarkRead } from '../hooks';
import { formatRelativeTime } from '@/lib/formatters';

interface NotificationItemProps {
  notification: NotificationItemType;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'NEW_ORDER':
      return <ShoppingBag className="h-5 w-5 text-emerald-600" />;
    case 'ORDER_STATUS':
      return <Truck className="h-5 w-5 text-blue-600" />;
    case 'NEW_MESSAGE':
      return <MessageSquare className="h-5 w-5 text-brand-burgundy" />;
    case 'NEW_REVIEW':
      return <Star className="h-5 w-5 text-amber-500 fill-amber-500" />;
    case 'AUCTION_BID':
      return <TrendingUp className="h-5 w-5 text-indigo-600" />;
    case 'AUCTION_OUTBID':
      return <TrendingDown className="h-5 w-5 text-rose-600" />;
    case 'AUCTION_WON':
      return <Trophy className="h-5 w-5 text-amber-600 fill-amber-500/20" />;
    case 'AUCTION_ENDED':
      return <Gavel className="h-5 w-5 text-purple-600" />;
    case 'SYSTEM':
    default:
      return <Bell className="h-5 w-5 text-brand-text-secondary" />;
  }
}

function getIconBg(type: NotificationType) {
  switch (type) {
    case 'NEW_ORDER':
      return 'bg-emerald-50 border-emerald-200';
    case 'ORDER_STATUS':
      return 'bg-blue-50 border-blue-200';
    case 'NEW_MESSAGE':
      return 'bg-brand-soft-pink/40 border-brand-soft-pink';
    case 'NEW_REVIEW':
      return 'bg-amber-50 border-amber-200';
    case 'AUCTION_BID':
      return 'bg-indigo-50 border-indigo-200';
    case 'AUCTION_OUTBID':
      return 'bg-rose-50 border-rose-200';
    case 'AUCTION_WON':
      return 'bg-amber-50 border-amber-200';
    case 'AUCTION_ENDED':
      return 'bg-purple-50 border-purple-200';
    case 'SYSTEM':
    default:
      return 'bg-stone-100 border-stone-200';
  }
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const navigate = useNavigate();
  const { mutate: markAsRead } = useMarkRead();

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }

    if (notification.type === 'SYSTEM' && notification.ref_type === 'GROUP_INVITE') {
      navigate('/messages?tab=invites');
    } else if (notification.ref_type === 'ORDER' && notification.ref_id) {
      navigate(`/orders/${notification.ref_id}`);
    } else if (notification.ref_type === 'CONVERSATION' && notification.ref_id) {
      navigate(`/messages/${notification.ref_id}`);
    } else if (notification.ref_type === 'PRODUCT' && notification.ref_id) {
      navigate(`/products/${notification.ref_id}`);
    } else if (notification.ref_type === 'AUCTION' && notification.ref_id) {
      navigate(`/auctions/${notification.ref_id}`);
    } else if (notification.ref_type === 'USER' && notification.ref_id) {
      navigate(`/users/${notification.ref_id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      className={`group relative flex items-start gap-3.5 p-4 rounded-xl transition-all duration-200 cursor-pointer border ${
        notification.is_read
          ? 'bg-white/70 border-stone-200/80 hover:bg-white hover:border-stone-300'
          : 'bg-brand-soft-pink/20 border-brand-burgundy/20 shadow-xs hover:bg-brand-soft-pink/30 hover:border-brand-burgundy/30'
      }`}
    >
      {/* Type Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${getIconBg(
          notification.type
        )} shadow-2xs transition-transform group-hover:scale-105`}
      >
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-xs sm:text-sm truncate ${
              notification.is_read
                ? 'font-medium text-brand-text'
                : 'font-bold text-brand-burgundy'
            }`}
          >
            {notification.title}
          </h4>
          <span className="text-[11px] font-normal text-brand-text-muted shrink-0">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        {notification.body && (
          <p className="mt-1 text-xs sm:text-sm text-brand-text-secondary line-clamp-2 leading-relaxed">
            {notification.body}
          </p>
        )}
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-burgundy shadow-xs"
          title="Chưa đọc"
        />
      )}
    </div>
  );
};
