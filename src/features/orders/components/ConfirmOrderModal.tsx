import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Landmark, Loader2, QrCode, X, ArrowRight } from "lucide-react";
import type { OrderDetailResponse } from "../types";
import { useConfirmOrder } from "../hooks";
import { useMyBankAccount } from "@/features/users/hooks";

interface ConfirmOrderModalProps {
  order: OrderDetailResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const ConfirmOrderModal: React.FC<ConfirmOrderModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [paymentNote, setPaymentNote] = useState(
    order.payment_note || ""
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const confirmMutation = useConfirmOrder();

  const isPaidBankTransfer =
    order.payment_method === "BANK_TRANSFER" && Number(order.total_amount) > 0;

  const { data: bankAccount, isLoading: isBankLoading } = useMyBankAccount();

  if (!isOpen) return null;

  const hasMissingBank = isPaidBankTransfer && !isBankLoading && !bankAccount;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (hasMissingBank) {
      setErrorMsg(
        "Bạn cần thiết lập tài khoản nhận tiền trong Hồ sơ cá nhân trước khi xác nhận đơn chuyển khoản."
      );
      return;
    }

    try {
      await confirmMutation.mutateAsync({
        orderId: order.order_id,
        payload: { payment_note: paymentNote.trim() || undefined },
      });
      onClose();
    } catch (err: unknown) {
      const apiDetail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErrorMsg(apiDetail || "Không thể xác nhận đơn hàng, vui lòng thử lại.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-brand-warm-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-brand-border my-8">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black text-brand-text">
              Xác nhận đơn hàng
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

        <form onSubmit={handleConfirm} className="space-y-3.5 pt-3.5">
          <p className="text-xs sm:text-sm text-brand-text-secondary">
            Bạn có chắc chắn muốn xác nhận đơn hàng{" "}
            <span className="font-semibold tabular-nums text-brand-text">
              {order.order_code}
            </span>{" "}
            không?
          </p>

          {/* Paid BANK_TRANSFER bank check */}
          {isPaidBankTransfer && (
            <div>
              {isBankLoading ? (
                <div className="p-3 rounded-2xl bg-stone-50 border border-brand-border text-xs text-brand-text-muted flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang kiểm tra tài khoản nhận tiền...</span>
                </div>
              ) : bankAccount ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <Landmark className="w-4 h-4 text-amber-700" />
                      <span>Tài khoản nhận tiền VietQR:</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-burgundy bg-white px-2 py-0.5 rounded-md border border-brand-border">
                      <QrCode className="w-3 h-3" />
                      {bankAccount.bank_short_name || bankAccount.bank_code}
                    </span>
                  </div>

                  <div className="text-xs text-brand-text tabular-nums bg-white/80 p-2.5 rounded-xl border border-amber-200/60 space-y-1">
                    <div>
                      <span className="text-brand-text-muted">STK:</span>{" "}
                      <span className="font-semibold text-brand-text">{bankAccount.account_number}</span>
                    </div>
                    <div>
                      <span className="text-brand-text-muted">Chủ TK:</span>{" "}
                      <span className="font-semibold uppercase text-brand-text">{bankAccount.account_name}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-tight">
                    Thông tin tài khoản này sẽ được chốt cố định vào đơn hàng để người mua quét mã VietQR thanh toán.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2 text-xs font-bold text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Chưa có tài khoản nhận tiền</span>
                  </div>
                  <p className="text-xs text-red-600 leading-relaxed">
                    Bạn chưa thiết lập tài khoản ngân hàng trong Hồ sơ cá nhân. Vui lòng thiết lập tài khoản trước khi xác nhận đơn chuyển khoản để hệ thống có thể tạo mã VietQR cho người mua.
                  </p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-burgundy px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-burgundy-dark"
                  >
                    <span>Đến trang Hồ sơ cá nhân</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div className="mt-3">
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Ghi chú thêm cho người mua (không bắt buộc)
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Chuyển xong nhắn mình để mình đóng gói gửi ngay nhé..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {!isPaidBankTransfer && (
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Ghi chú cho người mua (không bắt buộc)
              </label>
              <textarea
                rows={2}
                placeholder="VD: Hẹn gặp đúng giờ tại địa điểm đã chọn..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none resize-none"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
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
              data-ui-role="seller-confirm-order"
              type="submit"
              disabled={confirmMutation.isPending || hasMissingBank}
              className="ui-primary-order-action btn-interactive px-5 py-2 rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2"
              style={
                confirmMutation.isPending
                  ? {
                      backgroundColor: '#722F37',
                      color: '#FFFFFF',
                      WebkitTextFillColor: '#FFFFFF',
                      border: '1px solid #722F37',
                      opacity: 1,
                      cursor: 'wait',
                    }
                  : hasMissingBank
                  ? {
                      backgroundColor: '#E7E5E4',
                      color: '#57534E',
                      WebkitTextFillColor: '#57534E',
                      border: '1px solid #D6D3D1',
                      opacity: 1,
                      cursor: 'not-allowed',
                    }
                  : {
                      backgroundColor: '#722F37',
                      color: '#FFFFFF',
                      WebkitTextFillColor: '#FFFFFF',
                      border: '1px solid #722F37',
                      opacity: 1,
                    }
              }
            >
              {confirmMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              )}
              Xác nhận đơn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
