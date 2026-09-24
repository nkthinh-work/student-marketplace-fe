import React from 'react';
import { usePublicFeedbacks } from '../hooks';
import { Loader2, MessageSquare, RefreshCw } from 'lucide-react';

function formatFeedbackTime(dateStr: string): string {
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

export const PublicFeedbackList: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } = usePublicFeedbacks({ limit: 20 });

  const items = data?.items || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-brand-text-secondary">
          Mọi người đang góp ý
        </h3>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-text-muted hover:text-brand-burgundy transition-colors cursor-pointer"
          title="Làm mới danh sách"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Cập nhật</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand-burgundy" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-600">
          Không thể tải danh sách phản hồi cộng đồng.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-white p-6 text-center text-xs sm:text-sm text-brand-text-muted space-y-1.5">
          <MessageSquare className="mx-auto h-6 w-6 text-brand-burgundy/40" />
          <p>Chưa có góp ý nào. Hãy là người đầu tiên gửi feedback nhé!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.feedback_id}
              className="rounded-xl border border-brand-border/80 bg-white p-3.5 shadow-2xs hover:border-brand-burgundy/30 transition-all"
            >
              <p className="text-xs sm:text-sm text-brand-text whitespace-pre-line leading-relaxed">
                {item.content}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-brand-text-muted">
                <span>{formatFeedbackTime(item.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
