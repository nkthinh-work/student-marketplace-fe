import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Loader2, Trash2, X, XCircle } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import {
  useApproveCommunityMoment,
  useDeleteAdminCommunityMoment,
  useRejectCommunityMoment,
} from '../hooks';
import type { AdminCommunityMomentItem } from '../types';

interface AdminMomentDetailModalProps {
  moment: AdminCommunityMomentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminMomentDetailModal: React.FC<AdminMomentDetailModalProps> = ({
  moment,
  isOpen,
  onClose,
}) => {
  const approveMutation = useApproveCommunityMoment();
  const rejectMutation = useRejectCommunityMoment();
  const deleteMutation = useDeleteAdminCommunityMoment();

  if (!isOpen || !moment || typeof document === 'undefined') return null;

  const isPending = moment.status === 'PENDING';
  const isApproved = moment.status === 'APPROVED';
  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    deleteMutation.isPending;

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(moment.moment_id);
      onClose();
    } catch {
      // Handled by react-query / error state
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(moment.moment_id);
      onClose();
    } catch {
      // Handled by react-query / error state
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(moment.moment_id);
      onClose();
    } catch {
      // Handled by react-query / error state
    }
  };

  const formattedDate = new Date(moment.created_at).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        onClick={() => !isMutating && onClose()}
        aria-label="Đóng chi tiết"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full sm:max-w-lg rounded-2xl bg-brand-warm-white p-4 sm:p-6 shadow-2xl border border-brand-border flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              src={moment.uploader.avatar_url || undefined}
              name={moment.uploader.full_name}
              size="md"
            />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-brand-text truncate">
                {moment.uploader.full_name}
              </h3>
              <p className="text-xs text-brand-text-muted">
                Tải lên: {formattedDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isMutating}
            className="icon-btn-interactive p-1.5 rounded-full text-brand-text-muted hover:text-brand-text hover:bg-black/5"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Large Image View */}
        <div className="my-3 flex-1 overflow-y-auto rounded-xl bg-black/5 border border-brand-border/60 flex items-center justify-center min-h-[220px] max-h-[55vh]">
          <img
            src={moment.detail_image_url || moment.image_url}
            alt="Ảnh cộng đồng gửi duyệt"
            className="max-h-[55vh] w-full object-contain rounded-xl"
          />
        </div>

        {/* Prominent Note Display */}
        {moment.note ? (
          <div className="my-2 p-3 rounded-xl bg-brand-soft-pink/40 border border-brand-burgundy/15 space-y-1 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-burgundy">
              Lời nhắn
            </span>
            <p className="text-sm font-medium text-brand-text break-words">
              {moment.note}
            </p>
          </div>
        ) : (
          <div className="my-1 text-xs text-brand-text-muted italic shrink-0">
            (Không có lời nhắn - bản ghi cũ)
          </div>
        )}

        {/* Status Tag */}
        <div className="flex items-center justify-between py-2 text-xs shrink-0">
          <span className="text-brand-text-muted">Trạng thái:</span>
          {moment.status === 'PENDING' && (
            <span className="px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              Chờ duyệt
            </span>
          )}
          {moment.status === 'APPROVED' && (
            <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
              Đang hiển thị {moment.reviewer ? `(bởi ${moment.reviewer.full_name})` : ''}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {isPending ? (
          <div className="pt-3 border-t border-brand-border/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleReject}
              disabled={isMutating}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-semibold active:scale-95 transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-1.5"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span>Từ chối</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isMutating}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-1.5"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>Duyệt ảnh</span>
            </button>
          </div>
        ) : isApproved ? (
          <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isMutating}
              className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs sm:text-sm font-semibold active:scale-95 transition-all disabled:opacity-50 min-h-[44px] flex items-center gap-1.5"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>Xóa khỏi Hero</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isMutating}
              className="px-4 py-2.5 rounded-xl bg-brand-soft-pink text-brand-text font-semibold text-xs sm:text-sm hover:bg-brand-soft-pink/80 min-h-[44px]"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-brand-border/60 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-brand-soft-pink text-brand-text font-semibold text-xs sm:text-sm"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
