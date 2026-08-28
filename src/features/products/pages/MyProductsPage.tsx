import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyProducts } from '../hooks';
import type { ProductStatus } from '../types';
import { SellerProductCard } from '../components/SellerProductCard';
import {
  Package,
  Plus,
  AlertCircle,
  Tag,
  Eye,
  EyeOff,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function MyProductsPage() {
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | undefined>(
    undefined,
  );

  const { data, isLoading, isError, error, refetch } = useMyProducts({
    status: selectedStatus,
  });

  const products = data?.items || [];

  const filterTabs: Array<{ id: ProductStatus | undefined; label: string; icon: React.ReactNode }> = [
    { id: undefined, label: 'Tất cả', icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'AVAILABLE', label: 'Đang bán', icon: <Eye className="h-3.5 w-3.5 text-emerald-600" /> },
    { id: 'HIDDEN', label: 'Đã ẩn', icon: <EyeOff className="h-3.5 w-3.5 text-gray-500" /> },
    { id: 'SOLD_OUT', label: 'Đã bán', icon: <CheckCircle className="h-3.5 w-3.5 text-red-600" /> },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
      {/* Tiêu đề & mô tả trong normal document flow */}
      <div className="space-y-1 mb-4">
        <h1 className="text-xl sm:text-2xl font-black text-brand-text flex items-center gap-2">
          <Package className="h-6 w-6 text-brand-burgundy" />
          Quản lý tin đăng
        </h1>
        <p className="text-xs sm:text-sm text-brand-text-secondary">
          Theo dõi tồn kho, chỉnh sửa và quản lý trạng thái các mặt hàng bạn đang bán.
        </p>
      </div>

      {/* Sticky Seller Management Controls — top-[56px] with invariant geometry (0px gap dưới Header, 0 margin-top) */}
      <div className="sticky top-[56px] z-40 bg-brand-cream isolate -mx-4 px-4 pt-0 pb-2 border-b border-brand-border/60">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          {/* Bộ lọc trạng thái có thể cuộn ngang trên mobile */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto py-1 hide-scrollbar min-w-0">
            {filterTabs.map((tab) => {
              const isSelected = selectedStatus === tab.id;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors shrink-0 select-none ${
                    isSelected
                      ? 'bg-brand-burgundy text-white border-brand-burgundy'
                      : 'bg-brand-warm-white text-brand-text-secondary border-brand-border hover:bg-brand-soft-pink'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Nút Đăng tin — Hoàn toàn không transform, không shadow, không translateY */}
          <Link
            to="/products/new"
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold border border-brand-burgundy bg-brand-burgundy text-white hover:bg-brand-burgundy-dark no-underline shrink-0 transition-colors shadow-none antialiased select-none leading-none"
          >
            <Plus className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
            <span className="hidden sm:inline">Đăng tin mới</span>
            <span className="sm:hidden">Đăng tin</span>
          </Link>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="flex min-h-[40dvh] items-center justify-center">
            <LoadingSpinner message="Đang tải danh sách tin của bạn..." />
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/50 p-8 text-center">
            <AlertCircle className="h-8 w-8 text-brand-price mb-2" />
            <p className="text-sm font-semibold text-brand-text">
              Không thể tải danh sách tin đăng
            </p>
            <p className="text-xs text-brand-text-secondary mt-1 mb-4">
              {(error as { response?: { data?: { detail?: string } } })?.response?.data
                ?.detail || 'Đã có lỗi xảy ra. Vui lòng thử lại.'}
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

        {!isLoading && !isError && products.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-border p-10 text-center bg-brand-warm-white/50 space-y-3">
            <Tag className="h-10 w-10 text-brand-text-muted stroke-1" />
            <div>
              <p className="text-sm font-bold text-brand-text">
                {selectedStatus
                  ? `Không có tin đăng nào ở trạng thái "${selectedStatus}"`
                  : 'Bạn chưa đăng bán sản phẩm nào'}
              </p>
              <p className="text-xs text-brand-text-secondary mt-1">
                Hãy bắt đầu đăng bán những món đồ bạn không còn dùng tới nhé!
              </p>
            </div>

            <Link
              to="/products/new"
              className="btn-interactive inline-flex items-center gap-1.5 rounded-2xl bg-brand-burgundy px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-burgundy-dark no-underline"
            >
              <Plus className="h-4 w-4" /> Đăng tin đầu tiên
            </Link>
          </div>
        )}

        {!isLoading && !isError && products.length > 0 && (
          <div className="space-y-3">
            {products.map((product) => (
              <SellerProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
