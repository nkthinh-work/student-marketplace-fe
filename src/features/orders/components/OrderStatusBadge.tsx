import React from "react";
import type { FulfillmentMethod, OrderStatus, PaymentMethod, PaymentStatus } from "../types";
import { getOrderDisplayState } from "@/lib/orderDisplay";

interface OrderStatusBadgeProps {
  status?: OrderStatus;
  order?: {
    status: OrderStatus | string;
    payment_status?: PaymentStatus | string | null;
    payment_method?: PaymentMethod | string | null;
    fulfillment_method?: FulfillmentMethod | string | null;
    total_amount?: number | string | null;
  };
  role?: "buyer" | "seller";
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  order,
  role = "buyer",
  className = "",
}) => {
  if (order) {
    const display = getOrderDisplayState(order, role);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border whitespace-nowrap flex-none shrink-0 ${display.bg} ${display.text} ${display.border} ${className}`}
        title={display.description}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-none ${display.dot}`} />
        <span>{display.label}</span>
      </span>
    );
  }

  // Fallback if only status is passed
  const display = getOrderDisplayState({ status: status || "PENDING" }, role);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border whitespace-nowrap flex-none shrink-0 ${display.bg} ${display.text} ${display.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-none ${display.dot}`} />
      <span>{display.label}</span>
    </span>
  );
};
