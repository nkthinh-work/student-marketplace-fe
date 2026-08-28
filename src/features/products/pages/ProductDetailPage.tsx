import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks';
import { useCurrentUser } from '@/features/users/hooks';
import { ProductImageGallery } from '../components/ProductImageGallery';
import {
  formatVND,
  getListingTypeMeta,
  formatDate,
  formatRelativeTime,
} from '@/lib/formatters';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Eye,
  Package,
  Sparkles,
  ShieldCheck,
  Edit,
  AlertCircle,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const numericId = productId ? parseInt(productId, 10) : undefined;

  const { data: product, isLoading, isError, error } = useProduct(numericId);
  const { data: currentUser } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <LoadingSpinner message="Đang tải chi tiết sản phẩm..." />
      </div>
    );
  }

  if (isError || !product) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft-pink text-brand-burgundy">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-brand-text">
          {status === 404 ? 'Sản phẩm không tồn tại hoặc đã bị ẩn' : 'Không thể tải thông tin sản phẩm'}
        </h2>
        <p className="text-xs sm:text-sm text-brand-text-secondary">
          Sản phẩm có thể đã được người bán gỡ xuống hoặc xóa khỏi hệ thống.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn-interactive inline-flex items-center gap-2 rounded-2xl bg-brand-burgundy px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-burgundy-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
        </button>
      </div>
    );
  }

  const listingMeta = getListingTypeMeta(product.listing_type);
  const isOwner = currentUser?.user_id === product.seller.user_id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6 space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-interactive flex items-center gap-1.5 rounded-xl border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-text-secondary hover:bg-brand-soft-pink"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>

        {isOwner && (
          <Link
            to={`/products/${product.product_id}/edit`}
            className="btn-interactive flex items-center gap-1.5 rounded-xl bg-brand-burgundy px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-burgundy-dark no-underline"
          >
            <Edit className="h-3.5 w-3.5" /> Quản lý tin
          </Link>
        )}
      </div>

      <div className="space-y-5">
        <ProductImageGallery images={product.images} title={product.title} />

        <div className="p-4 sm:p-5 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="rounded-full bg-brand-soft-pink px-3 py-1 text-xs font-semibold text-brand-burgundy border border-brand-burgundy/20">
              {product.category.name}
            </span>

            {listingMeta.isAuction && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${listingMeta.badgeClass}`}
                >
                  Đấu giá
                </span>
              </div>
            )}
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold text-brand-text leading-snug min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
            {product.title}
          </h1>

          <div className="flex items-baseline justify-between p-3.5 rounded-2xl bg-brand-soft-pink/30 border border-brand-border/60">
            <div>
              {listingMeta.isAuction && (
                <span className="block text-xs font-medium text-purple-700 mb-0.5">
                  {listingMeta.priceLabel}
                </span>
              )}
              <span className="text-xl sm:text-2xl font-black text-brand-price">
                {formatVND(product.price)}
              </span>
            </div>

            <div className="text-right text-xs text-brand-text-secondary">
              <div className="flex items-center gap-1 justify-end font-semibold text-emerald-700">
                <Package className="h-3.5 w-3.5" /> Có sẵn: {product.available_stock}
              </div>
              <div className="flex items-center gap-1 justify-end text-brand-text-muted mt-0.5">
                <Eye className="h-3.5 w-3.5" /> {product.view_count} lượt xem
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-brand-text-muted pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Đăng {formatRelativeTime(product.created_at)}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card space-y-2">
          <h3 className="text-sm font-bold text-brand-text flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-brand-burgundy" />
            Mô tả sản phẩm
          </h3>
          <div className="text-xs sm:text-sm text-brand-text-secondary whitespace-pre-line leading-relaxed pt-1">
            {product.description || 'Người bán chưa cung cấp mô tả chi tiết cho sản phẩm này.'}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card space-y-3">
          <h3 className="text-sm font-bold text-brand-text flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-brand-burgundy" />
            Thông tin người bán
          </h3>

          <div className="flex items-center gap-3.5 pt-1">
            {product.seller.avatar_url ? (
              <img
                src={product.seller.avatar_url}
                alt={product.seller.full_name}
                className="h-12 w-12 rounded-full object-cover border-2 border-brand-burgundy/20"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-burgundy/10 text-brand-burgundy">
                <User className="h-6 w-6" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-brand-text truncate">
                {product.seller.full_name}
              </h4>
              <p className="text-xs text-brand-text-muted">
                Thành viên từ {formatDate(product.seller.created_at)}
              </p>
            </div>
          </div>

          {product.seller.default_meetup_area && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-brand-border/60 text-xs text-brand-text-secondary">
              <MapPin className="h-4 w-4 text-brand-burgundy shrink-0" />
              <span>
                Khu vực giao dịch: <strong>{product.seller.default_meetup_area}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-burgundy/5 via-brand-soft-pink/30 to-brand-gold/10 border border-brand-border/60 text-xs text-brand-text-secondary space-y-1">
          <p className="font-bold text-brand-text">💡 Lưu ý giao dịch an toàn:</p>
          <p>
            Gặp mặt trực tiếp tại khuôn viên Học viện (Ký túc xá, Căn tin, Sảnh toà nhà) để kiểm tra kỹ sản phẩm trước khi thanh toán.
          </p>
        </div>
      </div>
    </div>
  );
}
