import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Package, Truck } from "lucide-react";
import type { OrderSummaryResponse } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { getFulfillmentMethodLabel } from "@/lib/orderDisplay";

interface OrderCardProps {
  order: OrderSummaryResponse;
  role?: "buyer" | "seller";
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, role = "buyer" }) => {
  const isFree = Number(order.total_amount) === 0;

  const formattedDate = new Date(order.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedTotal = isFree
    ? "Miễn phí"
    : `${Number(order.total_amount).toLocaleString("vi-VN")} đ`;

  const itemPrice = isFree
    ? "0 đ"
    : `${Number(order.item.price_at_purchase).toLocaleString("vi-VN")} đ`;

  return (
    <div className="bg-brand-warm-white text-brand-text rounded-3xl p-4 sm:p-5 border border-brand-border shadow-card hover:shadow-card-hover transition-all">
      {/* Header: Order Code, Date & Primary Actionable Status */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 pb-3 border-b border-brand-border/60">
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-xs font-medium tabular-nums text-brand-text-secondary whitespace-nowrap">
            {order.order_code}
          </span>
          <span className="text-brand-border hidden sm:inline">|</span>
          <span className="text-xs text-brand-text-muted flex items-center gap-1 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-brand-burgundy shrink-0" />
            <span>{formattedDate}</span>
          </span>
        </div>
        <div className="flex-none max-w-full">
          <OrderStatusBadge order={order} role={role} />
        </div>
      </div>

      {/* Item summary */}
      <div className="py-3.5 flex gap-3 sm:gap-3.5 items-center min-w-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-brand-soft-pink/30 flex-none border border-brand-border/60">
          {order.item.product_image_url ? (
            <img
              src={order.item.product_image_url}
              alt={order.item.product_title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
              <Package className="w-7 h-7 stroke-1" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-brand-text text-sm sm:text-base line-clamp-2 break-words mb-1">
            {order.item.product_title}
          </h4>
          <p className="text-xs text-brand-text-secondary mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            <span>Số lượng: <span className="font-semibold text-brand-text">x{order.item.quantity}</span></span>
            <span className="text-brand-border/60">•</span>
            <span>Đơn giá: <span className="whitespace-nowrap tabular-nums font-medium text-brand-text">{itemPrice}</span></span>
          </p>
          {!isFree && (
            <div className="flex items-center min-w-0">
              <PaymentStatusBadge
                paymentStatus={order.payment_status}
                paymentMethod={order.payment_method}
                fulfillmentMethod={order.fulfillment_method}
                totalAmount={order.total_amount}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer: Fulfillment method, total, and link */}
      <div className="pt-3 border-t border-brand-border/60 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary min-w-0 flex-1">
          {order.fulfillment_method === "MEETUP" ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-brand-price shrink-0" />
              <span className="truncate">{getFulfillmentMethodLabel("MEETUP")}</span>
            </>
          ) : (
            <>
              <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{getFulfillmentMethodLabel("SHIPPING")}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4 ml-auto flex-wrap sm:flex-nowrap justify-end">
          <div className="text-right whitespace-nowrap">
            <span className="text-xs text-brand-text-secondary mr-1.5">
              Tổng tiền:
            </span>
            <span className={`text-base sm:text-lg font-bold tabular-nums whitespace-nowrap ${isFree ? 'text-emerald-700' : 'text-brand-price'}`}>
              {formattedTotal}
            </span>
          </div>

          <Link
            to={`/orders/${order.order_id}`}
            className="btn-interactive inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-soft-pink text-brand-burgundy hover:bg-brand-burgundy hover:text-white transition-colors no-underline shrink-0"
          >
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
