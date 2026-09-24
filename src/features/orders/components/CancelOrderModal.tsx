import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Loader2, X } from "lucide-react";
import type { OrderDetailResponse } from "../types";
import { useCancelOrder } from "../hooks";

interface CancelOrderModalProps {
  order: OrderDetailResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [cancelReason, setCancelReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cancelMutation = useCancelOrder();

  if (!isOpen) return null;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setErrorMsg("Vui lòng nhập lý do hủy đơn hàng.");
      return;
    }

    try {
      await cancelMutation.mutateAsync({
        orderId: order.order_id,
        payload: { cancel_reason: cancelReason.trim() },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || "Không thể hủy đơn hàng, vui lòng thử lại."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-brand-warm-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-brand-border">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-black text-brand-text">
              Hủy đơn hàng
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-brand-text-muted hover:text-brand-text rounded-full hover:bg-brand-soft-pink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCancel} className="space-y-3.5 pt-3.5">
          <p className="text-xs sm:text-sm text-brand-text-secondary">
            Bạn có chắc chắn muốn hủy đơn hàng{" "}
            <span className="font-semibold tabular-nums text-brand-text">
              {order.order_code}
            </span>{" "}
            không? Thao tác này sẽ giải phóng số lượng giữ hàng.
          </p>

          <div>
            <label className="block text-xs font-bold text-brand-text mb-1">
              Lý do hủy đơn *
            </label>
            <textarea
              rows={3}
              placeholder="VD: Thay đổi nhu cầu, không thể gặp mặt, hết hàng..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive px-4 py-2 rounded-2xl border border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink text-xs font-bold"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="btn-interactive px-5 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {cancelMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Xác nhận hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
