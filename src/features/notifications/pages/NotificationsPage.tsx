import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ArrowLeft,
  Loader2,
  Inbox,
  Filter,
  AlertCircle,
} from 'lucide-react';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllRead,
} from '../hooks';
import { NotificationItem } from '../components/NotificationItem';

export const NotificationsPage: React.FC = () => {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications({ unread_only: unreadOnly });

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllRead();

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  const handleShowToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8 animate-in fade-in duration-200">
      {/* Top Bar / Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 border border-brand-border/60 text-brand-text-secondary shadow-2xs transition-colors hover:bg-white hover:text-brand-text"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-text">
              Thông báo
            </h1>
            <p className="text-xs text-brand-text-muted">
              Cập nhật đơn hàng, tin nhắn và hoạt động tài khoản
            </p>
          </div>
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-brand-burgundy border border-brand-burgundy/20 shadow-2xs transition-all hover:bg-brand-soft-pink/30 active:scale-95 disabled:opacity-50"
          >
            {isMarkingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5 text-brand-burgundy" />
            )}
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b border-brand-border/60 pb-3">
        <button
          type="button"
          onClick={() => setUnreadOnly(false)}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
            !unreadOnly
              ? 'bg-brand-burgundy text-white shadow-xs'
              : 'text-brand-text-secondary hover:bg-black/5'
          }`}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Tất cả</span>
        </button>

        <button
          type="button"
          onClick={() => setUnreadOnly(true)}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
            unreadOnly
              ? 'bg-brand-burgundy text-white shadow-xs'
              : 'text-brand-text-secondary hover:bg-black/5'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Chưa đọc</span>
          {unreadCount > 0 && (
            <span
              className={`ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                unreadOnly
                  ? 'bg-white text-brand-burgundy'
                  : 'bg-brand-burgundy text-white'
              }`}
            >
              {unreadCount >= 100 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex animate-pulse items-start gap-3.5 rounded-xl border border-stone-200/80 bg-white/60 p-4"
            >
              <div className="h-10 w-10 shrink-0 rounded-xl bg-stone-200" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-3/4 rounded bg-stone-200" />
                <div className="h-3 w-1/2 rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center text-xs sm:text-sm text-red-600">
          <p>Có lỗi xảy ra khi tải thông báo. Vui lòng thử lại sau.</p>
        </div>
      ) : allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border bg-white/50 py-16 px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft-pink/40 text-brand-burgundy shadow-inner">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-sm sm:text-base font-bold text-brand-text">
            {unreadOnly ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </h3>
          <p className="mt-1 max-w-xs text-xs text-brand-text-muted">
            {unreadOnly
              ? 'Tuyệt vời! Bạn đã xem hết tất cả thông báo của mình.'
              : 'Các thông báo về đơn hàng và tương tác của bạn sẽ xuất hiện tại đây.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {allItems.map((item) => (
            <NotificationItem
              key={item.notification_id}
              notification={item}
              onErrorToast={handleShowToast}
            />
          ))}

          {/* Load more button */}
          {hasNextPage && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-burgundy border border-brand-border shadow-xs transition-all hover:bg-brand-soft-pink/30 active:scale-95 disabled:opacity-60"
              >
                {isFetchingNextPage && (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-burgundy" />
                )}
                <span>{isFetchingNextPage ? 'Đang tải...' : 'Xem thêm thông báo cũ hơn'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Error Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
