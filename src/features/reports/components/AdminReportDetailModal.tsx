import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Paperclip,
  Maximize2,
  Image as ImageIcon,
  Play,
  Package,
  UserX,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowLeft,
} from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { getAdminReportEvidenceBlob } from '../api';
import {
  MODERATION_ACTION_LABELS,
  REPORT_REASON_LABELS,
  TARGET_USER_STATUS_LABELS,
  TARGET_PRODUCT_STATUS_LABELS,
  TARGET_ORDER_STATUS_LABELS,
} from '../constants';
import {
  useAdminReportDetail,
  useEnforceAdminReportAction,
  useUpdateAdminReportStatus,
} from '../hooks';
import type {
  AdminEnforcementRequest,
  ModerationActionType,
  OrderTargetSummary,
  ProductTargetSummary,
  ReportEvidenceMetadata,
  ReportedSubjectSummary,
  UserTargetSummary,
} from '../types';
import { SubjectReportHistoryCard } from './SubjectReportHistoryCard';
import { CapabilityRestrictionModal } from './CapabilityRestrictionModal';

interface EvidenceThumbnailProps {
  reportId: number;
  attachment: ReportEvidenceMetadata;
  onClick: () => void;
}

function EvidenceThumbnail({ reportId, attachment, onClick }: EvidenceThumbnailProps) {
  const isVideo = attachment.media_type === 'VIDEO' || attachment.mime_type.startsWith('video/');
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isVideo);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isVideo) {
      setLoading(false);
      return;
    }
    let active = true;
    const controller = new AbortController();
    let objectUrl: string | null = null;

    getAdminReportEvidenceBlob(
      reportId,
      attachment.attachment_id,
      'thumbnail',
      controller.signal
    )
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setThumbUrl(objectUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (!active || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [reportId, attachment.attachment_id, isVideo]);

  const sizeMb = (attachment.size_bytes / (1024 * 1024)).toFixed(2);

  if (isVideo) {
    return (
      <div
        onClick={onClick}
        className="group relative aspect-square rounded-2xl border border-zinc-700 bg-zinc-900 text-white overflow-hidden shadow-2xs hover:shadow-md hover:border-brand-burgundy/60 transition-all cursor-pointer flex flex-col items-center justify-center p-2 text-center"
        title={`${attachment.original_name} (${sizeMb} MB - Video)`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-burgundy/90 text-white shadow-sm group-hover:scale-110 group-hover:bg-brand-burgundy transition-all">
          <Play className="h-5 w-5 fill-white ml-0.5" />
        </div>
        <span className="mt-2 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
          VIDEO
        </span>
        <span className="text-[10px] text-zinc-400 truncate max-w-full px-1">
          {sizeMb} MB
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="group relative aspect-square rounded-2xl border border-brand-border bg-white overflow-hidden shadow-2xs hover:shadow-md hover:border-brand-burgundy/40 transition-all cursor-pointer flex items-center justify-center"
      title={`${attachment.original_name} (${sizeMb} MB)`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-brand-text-muted" />
      ) : error || !thumbUrl ? (
        <div className="flex flex-col items-center p-2 text-center text-gray-400">
          <ImageIcon className="h-5 w-5" />
          <span className="text-[10px] mt-1">Lỗi tải ảnh</span>
        </div>
      ) : (
        <>
          <img
            src={thumbUrl}
            alt={attachment.original_name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </div>
        </>
      )}
    </div>
  );
}

interface EvidenceLightboxProps {
  reportId: number;
  attachment: ReportEvidenceMetadata;
  onClose: () => void;
}

function EvidenceLightbox({ reportId, attachment, onClose }: EvidenceLightboxProps) {
  const isVideo = attachment.media_type === 'VIDEO' || attachment.mime_type.startsWith('video/');
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const videoSrc = isVideo
    ? `/api/v1/admin/reports/${reportId}/evidence/${attachment.attachment_id}`
    : null;

  useEffect(() => {
    if (isVideo) {
      setLoading(false);
      return;
    }
    let active = true;
    const controller = new AbortController();
    let objectUrl: string | null = null;

    getAdminReportEvidenceBlob(
      reportId,
      attachment.attachment_id,
      'full',
      controller.signal
    )
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setFullUrl(objectUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (!active || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [reportId, attachment.attachment_id, isVideo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const sizeMb = (attachment.size_bytes / (1024 * 1024)).toFixed(2);

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-900 text-white overflow-hidden shadow-2xl border border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-semibold truncate">{attachment.original_name}</p>
            <p className="text-[10px] text-zinc-400">
              {sizeMb} MB &bull; {attachment.mime_type} {isVideo ? '(Video)' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Đóng minh chứng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-3 overflow-hidden bg-black/40 min-h-[250px] max-h-[75vh]">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-white/80" />
              <span className="text-xs text-zinc-400">
                {isVideo ? 'Đang chuẩn bị phát video...' : 'Đang tải ảnh kích thước gốc...'}
              </span>
            </div>
          ) : error || (!fullUrl && !videoSrc) ? (
            <div className="text-center text-xs text-rose-400 p-4">
              Không thể tải minh chứng từ máy chủ. Vui lòng kiểm tra quyền quản trị viên.
            </div>
          ) : isVideo && videoSrc ? (
            <div className="w-full max-h-[72vh] flex items-center justify-center">
              <video
                controls
                preload="metadata"
                playsInline
                src={videoSrc}
                className="max-h-[72vh] max-w-full rounded-lg shadow-md bg-black"
                onError={() => setError(true)}
              >
                Trình duyệt của bạn không hỗ trợ phát video này.
              </video>
            </div>
          ) : (
            <img
              src={fullUrl!}
              alt={attachment.original_name}
              className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-md"
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface AdminReportDetailModalProps {
  reportId: number;
  onClose: () => void;
}

export function AdminReportDetailModal({
  reportId: initialReportId,
  onClose,
}: AdminReportDetailModalProps) {
  // Modal stacking for navigating through historical reports
  const [currentReportId, setCurrentReportId] = useState<number>(initialReportId);
  const [reportStack, setReportStack] = useState<number[]>([]);

  // Step 1 (REVIEW) vs Step 2 (ENFORCEMENT) - Strictly local frontend state!
  const [reviewStep, setReviewStep] = useState<'REVIEW' | 'ENFORCEMENT'>('REVIEW');

  // Confirmation dialogs
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showProductHideConfirm, setShowProductHideConfirm] = useState(false);
  const [isCapabilityModalOpen, setIsCapabilityModalOpen] = useState(false);
  const [pendingReversal, setPendingReversal] = useState<{
    action: string;
    label: string;
    description: string;
    capabilities?: ('BUY' | 'SELL')[];
  } | null>(null);

  // Lightbox
  const [activeLightboxAttachment, setActiveLightboxAttachment] =
    useState<ReportEvidenceMetadata | null>(null);

  // Feedback banners
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const { data: report, isLoading, error, refetch } = useAdminReportDetail(currentReportId);
  const updateStatusMutation = useUpdateAdminReportStatus();
  const enforceMutation = useEnforceAdminReportAction();
  const navigate = useNavigate();

  // Reset local review step when switching reports
  useEffect(() => {
    setReviewStep('REVIEW');
    setActionError(null);
    setSuccessMessage(null);
    setConflictMessage(null);
  }, [currentReportId]);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path, { state: { returnTo: '/admin/reports' } });
  };

  const handleSelectHistoricalReport = (selectedId: number) => {
    setReportStack((prev) => [...prev, currentReportId]);
    setCurrentReportId(selectedId);
  };

  const handleBackToPreviousReport = () => {
    setReportStack((prev) => {
      const copy = [...prev];
      const previousId = copy.pop();
      if (previousId != null) {
        setCurrentReportId(previousId);
      }
      return copy;
    });
  };

  // Step 1 action: Bỏ qua -> PATCH /status REJECTED
  const handleRejectReport = async () => {
    setActionError(null);
    setSuccessMessage(null);
    setConflictMessage(null);
    setShowRejectConfirm(false);

    try {
      await updateStatusMutation.mutateAsync({
        reportId: currentReportId,
        status: 'REJECTED',
      });
      setSuccessMessage('Đã bỏ qua báo cáo - Không áp dụng biện pháp xử lý.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setConflictMessage('Trạng thái báo cáo đã thay đổi. Đang tải lại dữ liệu mới nhất.');
        await refetch();
        setTimeout(() => setConflictMessage(null), 4500);
        return;
      }
      const respData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      setActionError(respData?.detail || 'Không thể bỏ qua báo cáo. Vui lòng thử lại sau.');
    }
  };

  // Step 2 actions: Actual enforcement
  const handleEnforce = async (req: AdminEnforcementRequest, successText: string) => {
    setActionError(null);
    setSuccessMessage(null);
    setConflictMessage(null);
    setShowBanConfirm(false);
    setShowProductHideConfirm(false);
    setIsCapabilityModalOpen(false);
    setPendingReversal(null);

    try {
      await enforceMutation.mutateAsync({
        reportId: currentReportId,
        data: req,
      });
      setSuccessMessage(successText);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setConflictMessage('Dữ liệu đã thay đổi hoặc xung đột xử lý. Đang tải lại thông tin mới nhất.');
        await refetch();
        setTimeout(() => setConflictMessage(null), 4500);
        return;
      }
      const respData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      setActionError(respData?.detail || 'Không thể thực thi chế tài. Vui lòng thử lại sau.');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-brand-warm-white p-6 shadow-xl">
          <LoadingSpinner message="Đang tải chi tiết báo cáo..." />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-brand-warm-white p-6 text-center shadow-xl">
          <AlertTriangle className="mx-auto h-10 w-10 text-brand-price" />
          <h3 className="mt-3 text-base font-bold text-brand-text">
            Không tìm thấy báo cáo
          </h3>
          <p className="mt-1 text-xs text-brand-text-secondary">
            Báo cáo không tồn tại hoặc bạn không có quyền xem.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {reportStack.length > 0 && (
              <button
                type="button"
                onClick={handleBackToPreviousReport}
                className="rounded-xl border border-brand-border px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Quay lại báo cáo trước
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-brand-burgundy px-4 py-2 text-xs font-semibold text-white cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isResolved = report.status === 'RESOLVED';
  const isRejected = report.status === 'REJECTED';
  const isCompleted = isResolved || isRejected || report.workflow_state === 'COMPLETED';

  // Status badge (Strictly: Cần xử lý / Đã xử lý / Đã bỏ qua)
  const statusBadge = isRejected
    ? {
        label: 'Đã bỏ qua',
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-700',
        borderClass: 'border-slate-200',
      }
    : isResolved
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

  const isMutating = updateStatusMutation.isPending || enforceMutation.isPending;
  const evidenceList = report.evidence || [];
  const reportedSubject: ReportedSubjectSummary | undefined = report.reported_subject ?? undefined;

  // Target Details (Section A)
  const renderTargetDetails = () => {
    if (!report.target_available || !report.target_summary) {
      return (
        <div className="flex items-center gap-2 rounded-2xl bg-stone-50 p-3 text-xs text-brand-text-muted border border-brand-border/60">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Đối tượng không còn tồn tại hoặc đã bị xóa khỏi hệ thống.</span>
        </div>
      );
    }

    if (report.target_type === 'USER') {
      const u = report.target_summary as UserTargetSummary;
      const statusLabel = TARGET_USER_STATUS_LABELS[u.status] || u.status;
      const isAdmin = u.role === 'ADMIN';
      return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-soft-pink/30 p-3.5 border border-brand-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={u.avatar_url} name={u.full_name} size="md" className="shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-xs sm:text-sm text-brand-text truncate">
                {u.full_name}
              </div>
              <div className="text-xs text-brand-text-secondary pt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-brand-text-muted">
                  {isAdmin ? 'Quản trị viên' : 'Sinh viên'}
                </span>
                <span>&bull;</span>
                <span
                  className={
                    u.status === 'ACTIVE'
                      ? 'font-medium text-emerald-700'
                      : u.status === 'BANNED'
                      ? 'font-medium text-red-600'
                      : 'font-medium text-brand-text-muted'
                  }
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNavigate(`/users/${u.user_id}`)}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-burgundy hover:bg-brand-soft-pink transition-colors shrink-0 cursor-pointer"
          >
            <span>Xem hồ sơ</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    if (report.target_type === 'PRODUCT') {
      const p = report.target_summary as ProductTargetSummary;
      const statusLabel = TARGET_PRODUCT_STATUS_LABELS[p.status] || p.status;
      const isBlocked = p.moderation_status === 'BLOCKED';
      const canView = !p.is_deleted && !isBlocked;

      return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-soft-pink/30 p-3.5 border border-brand-border/60">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-brand-soft-pink flex items-center justify-center text-brand-burgundy shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs sm:text-sm text-brand-text line-clamp-1">
                {p.title}
              </div>
              <div className="text-xs text-brand-text-secondary pt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-brand-text-muted">Tin đăng</span>
                {p.seller && (
                  <>
                    <span>&bull;</span>
                    <span className="truncate">Người bán: {p.seller.full_name}</span>
                  </>
                )}
                <span>&bull;</span>
                <span className={p.status === 'AVAILABLE' ? 'font-medium text-emerald-700' : 'font-medium text-brand-text-muted'}>
                  {statusLabel}
                </span>
                {isBlocked && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                    Đã bị ẩn bởi quản trị viên
                  </span>
                )}
                {p.is_deleted && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                    ĐÃ XÓA
                  </span>
                )}
              </div>
            </div>
          </div>
          {canView && (
            <button
              type="button"
              onClick={() => handleNavigate(`/products/${p.product_id}`)}
              className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-burgundy hover:bg-brand-soft-pink transition-colors shrink-0 cursor-pointer"
            >
              <span>Xem tin</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      );
    }

    if (report.target_type === 'ORDER') {
      const o = report.target_summary as OrderTargetSummary;
      const statusLabel = TARGET_ORDER_STATUS_LABELS[o.status] || o.status;
      return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-soft-pink/30 p-3.5 border border-brand-border/60">
          <div className="min-w-0 flex-1 pr-2">
            <div className="font-semibold text-xs sm:text-sm text-brand-text tabular-nums">
              Đơn hàng #{o.order_code}
            </div>
            <div className="text-xs text-brand-text-secondary pt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-brand-text-muted">Giao dịch</span>
              {o.total_amount != null && (
                <>
                  <span>&bull;</span>
                  <span className="font-medium text-brand-price tabular-nums">{o.total_amount.toLocaleString('vi-VN')} ₫</span>
                </>
              )}
              <span>&bull;</span>
              <span className="font-medium text-brand-text-secondary">{statusLabel}</span>
              {o.buyer && o.seller && (
                <>
                  <span>&bull;</span>
                  <span className="text-brand-text-muted truncate">
                    {o.buyer.full_name} ↔ {o.seller.full_name}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNavigate(`/orders/${o.order_id}`)}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-burgundy hover:bg-brand-soft-pink transition-colors shrink-0 cursor-pointer"
          >
            <span>Xem đơn</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      );
    }

    return null;
  };

  // Reversals available
  const canRestoreProduct = report.available_enforcement_actions?.includes('PRODUCT_RESTORE');
  const canUnbanUser = report.available_enforcement_actions?.includes('USER_UNBAN');
  const buyRestrictionRestorable = reportedSubject?.active_restrictions?.some(
    (r) => r.capability === 'BUY' && r.restorable_from_current_report
  );
  const sellRestrictionRestorable = reportedSubject?.active_restrictions?.some(
    (r) => r.capability === 'SELL' && r.restorable_from_current_report
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-brand-warm-white shadow-2xl overflow-hidden border border-brand-border">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-brand-border/60 bg-white px-5 py-4 shrink-0">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <ShieldAlert className="h-5 w-5 text-brand-burgundy shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-brand-text truncate">
                    Báo cáo vi phạm #{report.report_id}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-xs text-brand-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(report.created_at).toLocaleString('vi-VN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                  {report.handler && (
                    <>
                      <span>&bull;</span>
                      <span>Xử lý bởi: <span className="font-medium text-brand-text-secondary">{report.handler.full_name}</span></span>
                    </>
                  )}
                  {report.handled_at && (
                    <>
                      <span>&bull;</span>
                      <span>Lúc: {new Date(report.handled_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2 shrink-0">
              {reportStack.length > 0 && (
                <button
                  type="button"
                  onClick={handleBackToPreviousReport}
                  className="flex items-center gap-1 rounded-xl border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-burgundy hover:bg-stone-50 cursor-pointer"
                  title="Quay lại báo cáo trước"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Quay lại</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="icon-btn-interactive flex h-8 w-8 items-center justify-center rounded-full text-brand-text-secondary hover:bg-gray-100 cursor-pointer"
                aria-label="Đóng chi tiết"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs sm:text-sm">
            {/* Feedback Banners */}
            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {conflictMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 border border-amber-200 animate-in fade-in duration-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>{conflictMessage}</span>
              </div>
            )}

            {actionError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800 border border-red-200 animate-in fade-in duration-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{actionError}</span>
              </div>
            )}

            {/* SECTION A: Object / Subject being reported */}
            <div>
              <h4 className="text-xs font-semibold text-brand-text-secondary mb-1.5">
                Đối tượng bị báo cáo
              </h4>
              {renderTargetDetails()}
            </div>

            {/* SECTION B: Reason & Reporter Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-brand-text-secondary">
                Lý do & Mô tả từ người báo cáo
              </h4>
              <div className="rounded-2xl bg-white p-3.5 border border-brand-border/60 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brand-price">
                    {REPORT_REASON_LABELS[report.reason] || report.reason}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
                  {report.description || 'Không có mô tả chi tiết kèm theo.'}
                </p>

                {/* Reporter info snippet */}
                <div className="pt-2 border-t border-brand-border/40 flex items-center justify-between text-[11px] text-brand-text-secondary">
                  <span>Người gửi báo cáo:</span>
                  {report.reporter ? (
                    <div className="flex items-center gap-1.5 font-medium text-brand-text">
                      <Avatar src={report.reporter.avatar_url} name={report.reporter.full_name} size="xs" />
                      <span>{report.reporter.full_name}</span>
                    </div>
                  ) : (
                    <span>Người dùng #{report.reporter_id}</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION C: Evidence Gallery (Prominent before actions!) */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-brand-text-secondary flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                <span>Minh chứng người báo cáo ({evidenceList.length})</span>
              </h4>

              {evidenceList.length === 0 ? (
                <div className="rounded-2xl bg-white p-3.5 border border-brand-border/60 text-center text-xs text-brand-text-muted">
                  Người báo cáo không gửi minh chứng đính kèm.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 rounded-2xl bg-white p-3.5 border border-brand-border/60 shadow-2xs">
                  {evidenceList.map((att) => (
                    <EvidenceThumbnail
                      key={att.attachment_id}
                      reportId={report.report_id}
                      attachment={att}
                      onClick={() => setActiveLightboxAttachment(att)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* SECTION D: Reported Subject Account Info (USER or ORDER only) */}
            {reportedSubject && (report.target_type === 'USER' || report.target_type === 'ORDER') && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-brand-text-secondary">
                  Thông tin tài khoản bị báo cáo
                </h4>
                <div className="rounded-2xl bg-white p-3.5 border border-brand-border/60 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={reportedSubject.avatar_url}
                        name={reportedSubject.full_name}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs sm:text-sm text-brand-text truncate">
                          {reportedSubject.full_name}
                        </div>
                        <div className="text-xs text-brand-text-secondary pt-0.5 flex flex-wrap items-center gap-1.5">
                          {reportedSubject.role_in_order && (
                            <>
                              <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
                                {reportedSubject.role_in_order === 'SELLER' ? 'Người bán trong đơn' : 'Người mua trong đơn'}
                              </span>
                              <span>&bull;</span>
                            </>
                          )}
                          <span
                            className={
                              reportedSubject.status === 'ACTIVE'
                                ? 'text-emerald-700 font-medium'
                                : reportedSubject.status === 'BANNED'
                                ? 'text-red-600 font-medium'
                                : 'text-brand-text-muted font-medium'
                            }
                          >
                            {TARGET_USER_STATUS_LABELS[reportedSubject.status] || reportedSubject.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNavigate(`/users/${reportedSubject.user_id}`)}
                      className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-brand-burgundy hover:bg-brand-soft-pink transition-colors shrink-0 cursor-pointer"
                    >
                      <span>Xem hồ sơ</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Capabilities Status Row */}
                  <div className="pt-2 border-t border-brand-border/40 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-brand-border/40">
                      <span className="text-brand-text-secondary">Quyền mua hàng:</span>
                      <span className={reportedSubject.can_buy ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                        {reportedSubject.can_buy ? 'Bình thường' : 'Bị hạn chế'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-brand-border/40">
                      <span className="text-brand-text-secondary">Quyền bán hàng:</span>
                      <span className={reportedSubject.can_sell ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                        {reportedSubject.can_sell ? 'Bình thường' : 'Bị hạn chế'}
                      </span>
                    </div>
                  </div>

                  {/* Active Restrictions Details */}
                  {reportedSubject.active_restrictions && reportedSubject.active_restrictions.length > 0 && (
                    <div className="pt-1 space-y-1">
                      {reportedSubject.active_restrictions.map((res, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900"
                        >
                          <div className="flex items-center gap-1.5">
                            <Lock className="h-3 w-3 text-amber-700" />
                            <span>
                              Hạn chế quyền {res.capability === 'BUY' ? 'mua hàng' : 'bán hàng'}
                            </span>
                          </div>
                          <span className="font-medium text-amber-800">
                            {res.expires_at
                              ? `Đến ${new Date(res.expires_at).toLocaleDateString('vi-VN')}`
                              : 'Không thời hạn (dữ liệu cũ)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION E: Reported Subject History Card (USER or ORDER only) */}
            {reportedSubject && (report.target_type === 'USER' || report.target_type === 'ORDER') && (
              <SubjectReportHistoryCard
                userId={reportedSubject.user_id}
                excludeReportId={currentReportId}
                onSelectReport={handleSelectHistoricalReport}
              />
            )}

            {/* Completed Result Summary (When report is handled) */}
            {isCompleted && (
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs font-semibold text-brand-text-secondary">
                  Kết quả xử lý báo cáo
                </h4>
                <div className="rounded-2xl bg-white p-3.5 border border-brand-border/60 shadow-2xs space-y-2">
                  {isRejected ? (
                    <div className="text-xs text-brand-text-secondary">
                      <span className="font-bold text-slate-700 uppercase tracking-wide">ĐÃ BỎ QUA</span>
                      <p className="mt-0.5 text-xs text-brand-text">
                        Báo cáo này đã được bỏ qua và không áp dụng biện pháp xử lý nào lên đối tượng.
                      </p>
                    </div>
                  ) : report.enforcement_actions && report.enforcement_actions.length > 0 ? (
                    <div className="space-y-2">
                      <span className="font-bold text-emerald-800 text-xs uppercase tracking-wide">
                        ĐÃ XỬ LÝ VI PHẠM
                      </span>
                      <div className="space-y-1.5 divide-y divide-brand-border/40">
                        {report.enforcement_actions.map((act) => (
                          <div key={act.moderation_action_id} className="pt-1.5 first:pt-0 text-xs">
                            <div className="flex items-center justify-between font-semibold text-brand-text">
                              <span>{MODERATION_ACTION_LABELS[act.action_type] || act.action_type}</span>
                              <span className="text-[11px] text-brand-text-muted font-normal">
                                {new Date(act.created_at).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            {act.admin && (
                              <p className="text-[11px] text-brand-text-muted pt-0.5">
                                Thực hiện bởi: {act.admin.full_name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-brand-text-secondary">
                      <span className="font-bold text-emerald-800 uppercase tracking-wide">ĐÃ XỬ LÝ</span>
                      <p className="mt-0.5 text-xs text-brand-text-muted">
                        Đã xử lý (dữ liệu cũ)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION F: Actions Footer */}
          <div className="border-t border-brand-border/60 bg-white p-4 shrink-0">
            {isCompleted ? (
              // Completed Report Footer
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-brand-border px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                {/* Contextual Reversal / Restore Buttons */}
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  {canRestoreProduct && (
                    <button
                      type="button"
                      onClick={() =>
                        setPendingReversal({
                          action: 'PRODUCT_RESTORE',
                          label: 'Hiện lại tin đăng',
                          description: 'Bạn có chắc chắn muốn hiện lại tin đăng này? Tin đăng sẽ trở lại trạng thái hiển thị bình thường.',
                        })
                      }
                      disabled={isMutating}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Hiện lại tin đăng</span>
                    </button>
                  )}

                  {canUnbanUser && (
                    <button
                      type="button"
                      onClick={() =>
                        setPendingReversal({
                          action: 'USER_UNBAN',
                          label: 'Mở khóa tài khoản',
                          description: 'Bạn có chắc chắn muốn mở khóa tài khoản này? Người dùng sẽ có thể đăng nhập lại.',
                        })
                      }
                      disabled={isMutating}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Mở khóa tài khoản</span>
                    </button>
                  )}

                  {buyRestrictionRestorable && (
                    <button
                      type="button"
                      onClick={() =>
                        setPendingReversal({
                          action: 'CAPABILITY_RESTORE',
                          capabilities: ['BUY'],
                          label: 'Gỡ hạn chế mua hàng',
                          description: 'Gỡ bỏ lệnh hạn chế quyền mua hàng đã áp dụng từ báo cáo này.',
                        })
                      }
                      disabled={isMutating}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Gỡ hạn chế mua hàng</span>
                    </button>
                  )}

                  {sellRestrictionRestorable && (
                    <button
                      type="button"
                      onClick={() =>
                        setPendingReversal({
                          action: 'CAPABILITY_RESTORE',
                          capabilities: ['SELL'],
                          label: 'Gỡ hạn chế bán hàng',
                          description: 'Gỡ bỏ lệnh hạn chế quyền bán hàng đã áp dụng từ báo cáo này. Các tin đăng đủ điều kiện sẽ tự động hiển thị trở lại.',
                        })
                      }
                      disabled={isMutating}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Gỡ hạn chế bán hàng</span>
                    </button>
                  )}
                </div>
              </div>
            ) : reviewStep === 'REVIEW' ? (
              // Step 1: Initial Action Footer (ONLY [ Ghi nhận vi phạm ] and [ Bỏ qua ])
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isMutating}
                  className="rounded-xl border border-brand-border px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Đóng
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={isMutating}
                    className="rounded-xl border border-brand-border bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-brand-text transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Bỏ qua
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStep('ENFORCEMENT')}
                    disabled={isMutating}
                    className="btn-interactive flex items-center gap-1.5 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy-dark px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Ghi nhận vi phạm</span>
                  </button>
                </div>
              </div>
            ) : (
              // Step 2: Enforcement Controls (Only after Ghi nhận vi phạm is chosen locally)
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                    {report.target_type === 'PRODUCT' ? 'XỬ LÝ TIN ĐĂNG' : 'CHỌN BIỆN PHÁP XỬ LÝ'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReviewStep('REVIEW')}
                    disabled={isMutating}
                    className="text-xs font-medium text-brand-text-muted hover:text-brand-text hover:underline cursor-pointer ml-auto"
                  >
                    &larr; Quay lại xem xét
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {/* For PRODUCT Report: Only [ Ẩn tin đăng ] */}
                    {report.target_type === 'PRODUCT' && (
                      <button
                        type="button"
                        onClick={() => setShowProductHideConfirm(true)}
                        disabled={isMutating}
                        className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Ẩn tin đăng</span>
                      </button>
                    )}

                    {/* For USER / ORDER Report: [ Hạn chế quyền... ] and [ Khóa tài khoản ] */}
                    {(report.target_type === 'USER' || report.target_type === 'ORDER') && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsCapabilityModalOpen(true)}
                          disabled={isMutating}
                          className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Hạn chế quyền...</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowBanConfirm(true)}
                          disabled={isMutating}
                          className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span>Khóa tài khoản</span>
                        </button>
                      </>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Size Image Lightbox Modal */}
      {activeLightboxAttachment && (
        <EvidenceLightbox
          reportId={report.report_id}
          attachment={activeLightboxAttachment}
          onClose={() => setActiveLightboxAttachment(null)}
        />
      )}

      {/* Reject Confirmation Dialog */}
      {showRejectConfirm && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isMutating && setShowRejectConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-brand-border space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-stone-100 text-brand-text">
                <AlertTriangle className="h-5 w-5 text-stone-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-text">
                  Bỏ qua báo cáo này?
                </h3>
                <p className="mt-1 text-xs text-brand-text-secondary leading-relaxed">
                  Báo cáo sẽ được chuyển sang trạng thái <b>Đã bỏ qua</b> và không áp dụng biện pháp xử lý nào lên đối tượng.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/40">
              <button
                type="button"
                onClick={() => setShowRejectConfirm(false)}
                disabled={isMutating}
                className="rounded-xl border border-brand-border px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRejectReport}
                disabled={isMutating}
                className="btn-interactive flex items-center gap-1.5 rounded-xl bg-brand-text hover:bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Xác nhận bỏ qua</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Hide Confirmation Dialog */}
      {showProductHideConfirm && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isMutating && setShowProductHideConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-brand-border space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-red-50 text-red-600">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-text">
                  Ẩn tin đăng này?
                </h3>
                <p className="mt-1 text-xs text-brand-text-secondary leading-relaxed">
                  Tin đăng sẽ bị ẩn ngay lập tức, các phiên đấu giá đang diễn ra hoặc đã lên lịch sẽ bị hủy, và báo cáo sẽ được đánh dấu <b>Đã xử lý</b>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/40">
              <button
                type="button"
                onClick={() => setShowProductHideConfirm(false)}
                disabled={isMutating}
                className="rounded-xl border border-brand-border px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() =>
                  handleEnforce({ action: 'PRODUCT_HIDE' }, 'Đã ẩn tin đăng và hoàn tất xử lý báo cáo.')
                }
                disabled={isMutating}
                className="btn-interactive flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Ẩn tin đăng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Ban Confirmation Dialog */}
      {showBanConfirm && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isMutating && setShowBanConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-brand-border space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-red-50 text-red-600">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-text">
                  Khóa tài khoản {reportedSubject ? reportedSubject.full_name : ''}?
                </h3>
                <p className="mt-1 text-xs text-brand-text-secondary leading-relaxed">
                  Tài khoản sẽ bị khóa hoàn toàn, phiên đăng nhập bị hủy ngay lập tức, và báo cáo sẽ được đánh dấu <b>Đã xử lý</b>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/40">
              <button
                type="button"
                onClick={() => setShowBanConfirm(false)}
                disabled={isMutating}
                className="rounded-xl border border-brand-border px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() =>
                  handleEnforce({ action: 'USER_BAN' }, 'Đã khóa tài khoản người dùng và hoàn tất xử lý báo cáo.')
                }
                disabled={isMutating}
                className="btn-interactive flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Khóa tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capability Restriction Modal */}
      {isCapabilityModalOpen && reportedSubject && (
        <CapabilityRestrictionModal
          targetName={reportedSubject.full_name}
          isOpen={isCapabilityModalOpen}
          onClose={() => setIsCapabilityModalOpen(false)}
          isSubmitting={isMutating}
          onSubmit={async (capabilities, durationDays) => {
            await handleEnforce(
              {
                action: 'CAPABILITY_RESTRICT',
                capabilities,
                duration_days: durationDays,
              },
              'Đã áp dụng hạn chế quyền và hoàn tất xử lý báo cáo.'
            );
          }}
        />
      )}

      {/* Reversal Confirmation Dialog */}
      {pendingReversal && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isMutating && setPendingReversal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-brand-border space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-text">
                  {pendingReversal.label}?
                </h3>
                <p className="mt-1 text-xs text-brand-text-secondary leading-relaxed">
                  {pendingReversal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border/40">
              <button
                type="button"
                onClick={() => setPendingReversal(null)}
                disabled={isMutating}
                className="rounded-xl border border-brand-border px-3.5 py-2 text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() =>
                  handleEnforce(
                    {
                      action: pendingReversal.action as ModerationActionType | 'CAPABILITY_RESTORE',
                      capabilities: pendingReversal.capabilities,
                    },
                    `Đã thực hiện: ${pendingReversal.label}.`
                  )
                }
                disabled={isMutating}
                className="btn-interactive flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isMutating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Xác nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
