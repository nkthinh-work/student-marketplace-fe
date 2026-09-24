import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Paperclip,
} from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AdminPageHeader } from '@/components/common/AdminPageHeader';
import { AdminReportDetailModal } from '../components/AdminReportDetailModal';
import {
  ADMIN_TARGET_TYPE_BADGES,
  REPORT_REASON_LABELS,
} from '../constants';
import { useAdminReports } from '../hooks';
import type {
  AdminReportQueueState,
  AdminReportResponse,
  OrderTargetSummary,
  ProductTargetSummary,
  ReportTargetType,
  UserTargetSummary,
} from '../types';

export function AdminReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read queue_state from search params.
  // Allowed URL values: 'ALL' | 'NEEDS_ACTION' | 'COMPLETED'.
  // Default when empty/omitted: 'NEEDS_ACTION'.
  const rawQueueParam = searchParams.get('queue_state');
  const activeQueueTab: 'ALL' | 'NEEDS_ACTION' | 'COMPLETED' =
    rawQueueParam === 'ALL' || rawQueueParam === 'COMPLETED'
      ? rawQueueParam
      : 'NEEDS_ACTION';

  // Read target_type from search params (optional)
  const rawTargetParam = searchParams.get('target_type') as ReportTargetType | null;
  const selectedTargetType: ReportTargetType | undefined =
    rawTargetParam && ['USER', 'PRODUCT', 'ORDER'].includes(rawTargetParam)
      ? rawTargetParam
      : undefined;

  const [activeReportId, setActiveReportId] = useState<number | null>(null);

  // Sync to URL if navigating to /admin/reports without explicit queue_state
  useEffect(() => {
    if (!searchParams.get('queue_state')) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('queue_state', 'NEEDS_ACTION');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  // Actual backend query param:
  // When activeQueueTab is 'NEEDS_ACTION', send 'NEEDS_ACTION'
  // When activeQueueTab is 'COMPLETED', send 'COMPLETED'
  // When activeQueueTab is 'ALL', send undefined (no queue_state filter)
  const backendQueueState: AdminReportQueueState | undefined =
    activeQueueTab === 'ALL' ? undefined : activeQueueTab;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminReports({
    queue_state: backendQueueState,
    target_type: selectedTargetType,
    limit: 20,
  });

  const allReports: AdminReportResponse[] =
    data?.pages.flatMap((page) => page.items) || [];

  const queueTabs: { label: string; value: 'ALL' | 'NEEDS_ACTION' | 'COMPLETED' }[] = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Cần xử lý', value: 'NEEDS_ACTION' },
    { label: 'Đã xử lý', value: 'COMPLETED' },
  ];

  const handleQueueTabChange = (val: 'ALL' | 'NEEDS_ACTION' | 'COMPLETED') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('queue_state', val);
      return next;
    });
  };

  const handleTargetTypeChange = (val: ReportTargetType | undefined) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('target_type', val);
      } else {
        next.delete('target_type');
      }
      return next;
    });
  };

  const targetTabs: {
    label: string;
    value: ReportTargetType | undefined;
  }[] = [
    { label: 'Tất cả đối tượng', value: undefined },
    { label: 'Người dùng', value: 'USER' },
    { label: 'Tin đăng', value: 'PRODUCT' },
    { label: 'Giao dịch', value: 'ORDER' },
  ];

  const renderTargetTitle = (report: AdminReportResponse) => {
    if (!report.target_available || !report.target_summary) {
      return (
        <span className="text-gray-400 italic text-xs">
          Đối tượng không còn khả dụng trên hệ thống
        </span>
      );
    }

    if (report.target_type === 'USER') {
      const u = report.target_summary as UserTargetSummary;
      return (
        <span className="font-semibold text-brand-text truncate">
          Người dùng: <span className="text-brand-burgundy">{u.full_name}</span>
        </span>
      );
    }

    if (report.target_type === 'PRODUCT') {
      const p = report.target_summary as ProductTargetSummary;
      return (
        <span className="font-semibold text-brand-text truncate">
          Tin đăng: <span className="text-brand-burgundy">{p.title}</span>
        </span>
      );
    }

    if (report.target_type === 'ORDER') {
      const o = report.target_summary as OrderTargetSummary;
      return (
        <span className="font-semibold text-brand-text truncate">
          Giao dịch: <span className="font-medium tabular-nums text-brand-burgundy">#{o.order_code}</span>
        </span>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Page Header */}
      <AdminPageHeader
        icon={<ShieldAlert className="h-5 w-5 text-brand-burgundy" />}
        title="Kiểm duyệt báo cáo"
        subtitle="Xem xét và xử lý các báo cáo vi phạm từ người dùng Chợ PTITers"
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className="h-3.5 w-3.5 text-brand-text-secondary" />
            <span>Làm mới</span>
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="my-4 space-y-3">
        {/* Primary Filter: Queue State Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {queueTabs.map((tab) => {
            const isSelected = activeQueueTab === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleQueueTabChange(tab.value)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-burgundy text-white shadow-xs'
                    : 'bg-white text-brand-text-secondary border border-brand-border/80 hover:bg-brand-soft-pink/40 hover:text-brand-text'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter: Target Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-medium text-brand-text-muted pr-1 shrink-0">
            Đối tượng:
          </span>
          {targetTabs.map((tab) => {
            const isSelected = selectedTargetType === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleTargetTypeChange(tab.value)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-brand-text text-white shadow-2xs font-semibold'
                    : 'bg-brand-warm-white text-brand-text-secondary border border-brand-border/60 hover:bg-white hover:text-brand-text'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue Content */}
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner message="Đang tải danh sách báo cáo..." />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs sm:text-sm text-red-800">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 font-semibold">Không thể tải danh sách báo cáo</p>
          <p className="mt-1 text-xs text-red-600">
            {error?.message || 'Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : allReports.length === 0 ? (
        <div className="rounded-2xl border border-brand-border/60 bg-white p-10 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft-pink/40 text-brand-burgundy">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-brand-text">
            {activeQueueTab === 'NEEDS_ACTION'
              ? 'Không có báo cáo nào cần xử lý'
              : 'Không có báo cáo nào'}
          </h3>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {activeQueueTab === 'NEEDS_ACTION'
              ? 'Tất cả báo cáo vi phạm đã được xử lý hoặc bỏ qua.'
              : selectedTargetType
              ? 'Không tìm thấy báo cáo phù hợp với bộ lọc hiện tại.'
              : 'Hiện tại hệ thống không có khiếu nại báo cáo nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allReports.map((report) => {
            const isCompleted =
              report.workflow_state === 'COMPLETED' ||
              report.status === 'RESOLVED' ||
              report.status === 'REJECTED';
            const isRejected = report.status === 'REJECTED';

            const primaryBadge = isCompleted
              ? {
                  label: 'Đã xử lý',
                  bgClass: 'bg-emerald-50',
                  textClass: 'text-emerald-800',
                  borderClass: 'border-emerald-200',
                }
              : {
                  label: 'Cần xử lý',
                  bgClass: 'bg-amber-50',
                  textClass: 'text-amber-800',
                  borderClass: 'border-amber-200',
                };

            const secondaryBadge = isCompleted && isRejected
              ? {
                  label: 'Đã bỏ qua',
                  bgClass: 'bg-slate-100',
                  textClass: 'text-slate-700',
                  borderClass: 'border-slate-200',
                }
              : null;

            const targetBadge = ADMIN_TARGET_TYPE_BADGES[report.target_type] || {
              label: report.target_type,
              bgClass: 'bg-gray-50',
              textClass: 'text-gray-700',
              borderClass: 'border-gray-200',
            };

            return (
              <div
                key={report.report_id}
                onClick={() => setActiveReportId(report.report_id)}
                className="group flex flex-col gap-2.5 rounded-2xl border border-brand-border/70 bg-white p-4 shadow-2xs hover:shadow-md hover:border-brand-burgundy/30 transition-all cursor-pointer"
              >
                {/* Row 1: Badges, ID, Time */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${primaryBadge.bgClass} ${primaryBadge.textClass} ${primaryBadge.borderClass}`}
                    >
                      {primaryBadge.label}
                    </span>

                    {secondaryBadge && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${secondaryBadge.bgClass} ${secondaryBadge.textClass} ${secondaryBadge.borderClass}`}
                      >
                        {secondaryBadge.label}
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${targetBadge.bgClass} ${targetBadge.textClass} ${targetBadge.borderClass}`}
                    >
                      {targetBadge.label}
                    </span>

                    <span className="text-xs font-medium tabular-nums text-brand-text-muted">
                      #{report.report_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-brand-text-secondary">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(report.created_at).toLocaleString('vi-VN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {/* Row 2: Target summary identity */}
                <div className="text-xs sm:text-sm pt-0.5">
                  {renderTargetTitle(report)}
                </div>

                {/* Row 3: Reason */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-brand-text-muted">Lý do:</span>
                  <span className="font-semibold text-brand-price">
                    {REPORT_REASON_LABELS[report.reason] || report.reason}
                  </span>
                </div>

                {/* Row 4: Description (clean, no heavy boxing) */}
                {report.description && (
                  <p className="text-xs text-brand-text-secondary line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                )}

                {/* Row 5: Reporter, Evidence count indicator, and Detail cue */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-brand-border/40 text-[11px] text-brand-text-secondary">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-brand-text-muted">Bởi:</span>
                      {report.reporter ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            src={report.reporter.avatar_url}
                            name={report.reporter.full_name}
                            size="xs"
                          />
                          <span className="font-medium text-brand-text">
                            {report.reporter.full_name}
                          </span>
                        </div>
                      ) : (
                        <span>ID #{report.reporter_id}</span>
                      )}
                    </div>

                    {/* Evidence count indicator */}
                    {report.evidence_count > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                        <Paperclip className="h-3 w-3" />
                        <span>{report.evidence_count} minh chứng</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 font-semibold text-brand-burgundy group-hover:translate-x-0.5 transition-transform ml-auto">
                    <span>Xem chi tiết</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-xl border border-brand-border bg-white px-5 py-2.5 text-xs font-semibold text-brand-burgundy hover:bg-brand-soft-pink/40 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isFetchingNextPage ? 'Đang tải thêm...' : 'Tải thêm báo cáo'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {activeReportId != null && (
        <AdminReportDetailModal
          reportId={activeReportId}
          onClose={() => setActiveReportId(null)}
        />
      )}
    </div>
  );
}
