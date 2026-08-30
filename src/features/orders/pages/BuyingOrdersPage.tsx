import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShoppingBag,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { useBuyingOrders } from "../hooks";
import { OrderCard } from "../components/OrderCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const STATUS_TABS = [
  { id: "ALL", label: "Tất cả", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  { id: "PENDING", label: "Chờ xác nhận", icon: <Clock className="h-3.5 w-3.5 text-amber-600" /> },
  { id: "CONFIRMED", label: "Đã xác nhận", icon: <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> },
  { id: "DELIVERING", label: "Đang giao", icon: <Truck className="h-3.5 w-3.5 text-purple-600" /> },
  { id: "COMPLETED", label: "Hoàn tất", icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> },
  { id: "CANCELLED", label: "Đã hủy", icon: <XCircle className="h-3.5 w-3.5 text-red-600" /> },
];

export const BuyingOrdersPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("ALL");
  const { data, isLoading, isError, error, refetch } = useBuyingOrders(selectedTab);

  const orders = data?.items || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
      {/* Header section */}
      <div className="space-y-1 mb-4">
        <h1 className="text-xl sm:text-2xl font-black text-brand-text flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-brand-burgundy" />
          Đơn mua
        </h1>
        <p className="text-xs sm:text-sm text-brand-text-secondary">
          Đơn hàng bạn đã đặt
        </p>
      </div>

      {/* Sticky Filter Controls */}
      <div className="sticky top-[56px] z-40 bg-brand-cream isolate -mx-4 px-4 pt-0 pb-2 border-b border-brand-border/60">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          {/* Scrollable Filter Chips */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto py-1 hide-scrollbar min-w-0">
            {STATUS_TABS.map((tab) => {
              const isSelected = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold border transition-colors shrink-0 select-none ${
                    isSelected
                      ? "bg-brand-burgundy text-white border-brand-burgundy shadow-xs"
                      : "bg-brand-warm-white text-brand-text-secondary border-brand-border hover:bg-brand-soft-pink"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Switch to Selling Orders Button */}
          <Link
            to="/orders/selling"
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold border border-brand-border bg-brand-warm-white text-brand-text hover:bg-brand-soft-pink no-underline shrink-0 transition-colors shadow-none select-none"
          >
            <Store className="h-3.5 w-3.5 text-brand-burgundy" />
            <span className="hidden sm:inline">Xem đơn bán</span>
            <span className="sm:hidden">Đơn bán</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4">
        {isLoading && (
          <div className="flex min-h-[40dvh] items-center justify-center">
            <LoadingSpinner message="Đang tải danh sách đơn mua..." />
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/50 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-brand-price mb-2" />
            <p className="text-sm font-semibold text-brand-text">
              Không thể tải danh sách đơn mua
            </p>
            <p className="text-xs text-brand-text-secondary mt-1 mb-4">
              {(error as { response?: { data?: { detail?: string } } })?.response
                ?.data?.detail || "Đã có lỗi xảy ra. Vui lòng thử lại."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-interactive flex items-center gap-1.5 rounded-xl bg-brand-burgundy px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-burgundy-dark"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-border p-10 text-center bg-brand-warm-white/70 shadow-card space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft-pink text-brand-burgundy">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-text">
                {selectedTab === "ALL"
                  ? "Chưa có đơn mua nào"
                  : `Không có đơn mua nào ở trạng thái "${STATUS_TABS.find((t) => t.id === selectedTab)?.label}"`}
              </p>
              <p className="text-xs text-brand-text-secondary mt-1 max-w-sm">
                Bạn chưa đặt mua sản phẩm nào trong trạng thái này. Hãy khám phá chợ sinh viên ngay!
              </p>
            </div>

            <Link
              to="/"
              className="btn-interactive inline-flex items-center gap-1.5 rounded-2xl bg-brand-burgundy px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-burgundy-dark no-underline"
            >
              <ShoppingBag className="h-4 w-4" /> Khám phá sản phẩm
            </Link>
          </div>
        )}

        {!isLoading && !isError && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.order_id} order={order} role="buyer" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
