import { useState } from 'react';
import {
  History,
  AlertTriangle,
  Paperclip,
  ChevronRight,
  Loader2,
  Package,
  User,
  ShoppingBag,
} from 'lucide-react';
import { useAdminSubjectReportHistory } from '../hooks';
import {
  REPORT_REASON_LABELS,
  MODERATION_ACTION_LABELS,
} from '../constants';
import type { ReportTargetType, SubjectReportHistoryItem } from '../types';

interface SubjectReportHistoryCardProps {
  userId: number;
  excludeReportId?: number;
  onSelectReport: (reportId: number) => void;
}

export function SubjectReportHistoryCard({
  userId,
  excludeReportId,
  onSelectReport,
}: SubjectReportHistoryCardProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminSubjectReportHistory(userId, excludeReportId, 5);

  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-4 border border-brand-border/60 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-text-secondary">
          <History className="h-4 w-4 text-brand-burgundy animate-pulse" />
          <span>Đang tải lịch sử báo cáo...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl bg-amber-50/60 p-3.5 border border-amber-200 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Không thể tải lịch sử báo cáo liên quan</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-brand-text border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
        <p className="text-[11px] text-amber-700">
          {error?.message || 'Có lỗi xảy ra khi kiểm tra lịch sử của đối tượng này.'}
        </p>
      </div>
    );
  }

  const pages = data?.pages || [];
  const allItems: SubjectReportHistoryItem[] = pages.flatMap((p) => p.items);
  const totalCount = pages[0]?.total_count ?? allItems.length;

  if (totalCount === 0) {
    return (
      <div className="rounded-2xl bg-white p-3.5 border border-brand-border/60 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
          <History className="h-4 w-4 text-brand-text-muted" />
          <span className="font-semibold text-brand-text">Lịch sử báo cáo:</span>
          <span className="text-brand-text-muted">Chưa ghi nhận báo cáo nào trước đây về đối tượng này.</span>
        </div>
      </div>
    );
  }

  // Display initial 3 items unless expanded
  const displayedItems = expanded ? allItems : allItems.slice(0, 3);

  const getTargetIcon = (targetType: ReportTargetType) => {
    switch (targetType) {
      case 'PRODUCT':
        return <Package className="h-3.5 w-3.5 text-blue-600" />;
      case 'ORDER':
        return <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />;
      case 'USER':
      default:
        return <User className="h-3.5 w-3.5 text-purple-600" />;
    }
  };

  const getTargetLabel = (targetType: ReportTargetType) => {
    switch (targetType) {
      case 'PRODUCT':
        return 'Tin đăng';
      case 'ORDER':
        return 'Giao dịch';
      case 'USER':
      default:
        return 'Người dùng';
    }
  };

  const getOutcomeSummary = (item: SubjectReportHistoryItem) => {
    if (item.status === 'REJECTED') {
      return (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
          Đã bỏ qua
        </span>
      );
    }
    if (item.status === 'RESOLVED') {
      if (item.enforcement_actions && item.enforcement_actions.length > 0) {
        const actionLabels = item.enforcement_actions
          .map((a) => MODERATION_ACTION_LABELS[a.action_type] || a.action_type)
          .join(', ');
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
            {actionLabels}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
          Đã xử lý (dữ liệu cũ)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
        Cần xử lý
      </span>
    );
  };

  return (
    <div className="rounded-2xl bg-white p-3.5 border border-brand-border/60 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-brand-burgundy" />
          <h4 className="text-xs font-bold text-brand-text">Lịch sử báo cáo</h4>
          <span className="rounded-full bg-brand-soft-pink px-2 py-0.5 text-[10px] font-semibold text-brand-burgundy">
            {totalCount} báo cáo trước đây
          </span>
        </div>
      </div>

      <div className="space-y-1.5 divide-y divide-brand-border/40">
        {displayedItems.map((item) => (
          <div
            key={item.report_id}
            onClick={() => onSelectReport(item.report_id)}
            className="group pt-2 first:pt-0 flex items-center justify-between gap-2.5 p-1.5 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
            title={`Nhấn để mở chi tiết báo cáo #${item.report_id}`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-stone-100 shrink-0">
                {getTargetIcon(item.target_type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-semibold text-brand-text truncate">
                    {getTargetLabel(item.target_type)}
                  </span>
                  <span className="text-brand-text-muted">&bull;</span>
                  <span className="font-medium text-brand-price">
                    {REPORT_REASON_LABELS[item.reason] || item.reason}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-brand-text-muted pt-0.5">
                  <span className="tabular-nums">#{item.report_id}</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </span>
                  {item.evidence_count > 0 && (
                    <>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Paperclip className="h-2.5 w-2.5" />
                        {item.evidence_count} minh chứng
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {getOutcomeSummary(item)}
              <ChevronRight className="h-3.5 w-3.5 text-brand-text-muted group-hover:text-brand-burgundy group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {(allItems.length > 3 || hasNextPage) && (
        <div className="pt-1 flex items-center justify-between border-t border-brand-border/40 text-[11px]">
          {!expanded && allItems.length > 3 ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-brand-burgundy font-semibold hover:underline cursor-pointer"
            >
              Xem tất cả ({totalCount})
            </button>
          ) : expanded && hasNextPage ? (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="flex items-center gap-1 text-brand-burgundy font-semibold hover:underline disabled:opacity-50 cursor-pointer"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Đang tải thêm...</span>
                </>
              ) : (
                <span>Tải thêm báo cáo trước</span>
              )}
            </button>
          ) : expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-brand-text-muted hover:underline cursor-pointer"
            >
              Thu gọn
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
