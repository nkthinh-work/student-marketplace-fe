import { Link } from 'react-router-dom';
import type { SellerProductResponse } from '../types';
import { useUpdateProduct, useDeleteProduct, useSubmitProductReview } from '../hooks';
import {
  formatVND,
  getListingTypeMeta,
  formatDate,
} from '@/lib/formatters';
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowRight,
  Send,
  Clock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface SellerProductCardProps {
  product: SellerProductResponse;
}

export function SellerProductCard({ product }: SellerProductCardProps) {
  const updateMutation = useUpdateProduct(product.product_id);
  const deleteMutation = useDeleteProduct();
  const submitReviewMutation = useSubmitProductReview();

  const listingMeta = getListingTypeMeta(product.listing_type);

  const isWaitingWinnerCheckout =
    product.listing_type === 'AUCTION' &&
    product.status === 'AVAILABLE' &&
    (product.reserved_stock > 0 || (product.auction?.status === 'ENDED' && !!product.auction?.winner_checkout_deadline));

  const isActiveAuction =
    product.listing_type === 'AUCTION' &&
    product.status === 'AVAILABLE' &&
    product.auction?.status === 'ACTIVE';

  // Section 26: Strict priority UI semantics for Seller Card
  const getApprovalStatusMeta = () => {
    if (product.moderation_status === 'BLOCKED') {
      return {
        label: 'Đã bị quản trị viên ẩn',
        bgClass: 'bg-red-50 border-red-200',
        textClass: 'text-red-700 font-bold',
        helper: null,
      };
    }
    if (product.approval_status === 'DRAFT') {
      return {
        label: 'Bản nháp',
        bgClass: 'bg-stone-100 border-stone-300',
        textClass: 'text-stone-700 font-bold',
        helper: 'Tin chưa được gửi kiểm duyệt.',
      };
    }
    if (product.approval_status === 'PENDING') {
      return {
        label: 'Chờ duyệt',
        bgClass: 'bg-amber-50 border-amber-300',
        textClass: 'text-amber-800 font-bold',
        helper: 'Tin đang chờ quản trị viên kiểm duyệt.',
      };
    }
    if (product.approval_status === 'REJECTED') {
      return {
        label: 'Cần chỉnh sửa',
        bgClass: 'bg-rose-50 border-rose-300',
        textClass: 'text-rose-700 font-bold',
        helper: product.review_note || 'Tin đăng cần chỉnh sửa trước khi có thể hiển thị.',
      };
    }
    if (product.status === 'HIDDEN') {
      return {
        label: 'Đã ẩn',
        bgClass: 'bg-stone-100 border-stone-200',
        textClass: 'text-stone-600 font-bold',
        helper: null,
      };
    }
    if (product.status === 'SOLD_OUT') {
      return {
        label: 'Đã bán',
        bgClass: 'bg-red-50 border-red-200',
        textClass: 'text-red-700 font-bold',
        helper: null,
      };
    }
    if (isWaitingWinnerCheckout) {
      return {
        label: 'Chờ người thắng',
        bgClass: 'bg-amber-50 border-amber-300',
        textClass: 'text-amber-800 font-bold',
        helper: null,
      };
    }
    if (isActiveAuction) {
      return {
        label: 'Đang đấu giá',
        bgClass: 'bg-emerald-50 border-emerald-300',
        textClass: 'text-emerald-800 font-bold',
        helper: null,
      };
    }
    return {
      label: 'Đang bán',
      bgClass: 'bg-emerald-50 border-emerald-300',
      textClass: 'text-emerald-800 font-bold',
      helper: null,
    };
  };

  const statusMeta = getApprovalStatusMeta();
  const isApproved = product.approval_status === 'APPROVED' && product.moderation_status !== 'BLOCKED';

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

  const handleSubmitReview = () => {
    submitReviewMutation.mutate(product.product_id, {
      onError: (err: any) => {
        const detail = err?.response?.data?.detail;
        const msg = typeof detail === 'string' ? detail : detail?.message || 'Không thể gửi duyệt tin đăng.';
        alert(msg);
      },
    });
  };

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-brand-warm-white border border-brand-border shadow-xs card-interactive flex flex-col gap-2.5 min-w-0">
      <div className="flex gap-3 sm:gap-3.5 min-w-0">
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
            {/* Top line: Category & Status Badge */}
            <div className="flex items-center justify-between gap-1 text-[11px] text-brand-text-muted">
              <span className="truncate max-w-[50%]">{product.category.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${statusMeta.bgClass} ${statusMeta.textClass}`}
                >
                  {statusMeta.label}
                </span>
              </div>
            </div>

            {/* Product Title */}
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

            {/* Stock metadata & Views */}
            <div className="flex items-center gap-1.5 text-[11px] text-brand-text-secondary flex-wrap pt-0.5">
              <span>Tồn <strong>{product.stock}</strong></span>
              {product.reserved_stock > 0 && (
                <span className="text-amber-700">· Đang giữ <strong>{product.reserved_stock}</strong></span>
              )}
              <span className="text-emerald-700">· Khả dụng <strong>{product.available_stock}</strong></span>
              <span className="text-brand-text-muted inline-flex items-center gap-0.5 ml-auto text-[11px]" title={`${product.view_count ?? 0} lượt xem`}>
                <Eye className="h-3 w-3 stroke-[1.5]" />
                <span>{product.view_count ?? 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection / Helper Notes Banner */}
      {product.approval_status === 'REJECTED' && product.review_note && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-bold block">Quản trị viên yêu cầu chỉnh sửa:</span>
            <p className="mt-0.5 text-xs text-rose-700 break-words [overflow-wrap:anywhere] leading-relaxed">
              {product.review_note}
            </p>
          </div>
        </div>
      )}

      {product.approval_status === 'PENDING' && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-800">
          <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>Tin đăng đang trong hàng đợi kiểm duyệt của quản trị viên.</span>
        </div>
      )}

      {product.approval_status === 'DRAFT' && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100/70 border border-stone-200/80 text-[11px] text-stone-600">
          <HelpCircle className="h-3.5 w-3.5 text-stone-500 shrink-0" />
          <span>Tin đăng chưa được gửi kiểm duyệt và chưa hiển thị công khai.</span>
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-brand-border/50 justify-between flex-wrap">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <Link
            to={`/products/${product.product_id}`}
            className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 text-brand-text hover:bg-stone-200 transition-colors no-underline shrink-0"
          >
            <span>Chi tiết</span>
            <ArrowRight className="h-3 w-3 text-brand-text-muted" />
          </Link>

          <Link
            to={`/products/${product.product_id}/edit`}
            className="btn-interactive inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-soft-pink text-brand-burgundy hover:bg-brand-burgundy hover:text-white transition-colors no-underline"
          >
            <Edit className="h-3 w-3" />
            <span>Sửa</span>
          </Link>

          {/* Section 27: Specific Approval workflow actions */}
          {product.approval_status === 'DRAFT' && (
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending}
              className="btn-interactive inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-brand-burgundy text-white hover:bg-brand-burgundy-dark transition-colors shadow-xs cursor-pointer"
            >
              <Send className="h-3 w-3" />
              <span>{submitReviewMutation.isPending ? 'Đang gửi...' : 'Gửi duyệt'}</span>
            </button>
          )}

          {product.approval_status === 'REJECTED' && (
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending}
              className="btn-interactive inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-brand-burgundy text-white hover:bg-brand-burgundy-dark transition-colors shadow-xs cursor-pointer"
            >
              <Send className="h-3 w-3" />
              <span>{submitReviewMutation.isPending ? 'Đang gửi...' : 'Gửi duyệt lại'}</span>
            </button>
          )}

          {isApproved && product.status !== 'SOLD_OUT' && (
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
  );
}
