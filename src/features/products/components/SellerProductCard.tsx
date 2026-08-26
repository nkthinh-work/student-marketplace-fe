import { Link } from 'react-router-dom';
import type { SellerProductResponse } from '../types';
import { useUpdateProduct, useDeleteProduct } from '../hooks';
import {
  formatVND,
  getProductStatusMeta,
  getListingTypeMeta,
  formatDate,
} from '@/lib/formatters';
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Package,
} from 'lucide-react';

interface SellerProductCardProps {
  product: SellerProductResponse;
}

export function SellerProductCard({ product }: SellerProductCardProps) {
  const updateMutation = useUpdateProduct(product.product_id);
  const deleteMutation = useDeleteProduct();

  const statusMeta = getProductStatusMeta(product.status);
  const listingMeta = getListingTypeMeta(product.listing_type);

  const handleToggleStatus = () => {
    // Không thay đổi trạng thái khi đã bán hết
    if (product.status === 'SOLD_OUT') return;
    const newStatus = product.status === 'AVAILABLE' ? 'HIDDEN' : 'AVAILABLE';
    updateMutation.mutate({ status: newStatus });
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa tin "${product.title}"? Thao tác này không thể hoàn tác.`,
      )
    ) {
      deleteMutation.mutate(product.product_id);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3.5 p-4 rounded-2xl bg-brand-warm-white border border-brand-border shadow-card card-interactive">
      <div className="relative aspect-[4/3] sm:aspect-square sm:h-28 sm:w-28 rounded-xl overflow-hidden bg-brand-soft-pink shrink-0">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-text-muted">
            <ImageIcon className="h-8 w-8 stroke-1" />
          </div>
        )}

        <span
          className={`absolute top-2 left-2 rounded-md px-2 py-0.5 text-[10px] font-bold border ${statusMeta.bgClass} ${statusMeta.textClass} backdrop-blur-xs shadow-xs`}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between text-xs text-brand-text-muted mb-1">
            <span className="truncate">{product.category.name}</span>
            <span className="shrink-0">{formatDate(product.created_at)}</span>
          </div>

          <Link
            to={`/products/${product.product_id}`}
            className="text-sm font-bold text-brand-text hover:text-brand-burgundy transition-colors line-clamp-1 no-underline"
          >
            {product.title}
          </Link>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-brand-price">
              {formatVND(product.price)}
            </span>
            {listingMeta.isAuction && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${listingMeta.badgeClass}`}
              >
                Đấu giá
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-brand-text-secondary bg-white p-2 rounded-xl border border-brand-border/60">
            <div className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5 text-brand-text-muted" />
              <span>
                Tổng kho: <strong>{product.stock}</strong>
              </span>
            </div>
            {product.reserved_stock > 0 && (
              <div className="text-amber-700">
                Đang giữ: <strong>{product.reserved_stock}</strong>
              </div>
            )}
            <div className="text-emerald-700">
              Khả dụng: <strong>{product.available_stock}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-brand-border/60">
          {product.status !== 'SOLD_OUT' && (
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={updateMutation.isPending}
              className={`btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                product.status === 'AVAILABLE'
                  ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {product.status === 'AVAILABLE' ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Ẩn tin
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Hiện tin
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Link
              to={`/products/${product.product_id}/edit`}
              className="btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-burgundy text-white shadow-xs hover:bg-brand-burgundy-dark no-underline"
            >
              <Edit className="h-3.5 w-3.5" /> Sửa
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn-interactive flex items-center justify-center p-2 rounded-xl text-brand-price bg-red-50 hover:bg-red-100 border border-red-200"
              title="Xóa tin đăng"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
