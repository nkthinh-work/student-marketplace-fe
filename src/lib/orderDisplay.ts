import type {
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/features/orders/types";

export interface OrderDisplayState {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  description?: string;
}

export function getFulfillmentMethodLabel(
  method?: FulfillmentMethod | string | null
): string {
  if (method === "MEETUP") return "Gặp trực tiếp";
  if (method === "SHIPPING") return "Giao hàng";
  return "";
}

export function getPaymentMethodLabel(
  method?: PaymentMethod | string | null,
  fulfillmentMethod?: FulfillmentMethod | string | null,
  totalAmount?: number | string | null
): string {
  if (totalAmount !== undefined && totalAmount !== null && Number(totalAmount) === 0) {
    return "";
  }
  if (method === "BANK_TRANSFER") return "Chuyển khoản VietQR";
  if (method === "CASH_ON_MEETUP") {
    return fulfillmentMethod === "SHIPPING"
      ? "Tiền mặt khi nhận"
      : "Tiền mặt khi gặp";
  }
  return "";
}

export function getPaymentStatusLabel(
  status?: PaymentStatus | string | null,
  totalAmount?: number | string | null
): string {
  if (totalAmount !== undefined && totalAmount !== null && Number(totalAmount) === 0) {
    return "";
  }
  if (status === "UNPAID") return "Chưa thanh toán";
  if (status === "VERIFYING") return "Đang kiểm tra";
  if (status === "PAID") return "Đã thanh toán";
  return "";
}

/**
 * Derives a clean, user-friendly, single contextual actionable display state for an order.
 * Strictly separates buyer vs seller mental models and hides internal payment semantics on free orders.
 */
export function getOrderDisplayState(
  order: {
    status: OrderStatus | string;
    payment_status?: PaymentStatus | string | null;
    payment_method?: PaymentMethod | string | null;
    fulfillment_method?: FulfillmentMethod | string | null;
    total_amount?: number | string | null;
  },
  actor: "buyer" | "seller" = "buyer"
): OrderDisplayState {
  const isFree =
    order.total_amount !== undefined &&
    order.total_amount !== null &&
    Number(order.total_amount) === 0;

  // 1. Cancelled
  if (order.status === "CANCELLED") {
    return {
      label: "Đã hủy",
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      dot: "bg-red-500",
      description: "Đơn hàng đã được hủy",
    };
  }

  // 2. Completed
  if (order.status === "COMPLETED") {
    return {
      label: "Đã hoàn tất",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      description: "Giao dịch đã kết thúc thành công",
    };
  }

  // 3. Delivering (Shipping only)
  if (order.status === "DELIVERING") {
    return {
      label: actor === "seller" ? "Đang giao hàng" : "Đang giao đến bạn",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
      dot: "bg-purple-500",
      description:
        actor === "seller"
          ? "Đơn hàng đang trong quá trình vận chuyển"
          : "Người bán đang giao hàng tới bạn",
    };
  }

  // 4. Pending
  if (order.status === "PENDING") {
    if (isFree) {
      return {
        label: actor === "seller" ? "Chờ bạn xác nhận tặng" : "Chờ người bán xác nhận",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        description:
          actor === "seller"
            ? "Vui lòng xác nhận đơn hàng tặng đồ này"
            : "Đang chờ người tặng xác nhận đơn",
      };
    }

    return {
      label: actor === "seller" ? "Chờ bạn xác nhận đơn" : "Chờ người bán xác nhận",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
      description:
        actor === "seller"
          ? "Vui lòng kiểm tra và xác nhận đơn hàng"
          : "Đang chờ người bán phản hồi xác nhận",
    };
  }

  // 5. Confirmed
  if (order.status === "CONFIRMED") {
    if (isFree) {
      return {
        label:
          actor === "seller"
            ? "Sẵn sàng giao nhận"
            : "Người bán đã xác nhận",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
        description:
          order.fulfillment_method === "SHIPPING"
            ? "Đã xác nhận • Sẵn sàng giao hàng"
            : "Đã xác nhận • Sẵn sàng gặp nhận",
      };
    }

    // Paid status breakdown
    if (order.payment_status === "PAID") {
      return {
        label:
          actor === "seller"
            ? "Đã thanh toán • Sẵn sàng giao"
            : "Đã thanh toán • Chờ nhận hàng",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        description:
          actor === "seller"
            ? "Đã nhận tiền thành công, hãy tiến hành giao dịch"
            : "Bạn đã hoàn tất thanh toán cho đơn hàng",
      };
    }

    if (order.payment_status === "VERIFYING") {
      return {
        label:
          actor === "seller"
            ? "Cần kiểm tra thanh toán"
            : "Đang chờ xác nhận thanh toán",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
        description:
          actor === "seller"
            ? "Người mua đã gửi biên nhận, vui lòng xác nhận"
            : "Biên nhận đã tải lên, người bán đang kiểm tra",
      };
    }

    // UNPAID
    if (order.payment_method === "BANK_TRANSFER") {
      return {
        label:
          actor === "seller"
            ? "Chờ người mua chuyển khoản"
            : "Cần thanh toán chuyển khoản",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        description:
          actor === "seller"
            ? "Đang chờ người mua quét VietQR chuyển tiền"
            : "Quét mã VietQR hoặc chuyển khoản để tiếp tục",
      };
    }

    // Cash on Meetup / Delivery
    return {
      label:
        actor === "seller"
          ? "Sẵn sàng giao nhận (Thu tiền mặt)"
          : "Đã xác nhận (Tiền mặt khi nhận)",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      dot: "bg-blue-500",
      description:
        order.fulfillment_method === "SHIPPING"
          ? "Thanh toán tiền mặt khi nhận hàng"
          : "Thanh toán tiền mặt khi gặp trực tiếp",
    };
  }

  // Fallback
  return {
    label: order.status,
    bg: "bg-brand-soft-pink/40",
    text: "text-brand-text-secondary",
    border: "border-brand-border",
    dot: "bg-gray-400",
  };
}
