import React from "react";
import type { FulfillmentMethod, PaymentMethod, PaymentStatus } from "../types";
import { getPaymentMethodLabel, getPaymentStatusLabel } from "@/lib/orderDisplay";

interface PaymentStatusBadgeProps {
  status?: PaymentStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  fulfillmentMethod?: FulfillmentMethod;
  totalAmount?: number | string | null;
  className?: string;
}

const statusConfig: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  UNPAID: {
    label: "Chưa thanh toán",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  VERIFYING: {
    label: "Đang kiểm tra",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  PAID: {
    label: "Đã thanh toán",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  paymentStatus,
  paymentMethod,
  fulfillmentMethod,
  totalAmount,
  className = "",
}) => {
  // If free order, never render payment badges
  if (totalAmount !== undefined && totalAmount !== null && Number(totalAmount) === 0) {
    return null;
  }
  if (paymentMethod === "OTHER") {
    return null;
  }

  const currentStatus = status || paymentStatus || "UNPAID";
  const config = statusConfig[currentStatus] || {
    label: getPaymentStatusLabel(currentStatus) || currentStatus,
    bg: "bg-brand-soft-pink/40",
    text: "text-brand-text-secondary",
    border: "border-brand-border",
  };

  const methodText = getPaymentMethodLabel(paymentMethod, fulfillmentMethod, totalAmount);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${config.bg} ${config.text} ${config.border}`}
      >
        {config.label}
      </span>
      {methodText && (
        <span className="text-[11px] font-medium text-brand-text-muted">
          • {methodText}
        </span>
      )}
    </div>
  );
};
