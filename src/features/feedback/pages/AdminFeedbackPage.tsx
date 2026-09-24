import React, { useState } from 'react';
import {
  Clock,
  ExternalLink,
  ImageIcon,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  User as UserIcon,
  Video as VideoIcon,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/common/AdminPageHeader';
import { useAdminFeedbacks } from '../hooks';
import { AdminFeedbackDetailModal } from '../components/AdminFeedbackDetailModal';
import type { AdminFeedbackListItem } from '../types';

function formatRowTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} • ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export const AdminFeedbackPage: React.FC = () => {
  const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedbackListItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useAdminFeedbacks({
    limit: 50,
  });

  const items = data?.items || [];

  const handleOpenDetail = (item: AdminFeedbackListItem) => {
    setSelectedFeedback(item);
    setIsDetailOpen(true);
  };

  const handleActionComplete = () => {
    refetch();
  };

  return (
    <div className="mx-auto max-w-4xl px-3.5 py-5 sm:px-6 sm:py-8 space-y-5">
      {/* Page Header */}
      <AdminPageHeader
        icon={<MessageSquareQuote className="h-5 w-5 text-brand-burgundy" />}
        title="Feedback người dùng"
        subtitle="Kiểm tra các góp ý và báo lỗi từ người dùng kèm minh chứng"
        action={
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-brand-text-secondary ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        }
      />

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-burgundy" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-white p-8 text-center space-y-2">
          <MessageSquareQuote className="mx-auto h-8 w-8 text-brand-text-muted/40" />
          <p className="text-xs sm:text-sm font-medium text-brand-text-muted">
            Chưa có phản hồi nào trong hệ thống.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.feedback_id}
              onClick={() => handleOpenDetail(item)}
              className="group rounded-xl border border-brand-border bg-white p-3.5 sm:p-4 shadow-2xs hover:border-brand-burgundy/40 hover:shadow-xs transition-all cursor-pointer space-y-2"
            >
              {/* Sender row & time */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {item.sender.avatar_url ? (
                    <img
                      src={item.sender.avatar_url}
                      alt={item.sender.full_name}
                      className="h-7 w-7 rounded-full object-cover border border-brand-border flex-shrink-0"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-brand-soft-pink text-brand-burgundy flex items-center justify-center font-bold text-xs flex-shrink-0">
                      <UserIcon className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-brand-text truncate">
                    {item.sender.full_name}
                  </span>
                  <span className="text-[11px] text-brand-text-muted">
                    #{item.feedback_id}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-brand-text-muted flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{formatRowTime(item.created_at)}</span>
                </div>
              </div>

              {/* Content preview line-clamp-2 */}
              <p className="text-xs sm:text-sm text-brand-text/90 line-clamp-2 leading-relaxed">
                {item.content}
              </p>

              {/* Footer row: attachments & detail cue */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <div className="flex items-center gap-2 text-brand-text-muted">
                  {item.image_count > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-brand-burgundy font-medium">
                      <ImageIcon className="h-3 w-3" />
                      <span>{item.image_count} ảnh</span>
                    </span>
                  )}
                  {item.video_count > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-brand-burgundy font-medium">
                      <VideoIcon className="h-3 w-3" />
                      <span>{item.video_count} video</span>
                    </span>
                  )}
                  {item.image_count === 0 && item.video_count === 0 && (
                    <span>Chỉ văn bản</span>
                  )}
                </div>

                <span className="text-brand-burgundy group-hover:translate-x-0.5 transition-transform font-medium flex items-center gap-0.5">
                  <span>Xem chi tiết</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AdminFeedbackDetailModal
        feedback={selectedFeedback}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
};
