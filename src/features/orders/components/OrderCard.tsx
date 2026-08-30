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
    <div className="bg-brand-warm-white rounded-3xl p-4 sm:p-5 border border-brand-border shadow-card hover:shadow-card-hover transition-all">
      {/* Header: Order Code & Primary Actionable Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-brand-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-bold text-brand-text truncate">
            {order.order_code}
          </span>
          <span className="text-brand-border">|</span>
          <span className="text-xs text-brand-text-secondary flex items-center gap-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-brand-burgundy" />
            {formattedDate}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <OrderStatusBadge order={order} role={role} />
        </div>
      </div>

      {/* Item summary */}
      <div className="py-3.5 flex gap-3.5 items-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-brand-soft-pink/30 flex-shrink-0 border border-brand-border/60">
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
          <h4 className="font-bold text-brand-text text-sm sm:text-base truncate mb-1">
            {order.item.product_title}
          </h4>
          <p className="text-xs text-brand-text-secondary mb-1.5 truncate">
            Số lượng: <span className="font-semibold text-brand-text">x{order.item.quantity}</span> • Đơn giá: {itemPrice}
          </p>
          {!isFree && (
            <div className="flex items-center gap-2">
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
      <div className="pt-3 border-t border-brand-border/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
          {order.fulfillment_method === "MEETUP" ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-brand-price" />
              <span>{getFulfillmentMethodLabel("MEETUP")}</span>
            </>
          ) : (
            <>
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>{getFulfillmentMethodLabel("SHIPPING")}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <span className="text-xs text-brand-text-secondary mr-1.5">
              Tổng tiền:
            </span>
            <span className={`text-base sm:text-lg font-black ${isFree ? 'text-emerald-700' : 'text-brand-price'}`}>
              {formattedTotal}
            </span>
          </div>

          <Link
            to={`/orders/${order.order_id}`}
            className="btn-interactive inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-soft-pink text-brand-burgundy hover:bg-brand-burgundy hover:text-white transition-colors no-underline"
          >
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
