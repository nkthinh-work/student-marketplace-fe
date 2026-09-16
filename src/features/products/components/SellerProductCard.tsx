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
  Gavel,
  ExternalLink,
} from 'lucide-react';

interface SellerProductCardProps {
  product: SellerProductResponse;
}

export function SellerProductCard({ product }: SellerProductCardProps) {
  const updateMutation = useUpdateProduct(product.product_id);
  const deleteMutation = useDeleteProduct();

  const statusMeta = getProductStatusMeta(product.status);
  const listingMeta = getListingTypeMeta(product.listing_type);

  const isWaitingWinnerCheckout =
    product.listing_type === 'AUCTION' &&
    product.status === 'AVAILABLE' &&
    product.reserved_stock > 0;

  const displayStatusMeta = isWaitingWinnerCheckout
    ? {
        label: 'Chờ người thắng',
        bgClass: 'bg-amber-50 border-amber-300',
        textClass: 'text-amber-800 font-bold',
      }
    : statusMeta;

  const handleToggleStatus = () => {
    // Không thay đổi trạng thái khi đã bán hết hoặc đang giữ hàng đấu giá
    if (product.status === 'SOLD_OUT' || isWaitingWinnerCheckout) return;
    const newStatus = product.status === 'AVAILABLE' ? 'HIDDEN' : 'AVAILABLE';
    updateMutation.mutate({ status: newStatus });
  };

  const handleDelete = () => {
    if (isWaitingWinnerCheckout) {
      alert("Không thể xóa tin khi người thắng đấu giá vẫn còn thời hạn đặt mua.");
      return;
    }
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa tin "${product.title}"? Thao tác này không thể hoàn tác.`,
      )
    ) {
      deleteMutation.mutate(product.product_id);
    }
  };

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-brand-warm-white border border-brand-border shadow-xs card-interactive flex gap-3 sm:gap-3.5 min-w-0">
      {/* Compact Thumbnail */}
      <Link
        to={`/products/${product.product_id}`}
        className="relative w-[84px] h-[84px] sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-brand-soft-pink shrink-0 block no-underline"
        aria-label={`Xem chi tiết ${product.title}`}
      >
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-text-muted">
            <ImageIcon className="h-6 w-6 stroke-1" />
          </div>
        )}
      </Link>

      {/* Content and Actions */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="space-y-1">
          {/* Top line: Category & Status */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-brand-text-muted">
            <span className="truncate max-w-[55%]">{product.category.name}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${displayStatusMeta.bgClass} ${displayStatusMeta.textClass}`}
            >
              {displayStatusMeta.label}
            </span>
          </div>

          {/* Product Title (2-line clamp) */}
          <Link
            to={`/products/${product.product_id}`}
            className="text-xs sm:text-sm font-semibold text-brand-text hover:text-brand-burgundy transition-colors line-clamp-2 no-underline break-words [overflow-wrap:anywhere] leading-snug block"
          >
            {product.title}
          </Link>

          {/* Price & Auction tag */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-extrabold text-brand-price">
              {formatVND(product.price)}
            </span>
            {listingMeta.isAuction && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${listingMeta.badgeClass}`}
              >
                Đấu giá
              </span>
            )}
            <span className="text-[10px] text-brand-text-muted ml-auto hidden xs:inline">
              {formatDate(product.created_at)}
            </span>
          </div>

          {/* Stock metadata */}
          <div className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary flex-wrap pt-0.5">
            <span>Tồn <strong>{product.stock}</strong></span>
            {product.reserved_stock > 0 && (
              <span className="text-amber-700">· Đang giữ <strong>{product.reserved_stock}</strong></span>
            )}
            <span className="text-emerald-700">· Khả dụng <strong>{product.available_stock}</strong></span>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-brand-border/50 justify-between">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {listingMeta.isAuction ? (
              <Link
                to={`/products/${product.product_id}`}
                className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 no-underline"
              >
                <Gavel className="h-3 w-3" />
                <span>Đấu giá</span>
              </Link>
            ) : (
              <Link
                to={`/products/${product.product_id}`}
                className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-brand-text hover:bg-stone-200 no-underline"
              >
                <ExternalLink className="h-3 w-3 text-brand-text-muted" />
                <span>Chi tiết</span>
              </Link>
            )}

            <Link
              to={`/products/${product.product_id}/edit`}
              className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-soft-pink text-brand-burgundy hover:bg-brand-burgundy hover:text-white transition-colors no-underline"
            >
              <Edit className="h-3 w-3" />
              <span>Sửa</span>
            </Link>

            {product.status !== 'SOLD_OUT' && (
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={updateMutation.isPending}
                className={`btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  product.status === 'AVAILABLE'
                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {product.status === 'AVAILABLE' ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span>Ẩn</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    <span>Hiện</span>
                  </>
                )}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || isWaitingWinnerCheckout}
            className={`btn-interactive inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors shrink-0 ${
              isWaitingWinnerCheckout
                ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200'
            }`}
            title={
              isWaitingWinnerCheckout
                ? 'Không thể xóa khi đang chờ người thắng đặt mua.'
                : 'Xóa tin đăng'
            }
            aria-label={`Xóa tin ${product.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
