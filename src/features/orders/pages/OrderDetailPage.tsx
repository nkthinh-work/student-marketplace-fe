import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Edit3,
  Eye,
  HelpCircle,
  Info,
  Landmark,
  Loader2,
  MapPin,
  Package,
  QrCode,
  Truck,
  UploadCloud,
  User,
  X,
  XCircle,
  ZoomIn,
} from "lucide-react";
import {
  useCompleteOrder,
  useConfirmPayment,
  useMarkDelivering,
  useOrderDetail,
} from "../hooks";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { PaymentStatusBadge } from "../components/PaymentStatusBadge";
import { ConfirmOrderModal } from "../components/ConfirmOrderModal";
import { UploadReceiptModal } from "../components/UploadReceiptModal";
import { CancelOrderModal } from "../components/CancelOrderModal";
import { EditTransactionTermsModal } from "../components/EditTransactionTermsModal";
import { useCurrentUser } from "@/features/users/hooks";
import { getFulfillmentMethodLabel } from "@/lib/orderDisplay";

function formatFulfillmentTime(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${mins}, ${day}/${month}/${year}`;
  } catch {
    return null;
  }
}

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const idNum = Number(orderId);
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();

  const { data: order, isLoading, isError } = useOrderDetail(idNum);

  const confirmPaymentMutation = useConfirmPayment();
  const markDeliveringMutation = useMarkDelivering();
  const completeOrderMutation = useCompleteOrder();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isEditTermsModalOpen, setIsEditTermsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [viewReceiptModal, setViewReceiptModal] = useState(false);
  const [viewQrModal, setViewQrModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-burgundy mb-3" />
        <p className="text-sm text-brand-text-muted">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border">
          <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-brand-text mb-1">
            Không tìm thấy đơn hàng
          </h2>
          <p className="text-xs text-brand-text-muted mb-6">
            Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-brand-burgundy text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const isBuyer = currentUser?.user_id === order.buyer_id;
  const isSeller = currentUser?.user_id === order.seller_id;
  const isFreeOrder = Number(order.total_amount) === 0;

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Actions eligibility
  const canBuyerUploadReceipt =
    isBuyer &&
    !isFreeOrder &&
    order.payment_method === "BANK_TRANSFER" &&
    order.status === "CONFIRMED" &&
    order.payment_status !== "PAID";

  const canSellerConfirmOrder = isSeller && order.status === "PENDING";

  const canSellerEditTerms =
    isSeller && (order.status === "PENDING" || order.status === "CONFIRMED");

  const canSellerConfirmPayment =
    isSeller &&
    !isFreeOrder &&
    order.payment_status !== "PAID" &&
    ((order.payment_method === "BANK_TRANSFER" &&
      order.status === "CONFIRMED" &&
      order.payment_status === "VERIFYING" &&
      !!order.payment_receipt_url) ||
      (order.payment_method === "CASH_ON_MEETUP" &&
        order.payment_status === "UNPAID" &&
        (order.status === "CONFIRMED" ||
          (order.fulfillment_method === "SHIPPING" &&
            order.status === "DELIVERING"))));

  const canSellerMarkDelivering =
    isSeller &&
    order.fulfillment_method === "SHIPPING" &&
    order.status === "CONFIRMED" &&
    (order.payment_method === "CASH_ON_MEETUP" || order.payment_status === "PAID");

  const canCompleteOrder =
    (isBuyer || isSeller) &&
    order.payment_status === "PAID" &&
    ((order.fulfillment_method === "MEETUP" && order.status === "CONFIRMED") ||
      (order.fulfillment_method === "SHIPPING" && order.status === "DELIVERING"));

  const canCancelOrder =
    (isBuyer || isSeller) &&
    (order.status === "PENDING" ||
      (order.status === "CONFIRMED" &&
        (isFreeOrder || order.payment_status === "UNPAID")));

  const handleConfirmPayment = async () => {
    setActionError(null);
    try {
      await confirmPaymentMutation.mutateAsync(order.order_id);
    } catch (err: unknown) {
      const apiDetail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(apiDetail || "Không thể xác nhận thanh toán.");
    }
  };

  const handleMarkDelivering = async () => {
    setActionError(null);
    try {
      await markDeliveringMutation.mutateAsync(order.order_id);
    } catch (err: unknown) {
      const apiDetail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(apiDetail || "Không thể chuyển sang trạng thái đang giao.");
    }
  };

  const handleCompleteOrder = async () => {
    setActionError(null);
    try {
      await completeOrderMutation.mutateAsync(order.order_id);
    } catch (err: unknown) {
      const apiDetail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(apiDetail || "Không thể hoàn tất đơn hàng.");
    }
  };

  const primaryItem = order.items[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6 space-y-4">
      {/* 1. Top navigation & Unified Contextual Status */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn-interactive inline-flex items-center gap-1.5 text-xs font-bold text-brand-text-muted hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-2">
          <OrderStatusBadge order={order} role={isBuyer ? "buyer" : "seller"} />
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="p-1 hover:bg-red-100 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Order Identity & Action Bar Card */}
      <div className="bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-card border border-brand-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3.5">
          <div>
            <span className="text-[11px] font-mono text-brand-text-muted uppercase tracking-wider block">
              Mã đơn hàng
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black font-mono text-brand-text">
                {order.order_code}
              </h2>
              <button
                type="button"
                onClick={() => handleCopy(order.order_code, "order_code")}
                className="p-1 rounded-md text-brand-text-muted hover:bg-stone-100"
                title="Sao chép mã đơn"
              >
                {copiedKey === "order_code" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-brand-text-muted">
            <span className="block">Thời gian đặt:</span>
            <span className="font-semibold text-brand-text">
              {new Date(order.created_at).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Seller Confirm Order */}
          {canSellerConfirmOrder && (
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="btn-interactive px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận đơn hàng
            </button>
          )}

          {/* Seller Confirm Payment */}
          {canSellerConfirmPayment && (
            <button
              onClick={handleConfirmPayment}
              disabled={confirmPaymentMutation.isPending}
              className="btn-interactive px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {confirmPaymentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Xác nhận đã nhận tiền
            </button>
          )}

          {/* Seller Deliver Order (Shipping only) */}
          {canSellerMarkDelivering && (
            <button
              onClick={handleMarkDelivering}
              disabled={markDeliveringMutation.isPending}
              className="btn-interactive px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {markDeliveringMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              Bắt đầu giao hàng
            </button>
          )}

          {/* Buyer / Seller Complete Order */}
          {canCompleteOrder && (
            <button
              onClick={handleCompleteOrder}
              disabled={completeOrderMutation.isPending}
              className="btn-interactive px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {completeOrderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Hoàn tất đơn hàng
            </button>
          )}

          {/* Cancel Order */}
          {canCancelOrder && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="btn-interactive px-3.5 py-2 rounded-2xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Hủy đơn
            </button>
          )}
        </div>
      </div>

      {/* 3. Product Snapshot Card */}
      {primaryItem && (
        <div className="bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-card border border-brand-border space-y-3">
          <div className="flex items-center gap-3.5">
            {primaryItem.product_image_url ? (
              <img
                src={primaryItem.product_image_url}
                alt={primaryItem.product_title}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-brand-border/60 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-soft-pink flex items-center justify-center text-brand-burgundy shrink-0">
                <Package className="w-8 h-8 stroke-1" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-brand-text truncate">
                {primaryItem.product_title}
              </h3>
              <p className="text-xs text-brand-text-muted mt-0.5">
                Số lượng: <span className="font-semibold text-brand-text">{primaryItem.quantity}</span>
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xs text-brand-text-muted">Đơn giá:</span>
                <span className="font-bold text-sm text-brand-text">
                  {isFreeOrder ? "0 đ" : `${Number(primaryItem.price_at_purchase).toLocaleString("vi-VN")} đ`}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-brand-text-muted block">Tổng giá trị</span>
              <span className={`text-base sm:text-lg font-black ${isFreeOrder ? "text-emerald-700" : "text-brand-price"}`}>
                {isFreeOrder ? "Miễn phí" : `${Number(order.total_amount).toLocaleString("vi-VN")} đ`}
              </span>
            </div>
          </div>

          {order.buyer_note && (
            <div className="mt-3 pt-3 border-t border-brand-border/60 text-xs bg-stone-50/70 p-3 rounded-2xl">
              <span className="font-bold text-brand-text block mb-0.5">Ghi chú của người mua:</span>
              <p className="text-brand-text-secondary">{order.buyer_note}</p>
            </div>
          )}
        </div>
      )}

      {/* 4. Counterparty & Fulfillment details (Clean separation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Participant Info */}
        <div className="bg-brand-warm-white rounded-3xl p-5 shadow-card border border-brand-border space-y-3">
          <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">
            {isBuyer ? "Thông tin người bán" : "Thông tin người mua"}
          </h4>
          <Link
            to={`/users/${isBuyer ? order.seller_id : order.buyer_id}`}
            className="group flex items-center gap-3 p-2 -m-2 rounded-2xl hover:bg-brand-soft-pink/50 transition-colors cursor-pointer"
            aria-label={`Xem hồ sơ của ${isBuyer ? order.seller_name : order.buyer_name}`}
          >
            {isBuyer ? (
              order.seller_avatar_url ? (
                <img
                  src={order.seller_avatar_url}
                  alt={order.seller_name}
                  className="w-12 h-12 rounded-full object-cover border border-brand-border group-hover:border-brand-burgundy/40 transition-colors shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-soft-pink flex items-center justify-center text-brand-burgundy group-hover:bg-brand-burgundy/10 transition-colors shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )
            ) : order.buyer_avatar_url ? (
              <img
                src={order.buyer_avatar_url}
                alt={order.buyer_name}
                className="w-12 h-12 rounded-full object-cover border border-brand-border group-hover:border-brand-burgundy/40 transition-colors shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-brand-soft-pink flex items-center justify-center text-brand-burgundy group-hover:bg-brand-burgundy/10 transition-colors shrink-0">
                <User className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-bold text-brand-text text-sm sm:text-base truncate group-hover:text-brand-burgundy transition-colors">
                {isBuyer ? order.seller_name : order.buyer_name}
              </p>
              <p className="text-xs text-brand-text-muted">
                {isBuyer ? "Người bán sản phẩm" : "Người đặt mua"}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-brand-text-muted/60 group-hover:text-brand-burgundy group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>

        {/* Fulfillment Info */}
        <div className="bg-brand-warm-white rounded-3xl p-5 shadow-card border border-brand-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">
              Giao nhận
            </h4>
            {canSellerEditTerms && (
              <button
                type="button"
                onClick={() => setIsEditTermsModalOpen(true)}
                className="text-[11px] font-bold text-brand-burgundy hover:underline inline-flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-brand-text-muted block text-[11px] mb-0.5">Người nhận</span>
              <p className="font-semibold text-brand-text text-xs sm:text-sm">{order.contact_name}</p>
              <p className="text-brand-text-secondary text-xs">{order.contact_phone}</p>
            </div>

            <div>
              <span className="text-brand-text-muted block text-[11px] mb-0.5">Hình thức nhận hàng</span>
              <div className="flex items-center gap-1.5 font-bold text-brand-text text-xs sm:text-sm">
                {order.fulfillment_method === "MEETUP" ? (
                  <>
                    <MapPin className="w-4 h-4 text-brand-price shrink-0" />
                    <span>{getFulfillmentMethodLabel("MEETUP")}</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{getFulfillmentMethodLabel("SHIPPING")}</span>
                  </>
                )}
              </div>
            </div>

            {order.fulfillment_method === "MEETUP" && order.meetup_place && (
              <div>
                <span className="text-brand-text-muted block text-[11px] mb-0.5">Địa điểm hẹn</span>
                <p className="font-medium text-brand-text text-xs sm:text-sm leading-relaxed">
                  {order.meetup_place}
                </p>
              </div>
            )}

            {order.fulfillment_method === "MEETUP" && formatFulfillmentTime(order.meetup_time) && (
              <div>
                <span className="text-brand-text-muted block text-[11px] mb-0.5">Thời gian hẹn</span>
                <p className="font-medium text-brand-text text-xs sm:text-sm">
                  {formatFulfillmentTime(order.meetup_time)}
                </p>
              </div>
            )}

            {order.fulfillment_method === "SHIPPING" && order.shipping_address && (
              <div>
                <span className="text-brand-text-muted block text-[11px] mb-0.5">Địa chỉ nhận hàng</span>
                <p className="font-medium text-brand-text text-xs sm:text-sm leading-relaxed">
                  {order.shipping_address}
                </p>
              </div>
            )}

            {order.fulfillment_method === "SHIPPING" && formatFulfillmentTime(order.shipping_expected_at) && (
              <div>
                <span className="text-brand-text-muted block text-[11px] mb-0.5">Thời gian giao dự kiến</span>
                <p className="font-medium text-brand-text text-xs sm:text-sm">
                  {formatFulfillmentTime(order.shipping_expected_at)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Payment Card — ONLY rendered for Paid orders */}
      {!isFreeOrder && (
        <div className="bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-card border border-brand-border space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <div className="flex items-center gap-2">
              {order.payment_method === "BANK_TRANSFER" ? (
                <Landmark className="w-4 h-4 text-brand-burgundy" />
              ) : (
                <CreditCard className="w-4 h-4 text-brand-burgundy" />
              )}
              <h3 className="text-sm font-bold text-brand-text">
                {order.payment_method === "BANK_TRANSFER"
                  ? "Thanh toán chuyển khoản VietQR"
                  : "Thanh toán tiền mặt"}
              </h3>
            </div>
            <PaymentStatusBadge
              paymentStatus={order.payment_status}
              paymentMethod={order.payment_method}
              fulfillmentMethod={order.fulfillment_method}
              totalAmount={order.total_amount}
            />
          </div>

          {/* Bank Transfer Details & VietQR */}
          {order.payment_method === "BANK_TRANSFER" && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                <span className="text-xs font-medium text-amber-900">Số tiền cần thanh toán:</span>
                <span className="text-lg font-black text-brand-price font-mono">
                  {Number(order.total_amount).toLocaleString("vi-VN")} đ
                </span>
              </div>

              {order.payment_bank ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Bank details with 1-click copy */}
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-brand-text-muted block text-[11px]">Ngân hàng thụ hưởng:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-brand-burgundy/10 text-brand-burgundy font-bold font-mono text-[11px]">
                          {order.payment_bank.bank_short_name || order.payment_bank.bank_bin}
                        </span>
                        <span className="font-semibold text-brand-text">
                          {order.payment_bank.bank_name}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-brand-text-muted block text-[11px]">Số tài khoản:</span>
                      <div className="flex items-center justify-between mt-0.5 p-2 rounded-xl bg-white border border-brand-border">
                        <span className="font-mono text-sm font-bold text-brand-text">
                          {order.payment_bank.account_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.payment_bank!.account_number, "stk")}
                          className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-xs font-semibold text-brand-text hover:bg-stone-200"
                        >
                          {copiedKey === "stk" ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-brand-text-muted block text-[11px]">Chủ tài khoản:</span>
                      <p className="font-mono font-bold uppercase text-brand-text mt-0.5">
                        {order.payment_bank.account_name}
                      </p>
                    </div>

                    <div>
                      <span className="text-brand-text-muted block text-[11px]">Nội dung chuyển tiền:</span>
                      <div className="flex items-center justify-between mt-0.5 p-2 rounded-xl bg-white border border-brand-border">
                        <span className="font-mono text-xs font-bold text-brand-text">
                          {order.order_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.order_code, "nd")}
                          className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-xs font-semibold text-brand-text hover:bg-stone-200"
                        >
                          {copiedKey === "nd" ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: VietQR Code Box & Receipt Upload CTA */}
                  <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-brand-border space-y-2">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setViewQrModal(true)}
                    >
                      <img
                        src={order.payment_bank.qr_url || ""}
                        alt="VietQR"
                        className="w-36 h-36 object-contain rounded-xl border border-stone-100"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" />
                        <span>Phóng to</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewQrModal(true)}
                      className="text-[11px] font-bold text-brand-burgundy hover:underline inline-flex items-center gap-1"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Xem mã VietQR lớn</span>
                    </button>

                    {/* Buyer Upload Receipt Button directly below VietQR */}
                    {canBuyerUploadReceipt && (
                      <button
                        type="button"
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="btn-interactive w-full mt-1.5 px-3 py-2 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{order.payment_receipt_url ? "Thay biên nhận thanh toán" : "Tải lên biên nhận thanh toán"}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-text-muted italic">
                  Thông tin ngân hàng sẽ được cập nhật khi người bán xác nhận đơn.
                </p>
              )}

              {order.payment_note && (
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Ghi chú của người bán:</span>
                    <span>{order.payment_note}</span>
                  </div>
                </div>
              )}

              {/* Payment Receipt status */}
              {order.payment_receipt_url && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-brand-border space-y-2">
                  <span className="text-xs font-bold text-brand-text block">Biên nhận thanh toán:</span>
                  <div className="flex items-center gap-3">
                    <img
                      src={order.payment_receipt_url}
                      alt="Biên nhận"
                      className="w-16 h-16 rounded-xl object-cover border border-brand-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setViewReceiptModal(true)}
                    />
                    <div className="text-xs text-brand-text-secondary space-y-1">
                      <button
                        type="button"
                        onClick={() => setViewReceiptModal(true)}
                        className="font-bold text-brand-burgundy hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem ảnh biên nhận</span>
                      </button>
                      <p className="text-[11px] text-brand-text-muted">
                        {order.receipt_uploaded_at &&
                          `Tải lên lúc ${new Date(order.receipt_uploaded_at).toLocaleString("vi-VN")}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cash Payment Details */}
          {order.payment_method === "CASH_ON_MEETUP" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-baseline justify-between p-3.5 rounded-2xl bg-stone-50 border border-brand-border">
                <span className="font-medium text-brand-text-muted">Số tiền thanh toán:</span>
                <span className="text-base sm:text-lg font-black text-brand-price">
                  {Number(order.total_amount).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <p className="text-brand-text-secondary leading-relaxed">
                {order.fulfillment_method === "SHIPPING"
                  ? "Phương thức: Tiền mặt khi nhận hàng (COD). Người mua kiểm tra hàng và thanh toán tiền mặt trực tiếp cho người giao."
                  : "Phương thức: Tiền mặt khi gặp mặt trực tiếp. Người mua thanh toán tiền mặt cho người bán khi nhận sản phẩm."}
              </p>
              {order.payment_note && (
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Ghi chú của người bán:</span>
                    <span>{order.payment_note}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Order Timeline / History Card */}
      <div className="bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-card border border-brand-border space-y-3">
        <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">
          Lịch sử đơn hàng
        </h4>
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-brand-text block">Đã tạo đơn hàng</span>
              <span className="text-[11px] text-brand-text-muted">
                {new Date(order.created_at).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          {order.confirmed_at && (
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-text block">Người bán đã xác nhận đơn</span>
                <span className="text-[11px] text-brand-text-muted">
                  {new Date(order.confirmed_at).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          )}

          {order.receipt_uploaded_at && (
            <div className="flex items-start gap-2.5">
              <UploadCloud className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-text block">Người mua đã tải lên biên nhận</span>
                <span className="text-[11px] text-brand-text-muted">
                  {new Date(order.receipt_uploaded_at).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          )}

          {order.paid_confirmed_at && (
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-text block">Đã xác nhận thanh toán</span>
                <span className="text-[11px] text-brand-text-muted">
                  {new Date(order.paid_confirmed_at).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          )}

          {order.status === "DELIVERING" && (
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-text block">Đang giao hàng</span>
                <span className="text-[11px] text-brand-text-muted">
                  Người bán đang thực hiện giao hàng đến địa chỉ của bạn
                </span>
              </div>
            </div>
          )}

          {order.completed_at && (
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-text block">Đơn hàng đã hoàn tất</span>
                <span className="text-[11px] text-brand-text-muted">
                  {new Date(order.completed_at).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          )}

          {order.cancelled_at && (
            <div className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-red-700 block">
                  Đơn hàng đã hủy ({order.cancelled_by === "SELLER" ? "Người bán hủy" : order.cancelled_by === "BUYER" ? "Người mua hủy" : "Hệ thống hủy"})
                </span>
                {order.cancel_reason && (
                  <p className="text-brand-text-secondary mt-0.5">Lý do: {order.cancel_reason}</p>
                )}
                <span className="text-[11px] text-brand-text-muted">
                  {new Date(order.cancelled_at).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmOrderModal
        order={order}
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
      />

      <EditTransactionTermsModal
        order={order}
        isOpen={isEditTermsModalOpen}
        onClose={() => setIsEditTermsModalOpen(false)}
      />

      <UploadReceiptModal
        order={order}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />

      <CancelOrderModal
        order={order}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />

      {/* Receipt Image Zoom Modal */}
      {viewReceiptModal && order.payment_receipt_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setViewReceiptModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl space-y-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <span className="text-xs font-bold text-brand-text">Biên nhận thanh toán</span>
              <button
                onClick={() => setViewReceiptModal(false)}
                className="p-1 rounded-full text-brand-text-muted hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-stone-50">
              <img
                src={order.payment_receipt_url}
                alt="Receipt Full"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* VietQR Zoom Modal */}
      {viewQrModal && order.payment_bank && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in"
          onClick={() => setViewQrModal(false)}
        >
          <div
            className="relative max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-text">
                <QrCode className="w-4 h-4 text-brand-burgundy" />
                <span>Mã VietQR - {order.payment_bank.bank_short_name}</span>
              </div>
              <button
                onClick={() => setViewQrModal(false)}
                className="p-1 rounded-full text-brand-text-muted hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center bg-stone-50 p-4 rounded-2xl">
              <img
                src={order.payment_bank.qr_url || ""}
                alt="VietQR Full"
                className="w-64 h-64 object-contain rounded-xl"
              />
            </div>

            <div className="space-y-1 text-xs text-brand-text">
              <div className="font-bold">{order.payment_bank.bank_name}</div>
              <div className="font-mono text-sm">{order.payment_bank.account_number}</div>
              <div className="font-mono uppercase font-bold">{order.payment_bank.account_name}</div>
              <div className="font-black text-brand-price text-base pt-1">
                {Number(order.total_amount).toLocaleString("vi-VN")} đ
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
