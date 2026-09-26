import React, { useState, useRef } from 'react';
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
  ShieldAlert,
  ShieldCheck,
  HeartHandshake,
  Camera,
  MessageSquareQuote,
  ClipboardCheck,
  Trash2,
} from 'lucide-react';
import { NotificationItem as NotificationItemType, NotificationType } from '../types';
import { useMarkRead, useDeleteNotification } from '../hooks';
import { formatRelativeTime } from '@/lib/formatters';

interface NotificationItemProps {
  notification: NotificationItemType;
  isOpen?: boolean;
  onSwipeOpen?: () => void;
  onSwipeClose?: () => void;
  onErrorToast?: (msg: string) => void;
}

function getNotificationIcon(type: NotificationType, ref_type?: string | null) {
  if (ref_type === 'ADMIN_PRODUCT_APPROVAL' || ref_type === 'PRODUCT_APPROVAL') {
    return <ClipboardCheck className="h-5 w-5 text-brand-burgundy" />;
  }
  if (ref_type === 'ADMIN_REPORT' || ref_type === 'REPORT') {
    return <ShieldAlert className="h-5 w-5 text-rose-600" />;
  }
  if (
    ref_type === 'ADMIN_COMMUNITY' ||
    ref_type === 'ADMIN_COMMUNITY_MOMENT' ||
    ref_type === 'COMMUNITY_MOMENT' ||
    ref_type === 'COMMUNITY_REJECTED' ||
    ref_type === 'COMMUNITY_MOMENT_REJECTED'
  ) {
    return <Camera className="h-5 w-5 text-purple-600" />;
  }
  if (ref_type === 'ADMIN_FEEDBACK') {
    return <MessageSquareQuote className="h-5 w-5 text-blue-600" />;
  }
  if (
    ref_type === 'ADMIN_SUPPORT_CLAIM' ||
    ref_type === 'SUPPORT_CLAIM' ||
    ref_type === 'SUPPORT_CONTRIBUTION'
  ) {
    return <HeartHandshake className="h-5 w-5 text-rose-500" />;
  }
  if (ref_type === 'ACCOUNT_ACCESS') {
    return <ShieldCheck className="h-5 w-5 text-amber-600" />;
  }

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

function getIconBg(type: NotificationType, ref_type?: string | null) {
  if (ref_type === 'ADMIN_PRODUCT_APPROVAL' || ref_type === 'PRODUCT_APPROVAL') {
    return 'bg-brand-soft-pink/40 border-brand-soft-pink';
  }
  if (ref_type === 'ADMIN_REPORT' || ref_type === 'REPORT') {
    return 'bg-rose-50 border-rose-200';
  }
  if (
    ref_type === 'ADMIN_COMMUNITY' ||
    ref_type === 'ADMIN_COMMUNITY_MOMENT' ||
    ref_type === 'COMMUNITY_MOMENT' ||
    ref_type === 'COMMUNITY_REJECTED' ||
    ref_type === 'COMMUNITY_MOMENT_REJECTED'
  ) {
    return 'bg-purple-50 border-purple-200';
  }
  if (ref_type === 'ADMIN_FEEDBACK') {
    return 'bg-blue-50 border-blue-200';
  }
  if (
    ref_type === 'ADMIN_SUPPORT_CLAIM' ||
    ref_type === 'SUPPORT_CLAIM' ||
    ref_type === 'SUPPORT_CONTRIBUTION'
  ) {
    return 'bg-rose-50 border-rose-200';
  }
  if (ref_type === 'ACCOUNT_ACCESS') {
    return 'bg-amber-50 border-amber-200';
  }

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

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onErrorToast,
}) => {
  const navigate = useNavigate();
  const { mutate: markAsRead } = useMarkRead();
  const { mutate: deleteNotif, isPending: isDeleting } = useDeleteNotification();

  const containerRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isThresholdCrossed, setIsThresholdCrossed] = useState<boolean>(false);

  const startCoordRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const currentTranslateRef = useRef<number>(0);
  const isCommittingRef = useRef<boolean>(false);

  // Reset transient swipe state on data change, filter toggle, or unmount
  React.useEffect(() => {
    setTranslateX(0);
    currentTranslateRef.current = 0;
    setIsDragging(false);
    setIsExiting(false);
    setIsThresholdCrossed(false);
    isCommittingRef.current = false;
    hasMovedRef.current = false;
    gestureLockRef.current = null;
  }, [notification.notification_id, notification.is_read]);

  const getDeleteThreshold = () => {
    const width = containerRef.current?.offsetWidth || 320;
    return Math.max(90, Math.round(width * 0.38));
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    deleteNotif(notification.notification_id, {
      onError: () => {
        onErrorToast?.('Không thể xóa thông báo. Vui lòng thử lại.');
      },
    });
  };

  const handleClick = () => {
    if (hasMovedRef.current || isCommittingRef.current || isExiting || currentTranslateRef.current > 10) {
      return;
    }

    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }

    const { ref_type, ref_id } = notification;

    if (ref_type === 'ADMIN_PRODUCT_APPROVAL') {
      navigate('/admin/product-approvals');
    } else if (ref_type === 'PRODUCT_APPROVAL') {
      navigate('/my-products');
    } else if (ref_type === 'ADMIN_REPORT') {
      navigate('/admin/reports?queue_state=NEEDS_ACTION');
    } else if (ref_type === 'ADMIN_COMMUNITY' || ref_type === 'ADMIN_COMMUNITY_MOMENT') {
      navigate('/admin/community-moments');
    } else if (ref_type === 'ADMIN_FEEDBACK') {
      navigate('/admin/feedback');
    } else if (ref_type === 'ADMIN_SUPPORT_CLAIM') {
      navigate('/admin/support');
    } else if (ref_type === 'SUPPORT_CLAIM' || ref_type === 'SUPPORT_CONTRIBUTION') {
      navigate('/feedback');
    } else if (
      ref_type === 'COMMUNITY_MOMENT' ||
      ref_type === 'COMMUNITY_REJECTED' ||
      ref_type === 'COMMUNITY_MOMENT_REJECTED'
    ) {
      navigate('/');
    } else if (ref_type === 'REPORT' || ref_type === 'ACCOUNT_ACCESS') {
      navigate('/profile');
    } else if (notification.type === 'SYSTEM' && ref_type === 'GROUP_INVITE') {
      navigate('/messages?tab=invites');
    } else if (ref_type === 'ORDER' && ref_id) {
      navigate(`/orders/${ref_id}`);
    } else if (ref_type === 'CONVERSATION' && ref_id) {
      navigate(`/messages/${ref_id}`);
    } else if (ref_type === 'PRODUCT' && ref_id) {
      navigate(`/products/${ref_id}`);
    } else if (ref_type === 'AUCTION' && ref_id) {
      navigate(`/auctions/${ref_id}`);
    } else if (ref_type === 'USER' && ref_id) {
      navigate(`/users/${ref_id}`);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isCommittingRef.current || isExiting) return;
    // Single-touch only: multi-touch is ignored
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    startCoordRef.current = { x: touch.clientX, y: touch.clientY };
    gestureLockRef.current = null;
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isCommittingRef.current || isExiting) return;
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - startCoordRef.current.x;
    const dy = touch.clientY - startCoordRef.current.y;

    if (!gestureLockRef.current) {
      if (Math.abs(dy) > 7 && Math.abs(dy) >= Math.abs(dx)) {
        gestureLockRef.current = 'vertical';
      } else if (dx > 7 && dx > Math.abs(dy)) {
        gestureLockRef.current = 'horizontal';
      }
    }

    if (gestureLockRef.current === 'horizontal') {
      hasMovedRef.current = true;
      const width = containerRef.current?.offsetWidth || 320;
      const threshold = getDeleteThreshold();

      // Right-swipe only: clamped between 0 and notification width
      let rawX = Math.max(0, dx);
      if (rawX > threshold * 1.5) {
        // Subtle dampening past threshold
        rawX = threshold * 1.5 + (rawX - threshold * 1.5) * 0.2;
      }
      rawX = Math.min(rawX, width);

      setTranslateX(rawX);
      currentTranslateRef.current = rawX;
      setIsThresholdCrossed(rawX >= threshold);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (gestureLockRef.current === 'horizontal') {
      const threshold = getDeleteThreshold();
      const currentX = currentTranslateRef.current;
      const width = containerRef.current?.offsetWidth || 320;

      if (currentX >= threshold) {
        // Direct commit delete: animate foreground out to right
        isCommittingRef.current = true;
        setIsExiting(true);
        setTranslateX(width + 40);

        deleteNotif(notification.notification_id, {
          onError: () => {
            // Restore notification to 0 on failure
            isCommittingRef.current = false;
            setIsExiting(false);
            setTranslateX(0);
            currentTranslateRef.current = 0;
            setIsThresholdCrossed(false);
            onErrorToast?.('Không thể xóa thông báo. Vui lòng thử lại.');
          },
        });
      } else {
        // Distance < threshold: snap smoothly back to 0
        setTranslateX(0);
        currentTranslateRef.current = 0;
        setIsThresholdCrossed(false);
      }
    }

    gestureLockRef.current = null;
    if (hasMovedRef.current) {
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 300);
    }
  };

  const handleTouchCancel = () => {
    setIsDragging(false);
    if (!isCommittingRef.current) {
      setTranslateX(0);
      currentTranslateRef.current = 0;
      setIsThresholdCrossed(false);
    }
    gestureLockRef.current = null;
    hasMovedRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl isolate select-none"
    >
      {/* Destructive Background Layer: strictly BEHIND the foreground (z-0), non-interactive */}
      <div
        className={`absolute inset-0 z-0 flex items-center pl-5 pointer-events-none select-none transition-colors duration-150 ${
          isThresholdCrossed ? 'bg-red-600' : 'bg-red-500'
        }`}
        aria-hidden="true"
      >
        <div
          className={`flex items-center gap-2 text-white font-bold text-xs transition-all duration-150 ${
            isThresholdCrossed ? 'scale-105 opacity-100' : 'scale-95 opacity-80'
          }`}
          style={{
            maxWidth: Math.max(0, translateX - 12),
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <Trash2 className="h-5 w-5 shrink-0 stroke-[2.2]" />
          <span className="shrink-0">Xóa</span>
        </div>
      </div>

      {/* Foreground Notification Card: strictly ABOVE background (z-10), 100% OPAQUE */}
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onPointerCancel={handleTouchCancel}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        style={{
          transform: `translate3d(${translateX}px, 0, 0)`,
          transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.9, 0.4, 1)',
          touchAction: 'pan-y',
        }}
        className={`group relative z-10 flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer will-change-transform ${
          notification.is_read
            ? 'bg-white border-stone-200/90 shadow-2xs hover:border-stone-300'
            : 'bg-[#FAF5F2] border-brand-burgundy/30 border-l-4 border-l-brand-burgundy shadow-xs hover:border-brand-burgundy/40'
        }`}
      >
        {/* Type Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${getIconBg(
            notification.type,
            notification.ref_type
          )} shadow-2xs transition-transform group-hover:scale-105`}
        >
          {getNotificationIcon(notification.type, notification.ref_type)}
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
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-normal text-brand-text-muted">
                {formatRelativeTime(notification.created_at)}
              </span>

              {/* Desktop contextual delete button (subtle on hover/focus) */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Xóa thông báo"
                aria-label="Xóa thông báo"
                className="hidden sm:inline-flex p-1 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
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
    </div>
  );
};
