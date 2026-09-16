import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CreditCard, Gift, Loader2, MapPin, Truck, X, Banknote } from "lucide-react";
import { createOrderSchema, type CreateOrderFormValues } from "../schemas";
import { useCreateOrder } from "../hooks";
import type { ProductDetailResponse } from "@/features/products/types";
import { useCurrentUser } from "@/features/users/hooks";
import { formatVND } from "@/lib/formatters";

interface DirectPurchaseModalProps {
  product: ProductDetailResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const DirectPurchaseModal: React.FC<DirectPurchaseModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const createOrderMutation = useCreateOrder();

  const isFree = Number(product.price) === 0;
  const availableStock = product.available_stock;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      product_id: product.product_id,
      quantity: 1,
      payment_method: isFree ? undefined : "CASH_ON_MEETUP",
      fulfillment_method: "MEETUP",
      meetup_place: "",
      contact_name: currentUser?.full_name || "",
      contact_phone: currentUser?.phone || "",
      buyer_note: "",
    },
  });

  const selectedPaymentMethod = watch("payment_method");
  const selectedFulfillmentMethod = watch("fulfillment_method");
  const quantity = watch("quantity") || 1;

  if (!isOpen) return null;

  const totalAmount = Number(product.price) * Number(quantity);

  const onSubmit = async (values: CreateOrderFormValues) => {
    try {
      const payload = {
        ...values,
        payment_method: isFree ? undefined : values.payment_method,
      };
      const created = await createOrderMutation.mutateAsync(payload);
      onClose();
      navigate(`/orders/${created.order_id}`);
    } catch (err: unknown) {
      // Error handled by mutation state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-brand-warm-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-brand-border my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <h3 className="text-lg font-black text-brand-text">
            {isFree ? "Nhận sản phẩm miễn phí" : "Đặt mua sản phẩm"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-brand-text-muted hover:text-brand-text rounded-full hover:bg-brand-soft-pink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product preview */}
        <div className="py-3.5 flex gap-3 items-center border-b border-brand-border/60">
          {product.images?.[0] && (
            <img
              src={product.images[0].image_url}
              alt={product.title}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-brand-border/60"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-brand-text text-sm truncate">
              {product.title}
            </h4>
            <div className="flex items-center gap-2">
              {isFree ? (
                <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-600">
                  <Gift className="w-4 h-4" />
                  Miễn phí (0 ₫)
                </span>
              ) : (
                <p className="text-sm font-black text-brand-price whitespace-nowrap tabular-nums">
                  {formatVND(product.price)}
                </p>
              )}
            </div>
            <p className="text-xs text-brand-text-muted">
              Còn lại khả dụng: {availableStock} sản phẩm
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 pt-3.5">
          {/* Quantity selector */}
          <div>
            <label className="block text-xs font-bold text-brand-text mb-1">
              Số lượng {isFree ? "nhận" : "mua"}
            </label>
            <input
              type="number"
              min={1}
              max={availableStock}
              {...register("quantity", { valueAsNumber: true })}
              className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-sm focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none"
            />
            {errors.quantity && (
              <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>
            )}
          </div>

          {/* Fulfillment Method */}
          <div>
            <label className="block text-xs font-bold text-brand-text mb-1.5">
              Hình thức nhận hàng
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setValue("fulfillment_method", "MEETUP");
                }}
                className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
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
                onClick={() => {
                  setValue("fulfillment_method", "SHIPPING");
                }}
                className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
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

          {/* Meetup Place / Shipping Address */}
          {selectedFulfillmentMethod === "MEETUP" ? (
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Địa điểm hẹn gặp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("meetup_place")}
                placeholder="VD: Canteen A2, Thư viện, KTX..."
                className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-sm focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none"
              />
              {errors.meetup_place && (
                <p className="text-xs text-red-500 mt-1">{errors.meetup_place.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Địa chỉ nhận hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("shipping_address")}
                placeholder="VD: Phòng 402 KTX PTIT, Nguyễn Trãi, Hà Đông..."
                className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-sm focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none"
              />
              {errors.shipping_address && (
                <p className="text-xs text-red-500 mt-1">{errors.shipping_address.message}</p>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          {isFree ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <Gift className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Sản phẩm miễn phí (0 đ) — Không cần chọn phương thức thanh toán.</span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1.5">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setValue("payment_method", "CASH_ON_MEETUP")}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    selectedPaymentMethod === "CASH_ON_MEETUP"
                      ? "border-brand-burgundy bg-brand-soft-pink text-brand-burgundy shadow-xs"
                      : "border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink/50"
                  }`}
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
                  onClick={() => setValue("payment_method", "BANK_TRANSFER")}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                    selectedPaymentMethod === "BANK_TRANSFER"
                      ? "border-brand-burgundy bg-brand-soft-pink text-brand-burgundy shadow-xs"
                      : "border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink/50"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-brand-burgundy" />
                  <span>Chuyển khoản VietQR</span>
                </button>
              </div>
            </div>
          )}

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Tên người nhận <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("contact_name")}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-sm focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none"
              />
              {errors.contact_name && (
                <p className="text-xs text-red-500 mt-1">{errors.contact_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("contact_phone")}
                className="w-full px-3 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-sm focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none font-mono"
              />
              {errors.contact_phone && (
                <p className="text-xs text-red-500 mt-1">{errors.contact_phone.message}</p>
              )}
            </div>
          </div>

          {/* Buyer Note */}
          <div>
            <label className="block text-xs font-bold text-brand-text mb-1">
              Ghi chú cho người bán (không bắt buộc)
            </label>
            <textarea
              rows={2}
              {...register("buyer_note")}
              placeholder="VD: Giao sau 5h chiều, hoặc hẹn ở cổng trước..."
              className="w-full px-3.5 py-2 rounded-xl border border-brand-border bg-white text-brand-text text-xs focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy focus:outline-none resize-none"
            />
          </div>

          {/* Total & Submit */}
          <div className="pt-3 border-t border-brand-border/60 flex flex-wrap items-end justify-between gap-3">
            <div className="flex-none">
              <span className="text-xs text-brand-text-muted block">Tổng thanh toán:</span>
              <span className="text-lg font-black text-brand-price whitespace-nowrap tabular-nums block">
                {isFree ? "0 ₫ (Miễn phí)" : formatVND(totalAmount)}
              </span>
            </div>

            <div className="flex items-center flex-none gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="btn-interactive px-4 py-2 rounded-2xl border border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="btn-interactive px-5 py-2 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {createOrderMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isFree ? "Xác nhận nhận" : "Xác nhận đặt mua"}
              </button>
            </div>
          </div>

          {createOrderMutation.isError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {(createOrderMutation.error as { response?: { data?: { detail?: string } } })
                  ?.response?.data?.detail || "Không thể tạo đơn hàng, vui lòng thử lại."}
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
