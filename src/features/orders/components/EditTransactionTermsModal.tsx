import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Banknote,
  CreditCard,
  Edit3,
  Gift,
  Landmark,
  Loader2,
  Lock,
  MapPin,
  Truck,
  X,
  ArrowRight,
} from "lucide-react";
import type { OrderDetailResponse } from "../types";
import {
  updateTransactionTermsSchema,
  type UpdateTransactionTermsFormValues,
} from "../schemas";
import { useUpdateTransactionTerms } from "../hooks";
import { useMyBankAccount } from "@/features/users/hooks";

interface EditTransactionTermsModalProps {
  order: OrderDetailResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionTermsModal: React.FC<
  EditTransactionTermsModalProps
> = ({ order, isOpen, onClose }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const updateTermsMutation = useUpdateTransactionTerms();
  const { data: bankAccount, isLoading: isBankLoading } = useMyBankAccount();

  const isFree = Number(order.total_amount) === 0;
  const isPaymentLocked =
    order.payment_status === "VERIFYING" || order.payment_status === "PAID";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateTransactionTermsFormValues>({
    resolver: zodResolver(updateTransactionTermsSchema),
    defaultValues: {
      fulfillment_method: order.fulfillment_method as "MEETUP" | "SHIPPING",
      payment_method: isFree
        ? undefined
        : (order.payment_method as "CASH_ON_MEETUP" | "BANK_TRANSFER"),
      meetup_place: order.meetup_place || "",
      meetup_time: order.meetup_time ? order.meetup_time.slice(0, 16) : "",
      shipping_address: order.shipping_address || "",
      payment_note: order.payment_note || "",
    },
  });

  const selectedFulfillmentMethod = watch("fulfillment_method");
  const selectedPaymentMethod = watch("payment_method");

  if (!isOpen) return null;

  const hasMissingBank =
    !isFree &&
    selectedPaymentMethod === "BANK_TRANSFER" &&
    !isBankLoading &&
    !bankAccount;

  const onSubmit = async (values: UpdateTransactionTermsFormValues) => {
    setErrorMsg(null);

    if (hasMissingBank) {
      setErrorMsg(
        "Bạn cần thiết lập tài khoản nhận tiền trong Hồ sơ cá nhân trước khi chuyển sang hình thức chuyển khoản VietQR."
      );
      return;
    }

    try {
      const payload = {
        fulfillment_method: values.fulfillment_method,
        payment_method: isFree || isPaymentLocked ? undefined : values.payment_method,
        meetup_place:
          values.fulfillment_method === "MEETUP"
            ? values.meetup_place?.trim() || undefined
            : undefined,
        meetup_time:
          values.fulfillment_method === "MEETUP"
            ? values.meetup_time || undefined
            : undefined,
        shipping_address:
          values.fulfillment_method === "SHIPPING"
            ? values.shipping_address?.trim() || undefined
            : undefined,
        payment_note: values.payment_note?.trim() || undefined,
      };

      await updateTermsMutation.mutateAsync({
        orderId: order.order_id,
        payload,
      });

      onClose();
    } catch (err: unknown) {
      const apiDetail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setErrorMsg(
        apiDetail || "Không thể cập nhật điều khoản đơn hàng, vui lòng thử lại."
      );
    }
  };

  // Determine changes for Diff summary
  const fulfillmentChanged =
    selectedFulfillmentMethod !== order.fulfillment_method;
  const paymentChanged =
    !isFree && selectedPaymentMethod !== order.payment_method;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-brand-warm-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-brand-border my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-soft-pink text-brand-burgundy">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-brand-text">
                Điều chỉnh giao nhận & thanh toán
              </h3>
              <p className="text-xs text-brand-text-muted">
                Đơn hàng #{order.order_code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-brand-text-muted hover:text-brand-text rounded-full hover:bg-brand-soft-pink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Fulfillment Method Selection */}
          <div>
            <label className="block text-xs font-bold text-brand-text mb-1.5">
              Hình thức giao nhận
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setValue("fulfillment_method", "MEETUP")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                  selectedFulfillmentMethod === "MEETUP"
                    ? "border-brand-burgundy bg-brand-soft-pink text-brand-burgundy shadow-xs"
                    : "border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink/50"
                }`}
              >
                <MapPin className="w-4 h-4 text-brand-price" />
                <span>Gặp trực tiếp</span>
              </button>

              <button
                type="button"
                onClick={() => setValue("fulfillment_method", "SHIPPING")}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                  selectedFulfillmentMethod === "SHIPPING"
                    ? "border-brand-burgundy bg-brand-soft-pink text-brand-burgundy shadow-xs"
                    : "border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink/50"
                }`}
              >
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Giao hàng</span>
              </button>
            </div>
          </div>

          {/* Fulfillment Location Input */}
          {selectedFulfillmentMethod === "MEETUP" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Địa điểm hẹn gặp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("meetup_place")}
                  placeholder="VD: Căn tin A2, Sảnh tòa nhà PTIT..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none"
                />
                {errors.meetup_place && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.meetup_place.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Thời gian hẹn (không bắt buộc)
                </label>
                <input
                  type="datetime-local"
                  {...register("meetup_time")}
                  className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Địa chỉ giao hàng <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                {...register("shipping_address")}
                placeholder="VD: Phòng 402 KTX PTIT, Nguyễn Trãi, Hà Đông..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text text-sm focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none resize-none"
              />
              {errors.shipping_address && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.shipping_address.message}
                </p>
              )}
            </div>
          )}

          {/* Payment Method Selection */}
          {isFree ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <Gift className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Đơn hàng miễn phí (0 đ) — Không áp dụng phương thức thanh toán.</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-brand-text">
                  Phương thức thanh toán
                </label>
                {isPaymentLocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Lock className="w-3 h-3" />
                    Đã thanh toán / Đang kiểm tra
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isPaymentLocked}
                  onClick={() => setValue("payment_method", "CASH_ON_MEETUP")}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    selectedPaymentMethod === "CASH_ON_MEETUP"
                      ? "border-brand-burgundy bg-brand-soft-pink text-brand-burgundy shadow-xs"
                      : "border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink/50"
                  } ${isPaymentLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>
                    {selectedFulfillmentMethod === "MEETUP"
                      ? "Tiền mặt khi gặp"
                      : "Tiền mặt khi nhận"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isPaymentLocked}
                  onClick={() => setValue("payment_method", "BANK_TRANSFER")}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    selectedPaymentMethod === "BANK_TRANSFER"
                      ? "border-brand-burgundy bg-brand-soft-pink text-brand-burgundy shadow-xs"
                      : "border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink/50"
                  } ${isPaymentLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <CreditCard className="w-4 h-4 text-brand-burgundy" />
                  <span>Chuyển khoản VietQR</span>
                </button>
              </div>

              {/* Missing Bank Account Warning */}
              {hasMissingBank && (
                <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Landmark className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Chưa có thông tin tài khoản nhận tiền</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Để kích hoạt VietQR cho đơn hàng này, bạn cần thêm số tài khoản ngân hàng trong Hồ sơ cá nhân.
                  </p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-burgundy hover:underline pt-0.5"
                  >
                    <span>Cập nhật tài khoản nhận tiền</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Payment Note Input */}
          <div>
            <label className="block text-xs font-bold text-brand-text mb-1">
              Ghi chú thêm cho người mua (không bắt buộc)
            </label>
            <textarea
              rows={2}
              {...register("payment_note")}
              placeholder="VD: Nhớ mang tiền lẻ, hoặc liên hệ trước khi đến..."
              className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none resize-none"
            />
          </div>

          {/* Summary / Diff Alert */}
          {(fulfillmentChanged || paymentChanged) && (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <span className="font-bold block text-blue-950">Thay đổi áp dụng:</span>
              {fulfillmentChanged && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span>Hình thức:</span>
                  <span className="line-through text-blue-600">
                    {order.fulfillment_method === "MEETUP"
                      ? "Gặp trực tiếp"
                      : "Giao hàng"}
                  </span>
                  <span>→</span>
                  <span className="font-bold text-blue-900">
                    {selectedFulfillmentMethod === "MEETUP"
                      ? "Gặp trực tiếp"
                      : "Giao hàng"}
                  </span>
                </div>
              )}
              {paymentChanged && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span>Thanh toán:</span>
                  <span className="line-through text-blue-600">
                    {order.payment_method === "BANK_TRANSFER"
                      ? "Chuyển khoản VietQR"
                      : "Tiền mặt"}
                  </span>
                  <span>→</span>
                  <span className="font-bold text-blue-900">
                    {selectedPaymentMethod === "BANK_TRANSFER"
                      ? "Chuyển khoản VietQR"
                      : "Tiền mặt"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-2 border-t border-brand-border/60 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive px-4 py-2 rounded-2xl border border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink text-xs font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateTermsMutation.isPending || hasMissingBank}
              className="btn-interactive px-5 py-2 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {updateTermsMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
