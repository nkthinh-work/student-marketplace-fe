import React, { useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
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
  Star,
  Truck,
  UploadCloud,
  User,
  X,
  XCircle,
  ZoomIn,
  MessageSquare,
  Flag,
} from "lucide-react";
import {
  useCompleteOrder,
  useConfirmPayment,
  useMarkDelivering,
  useOrderDetail,
} from "../hooks";
import { useCreateConversationFromOrder } from "@/features/conversations/hooks";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { PaymentStatusBadge } from "../components/PaymentStatusBadge";
import { ConfirmOrderModal } from "../components/ConfirmOrderModal";
import { UploadReceiptModal } from "../components/UploadReceiptModal";
import { CancelOrderModal } from "../components/CancelOrderModal";
import { EditTransactionTermsModal } from "../components/EditTransactionTermsModal";
import { useCurrentUser } from "@/features/users/hooks";
import { getFulfillmentMethodLabel } from "@/lib/orderDisplay";
import { StarRating, ReviewModal, useOrderReview } from "@/features/reviews";
import { ReportModal } from "@/features/reports";
import { formatVND } from "@/lib/formatters";

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
  const location = useLocation();
  const { data: currentUser } = useCurrentUser();

  const { data: order, isLoading, isError } = useOrderDetail(idNum);

  const confirmPaymentMutation = useConfirmPayment();
  const markDeliveringMutation = useMarkDelivering();
  const completeOrderMutation = useCompleteOrder();
  const createConversationFromOrderMutation = useCreateConversationFromOrder();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isEditTermsModalOpen, setIsEditTermsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [viewReceiptModal, setViewReceiptModal] = useState(false);
  const [viewQrModal, setViewQrModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isCompleted = order?.status === "COMPLETED";
  const isParticipant = Boolean(
    currentUser &&
    order &&
    (currentUser.user_id === order.buyer_id ||
      currentUser.user_id === order.seller_id)
  );
  const { data: reviewData, isLoading: isLoadingReview } = useOrderReview(
    idNum,
    Boolean(isCompleted && isParticipant)
  );

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
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/orders/buying", { replace: true });
              }
            }}
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

  const handleOpenChat = async () => {
    setActionError(null);
    try {
      const conv = await createConversationFromOrderMutation.mutateAsync({
        order_id: order.order_id,
      });
      navigate(`/messages/${conv.conversation_id}`);
    } catch (err: unknown) {
      const apiDetail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(apiDetail || "Không thể mở cuộc trò chuyện cho đơn hàng này.");
    }
  };

  const primaryItem = order.items[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6 space-y-4">
      {/* 1. Top navigation & Unified Contextual Status */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate(isBuyer ? "/orders/buying" : "/orders/selling", { replace: true });
            }
          }}
          className="btn-interactive inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-muted hover:text-brand-burgundy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-2 flex-none">
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
            <span className="text-xs font-medium text-brand-text-muted block">
              Mã đơn hàng
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tabular-nums text-brand-text">
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

          <div className="text-left sm:text-right text-xs text-brand-text-muted flex flex-col sm:items-end justify-between gap-1">
            <div>
              <span className="block">Thời gian đặt:</span>
              <span className="font-semibold text-brand-text">
                {new Date(order.created_at).toLocaleString("vi-VN")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-rose-600 transition-colors cursor-pointer mt-1"
              title="Báo cáo đơn hàng"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Báo cáo đơn</span>
            </button>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Seller Confirm Order */}
          {canSellerConfirmOrder && (
            <button
              data-ui-role="seller-confirm-order"
              onClick={() => setIsConfirmModalOpen(true)}
              className="ui-primary-order-action btn-interactive px-4 py-2 rounded-2xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: '#722F37',
                color: '#FFFFFF',
                WebkitTextFillColor: '#FFFFFF',
                border: '1px solid #722F37',
                opacity: 1,
              }}
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
              className="btn-interactive px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
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
              className="btn-interactive px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
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
              className="btn-interactive px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {completeOrderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Hoàn tất đơn hàng
            </button>
          )}

          {/* Open Canonical Direct Chat for this Order */}
          <button
            type="button"
            onClick={handleOpenChat}
            disabled={createConversationFromOrderMutation.isPending}
            className="btn-interactive px-3.5 py-2 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
          >
            {createConversationFromOrderMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4 text-brand-burgundy" />
            )}
            <span>{isBuyer ? "Nhắn với người bán" : "Nhắn với người mua"}</span>
          </button>

          {/* Cancel Order */}
          {canCancelOrder && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="btn-interactive px-3.5 py-2 rounded-2xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Hủy đơn
            </button>
          )}
        </div>
      </div>

      {/* 3. Product Snapshot Card */}
      {primaryItem && (
        <div className="bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-card border border-brand-border space-y-3.5 min-w-0">
          {/* Row 1: Product image + info */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
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
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm sm:text-base text-brand-text line-clamp-2 break-words [overflow-wrap:anywhere] leading-snug">
                {primaryItem.product_title}
              </h3>
              <p className="text-xs text-brand-text-muted mt-1">
                Số lượng: <span className="font-semibold text-brand-text">{primaryItem.quantity}</span>
              </p>
            </div>
          </div>

          {/* Row 2: 2-column responsive price metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-brand-border/60">
            <div className="min-w-0">
              <span className="text-xs text-brand-text-muted block mb-0.5">Đơn giá</span>
              <span className="font-bold text-sm sm:text-base text-brand-text whitespace-nowrap tabular-nums block">
                {isFreeOrder ? "Miễn phí" : formatVND(primaryItem.price_at_purchase)}
              </span>
            </div>
            <div className="min-w-0 text-right">
              <span className="text-xs text-brand-text-muted block mb-0.5">Tổng giá trị</span>
              <span
                className={`text-base sm:text-lg font-bold whitespace-nowrap tabular-nums block ${isFreeOrder ? "text-emerald-700" : "text-brand-price"
                  }`}
              >
                {isFreeOrder ? "Miễn phí" : formatVND(order.total_amount)}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
        {/* Participant Info */}
        <div className="bg-brand-warm-white rounded-3xl p-5 shadow-card border border-brand-border space-y-3 min-w-0">
          <h4 className="text-xs font-semibold text-brand-text-secondary">
            {isBuyer ? "Thông tin người bán" : "Thông tin người mua"}
          </h4>
          <Link
            to={`/users/${isBuyer ? order.seller_id : order.buyer_id}`}
            state={{
              fromApp: true,
              returnTo: location.pathname + location.search + location.hash,
              returnLabel: 'order',
            }}
            className="group flex items-center gap-3 p-2 -m-2 rounded-2xl hover:bg-brand-soft-pink/50 transition-colors cursor-pointer min-w-0"
            aria-label={`Xem hồ sơ của ${isBuyer ? order.seller_name : order.buyer_name}`}
          >
            {isBuyer ? (
              order.seller_avatar_url ? (
                <img
                  src={order.seller_avatar_url}
                  alt={order.seller_name}
                  className="w-12 h-12 rounded-full object-cover border border-brand-border group-hover:border-brand-burgundy/40 transition-colors shrink-0 flex-none"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-soft-pink flex items-center justify-center text-brand-burgundy group-hover:bg-brand-burgundy/10 transition-colors shrink-0 flex-none">
                  <User className="w-6 h-6" />
                </div>
              )
            ) : order.buyer_avatar_url ? (
              <img
                src={order.buyer_avatar_url}
                alt={order.buyer_name}
                className="w-12 h-12 rounded-full object-cover border border-brand-border group-hover:border-brand-burgundy/40 transition-colors shrink-0 flex-none"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-brand-soft-pink flex items-center justify-center text-brand-burgundy group-hover:bg-brand-burgundy/10 transition-colors shrink-0 flex-none">
                <User className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-bold text-brand-text text-sm sm:text-base truncate group-hover:text-brand-burgundy transition-colors">
                {isBuyer ? order.seller_name : order.buyer_name}
              </p>
              <p className="text-xs text-brand-text-muted truncate">
                {isBuyer ? "Người bán sản phẩm" : "Người đặt mua"}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-brand-text-muted/60 group-hover:text-brand-burgundy group-hover:translate-x-0.5 transition-all shrink-0 flex-none" />
          </Link>

          <div className="pt-2 border-t border-brand-border/40">
            <button
              type="button"
              onClick={handleOpenChat}
              disabled={createConversationFromOrderMutation.isPending}
              className="w-full py-2 px-3 rounded-xl bg-brand-burgundy/10 hover:bg-brand-burgundy text-brand-burgundy hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Nhắn tin trao đổi về đơn này</span>
            </button>
          </div>
        </div>

        {/* Fulfillment Info */}
        <div className="bg-brand-warm-white rounded-3xl p-5 shadow-card border border-brand-border space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-brand-text-secondary">
              Giao nhận
            </h4>
            {canSellerEditTerms && (
              <button
                type="button"
                onClick={() => setIsEditTermsModalOpen(true)}
                className="text-[11px] font-bold text-brand-burgundy hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-brand-text-muted block text-[11px] mb-0.5">Người nhận</span>
              <p className="font-semibold text-brand-text text-xs sm:text-sm">{order.contact_name}</p>
            </div>

            <div>
              <span className="text-brand-text-muted block text-[11px] mb-0.5">Số điện thoại</span>
              <p className="font-medium tabular-nums text-brand-text text-xs sm:text-sm whitespace-nowrap">
                {order.contact_phone}
              </p>
            </div>

            <div>
              <span className="text-brand-text-muted block text-[11px] mb-0.5">Hình thức nhận hàng</span>
              <div className="flex items-center gap-1.5 font-semibold text-brand-text text-xs sm:text-sm">
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
                <p className="font-medium text-brand-text text-xs sm:text-sm leading-relaxed break-words">
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
                <p className="font-medium text-brand-text text-xs sm:text-sm leading-relaxed break-words">
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
        <div className="bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-card border border-brand-border space-y-4 min-w-0">
          <div className="border-b border-brand-border/60 pb-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {order.payment_method === "BANK_TRANSFER" ? (
                  <Landmark className="w-4 h-4 text-brand-burgundy shrink-0" />
                ) : (
                  <CreditCard className="w-4 h-4 text-brand-burgundy shrink-0" />
                )}
                <h3 className="text-sm font-bold text-brand-text leading-snug">
                  {order.payment_method === "BANK_TRANSFER"
                    ? "Thanh toán chuyển khoản"
                    : "Thanh toán tiền mặt"}
                </h3>
              </div>
              <PaymentStatusBadge
                paymentStatus={order.payment_status}
                paymentMethod={order.payment_method}
                fulfillmentMethod={order.fulfillment_method}
                totalAmount={order.total_amount}
                showMethod={false}
                className="shrink-0"
              />
            </div>
            {order.payment_method === "BANK_TRANSFER" && (
              <p className="text-[11px] text-brand-text-muted pl-6 leading-tight">
                Chuyển khoản qua mã VietQR hoặc số tài khoản ngân hàng
              </p>
            )}
          </div>

          {/* Bank Transfer Details & VietQR */}
          {order.payment_method === "BANK_TRANSFER" && (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                <span className="text-xs font-medium text-amber-900">Số tiền cần thanh toán:</span>
                <span className="text-lg font-bold text-brand-price whitespace-nowrap tabular-nums">
                  {formatVND(order.total_amount)}
                </span>
              </div>

              {order.payment_bank ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                  {/* Left: Bank details with 1-click copy */}
                  <div className="space-y-3 text-xs min-w-0">
                    <div>
                      <span className="text-brand-text-muted block text-[11px] mb-1">Ngân hàng thụ hưởng</span>
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-brand-burgundy/10 text-brand-burgundy font-semibold tabular-nums text-[11px] shrink-0 mt-0.5">
                          {order.payment_bank.bank_short_name || order.payment_bank.bank_bin}
                        </span>
                        <span className="font-semibold text-brand-text leading-snug break-words min-w-0 flex-1">
                          {order.payment_bank.bank_name}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-brand-text-muted block text-[11px] mb-1">Số tài khoản</span>
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-brand-border min-w-0">
                        <span className="font-semibold tabular-nums text-sm text-brand-text truncate min-w-0 select-all">
                          {order.payment_bank.account_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.payment_bank!.account_number, "stk")}
                          className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-xs font-semibold text-brand-text hover:bg-stone-200 shrink-0"
                        >
                          {copiedKey === "stk" ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 whitespace-nowrap">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="whitespace-nowrap">Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-brand-text-muted block text-[11px] mb-1">Chủ tài khoản</span>
                      <p className="font-semibold uppercase text-brand-text text-sm break-words min-w-0">
                        {order.payment_bank.account_name}
                      </p>
                    </div>

                    <div>
                      <span className="text-brand-text-muted block text-[11px] mb-1">Nội dung chuyển tiền</span>
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-brand-border min-w-0">
                        <span className="font-medium tabular-nums text-xs text-brand-text truncate min-w-0 select-all">
                          {order.order_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.order_code, "nd")}
                          className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-xs font-semibold text-brand-text hover:bg-stone-200 shrink-0"
                        >
                          {copiedKey === "nd" ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 whitespace-nowrap">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="whitespace-nowrap">Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: VietQR Code Box & Receipt Upload CTA */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-brand-border space-y-2.5 min-w-0">
                    <div
                      className="relative group cursor-pointer p-2 bg-white rounded-xl"
                      onClick={() => setViewQrModal(true)}
                    >
                      <img
                        src={order.payment_bank.qr_url || ""}
                        alt="VietQR"
                        className="w-36 h-36 max-w-full object-contain rounded-lg border border-stone-100"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" />
                        <span>Phóng to</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewQrModal(true)}
                      className="text-[11px] font-bold text-brand-burgundy hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Xem mã VietQR lớn</span>
                    </button>

                    {/* Buyer Upload Receipt Button directly below VietQR */}
                    {canBuyerUploadReceipt && (
                      <button
                        type="button"
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="btn-interactive w-full mt-1.5 px-3 py-2 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
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
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2 min-w-0">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold block">Ghi chú của người bán:</span>
                    <span className="break-words">{order.payment_note}</span>
                  </div>
                </div>
              )}

              {/* Payment Receipt status */}
              {order.payment_receipt_url && (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-brand-border space-y-2 min-w-0">
                  <span className="text-xs font-bold text-brand-text block">Biên nhận thanh toán:</span>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={order.payment_receipt_url}
                      alt="Biên nhận"
                      className="w-16 h-16 rounded-xl object-cover border border-brand-border cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                      onClick={() => setViewReceiptModal(true)}
                    />
                    <div className="text-xs text-brand-text-secondary space-y-1 min-w-0 flex-1">
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
            <div className="space-y-3 text-xs min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 p-3.5 rounded-2xl bg-stone-50 border border-brand-border">
                <span className="font-medium text-brand-text-muted text-xs">Số tiền thanh toán:</span>
                <span className="text-base sm:text-lg font-bold text-brand-price whitespace-nowrap tabular-nums">
                  {formatVND(order.total_amount)}
                </span>
              </div>
              <p className="text-brand-text-secondary leading-relaxed">
                {order.fulfillment_method === "SHIPPING"
                  ? "Phương thức: Tiền mặt khi nhận hàng (COD). Người mua kiểm tra hàng và thanh toán tiền mặt trực tiếp cho người giao."
                  : "Phương thức: Tiền mặt khi gặp mặt trực tiếp. Người mua thanh toán tiền mặt cho người bán khi nhận sản phẩm."}
              </p>
              {order.payment_note && (
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2 min-w-0">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold block">Ghi chú của người bán:</span>
                    <span className="break-words">{order.payment_note}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Review & Reputation Card for Completed Orders */}
      {isCompleted && (
        <div className="bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-card border border-brand-border space-y-4 min-w-0 max-w-full">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-bold text-brand-text">
                Đánh giá giao dịch
              </h3>
            </div>
            {isBuyer && reviewData && (
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-burgundy hover:text-brand-burgundy-dark p-1 rounded-lg hover:bg-brand-soft-pink transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Chỉnh sửa
              </button>
            )}
          </div>

          {isLoadingReview ? (
            <div className="py-4 flex items-center justify-center text-xs text-brand-text-muted">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-brand-burgundy" />
              Đang tải đánh giá...
            </div>
          ) : reviewData ? (
            <div className="space-y-2.5 min-w-0 max-w-full">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
                <StarRating rating={reviewData.rating} size="md" readOnly />
                <span className="text-xs font-bold text-brand-text">
                  {reviewData.rating === 5
                    ? "Rất hài lòng"
                    : reviewData.rating === 4
                      ? "Hài lòng"
                      : reviewData.rating === 3
                        ? "Bình thường"
                        : reviewData.rating === 2
                          ? "Không hài lòng"
                          : "Rất không hài lòng"}
                </span>
                <span className="text-[11px] text-brand-text-muted sm:ml-auto">
                  {new Date(reviewData.updated_at || reviewData.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {reviewData.comment ? (
                <p className="text-xs sm:text-sm text-brand-text-secondary bg-white p-3.5 rounded-2xl border border-brand-border leading-relaxed break-words [overflow-wrap:anywhere] min-w-0 max-w-full whitespace-pre-line">
                  "{reviewData.comment}"
                </p>
              ) : (
                <p className="text-xs italic text-brand-text-muted">
                  (Chưa để lại nhận xét chi tiết)
                </p>
              )}
              {isSeller && (
                <p className="text-[11px] text-emerald-700 font-medium">
                  ✓ Đánh giá từ người mua đã được cộng vào điểm uy tín trên trang cá nhân của bạn.
                </p>
              )}
            </div>
          ) : isBuyer ? (
            <div className="py-2 space-y-3 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-brand-text">
                  Bạn thấy trải nghiệm mua hàng như thế nào?
                </p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Đánh giá của bạn giúp xây dựng cộng đồng mua bán sinh viên tin cậy hơn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all shrink-0 w-full sm:w-auto"
              >
                <Star className="w-4 h-4 fill-white" />
                Đánh giá người bán
              </button>
            </div>
          ) : (
            <p className="text-xs text-brand-text-muted py-2 italic">
              Người mua chưa để lại đánh giá cho đơn hàng này.
            </p>
          )}
        </div>
      )}

      {/* 7. Order Timeline / History Card */}
      <div className="bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-card border border-brand-border space-y-3">
        <h4 className="text-xs font-semibold text-brand-text-secondary">
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

      <ReviewModal
        orderId={idNum}
        sellerName={order.seller_name}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        initialData={reviewData}
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
              <div className="font-semibold tabular-nums text-sm">{order.payment_bank.account_number}</div>
              <div className="font-semibold uppercase">{order.payment_bank.account_name}</div>
              <div className="font-bold text-brand-price text-base pt-1 whitespace-nowrap tabular-nums">
                {formatVND(order.total_amount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {order && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="ORDER"
          targetId={order.order_id}
          targetTitle={`Đơn hàng: ${order.order_code}`}
          onSuccess={() => {
            setSuccessToast("Đã gửi báo cáo. Ban quản trị sẽ xem xét.");
            setTimeout(() => setSuccessToast(null), 4000);
          }}
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
};
