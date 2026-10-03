import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProduct, productKeys, patchProductViewCountInQueryCaches } from '../hooks';
import { registerProductView } from '../api';
import type { ProductDetailResponse } from '../types';
import { getAnonymousViewerId } from '@/lib/viewerId';
import { useCurrentUser } from '@/features/users/hooks';
import { ProductImageGallery } from '../components/ProductImageGallery';
import {
  formatVND,
  getListingTypeMeta,
  formatDate,
  formatRelativeTime,
} from '@/lib/formatters';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/hooks';
import { DirectPurchaseModal } from '@/features/orders/components/DirectPurchaseModal';
import { AuctionPanel } from '@/features/auctions/components/AuctionPanel';
import { SellerAuctionModal } from '@/features/auctions/components/SellerAuctionModal';
import { useCreateConversation } from '@/features/conversations/hooks';
import { getSafeBackAction } from '@/lib/navigation';
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
  Heart,
  ShoppingBag,
  Gavel,
  Star,
  ChevronRight,
  MessageSquare,
  Loader2,
  Flag,
  CheckCircle,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ReportModal } from '@/features/reports';

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const numericId = productId ? parseInt(productId, 10) : undefined;

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSellerAuctionModalOpen, setIsSellerAuctionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data: product, isLoading, isError, error } = useProduct(numericId);
  const { data: currentUser } = useCurrentUser();
  const { firebaseUser } = useAuth();
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const createConversationMutation = useCreateConversation();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const queryClient = useQueryClient();
  const registeredProductIdRef = useRef<number | null>(null);

  // Best-effort 24h deduplicated product view registration
  useEffect(() => {
    if (!product?.product_id) return;
    if (registeredProductIdRef.current === product.product_id) return;
    registeredProductIdRef.current = product.product_id;

    const viewerId = getAnonymousViewerId();
    registerProductView(product.product_id, viewerId)
      .then((res) => {
        if (typeof res?.view_count === 'number') {
          queryClient.setQueryData<ProductDetailResponse>(
            productKeys.detail(product.product_id),
            (old) => (old ? { ...old, view_count: res.view_count } : old),
          );
          patchProductViewCountInQueryCaches(queryClient, product.product_id, res.view_count);
        }
      })
      .catch(() => {
        // Bỏ qua lỗi vì lượt xem không làm gián đoạn trải nghiệm duyệt tin người dùng
      });
  }, [product?.product_id, queryClient]);

  const isFavorite = product ? (favoriteIds?.has(product.product_id) ?? false) : false;

  const handleStartChat = async () => {
    if (!firebaseUser) {
      navigate('/?auth=login');
      return;
    }
    if (!product) return;

    try {
      setIsStartingChat(true);
      const conv = await createConversationMutation.mutateAsync({
        product_id: product.product_id,
      });

      const thumb =
        product.images.find((img) => img.is_thumbnail)?.image_url ||
        product.images[0]?.image_url ||
        null;

      const safeContext = {
        product_id: product.product_id,
        title: product.title,
        price: product.price,
        status: product.status,
        thumbnail_url: thumb,
        listing_type: product.listing_type,
      };

      navigate(
        `/messages/${conv.conversation_id}?productId=${product.product_id}`,
        {
          state: { productContext: safeContext },
        }
      );
    } catch (err) {
      console.error('Failed to open chat:', err);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      navigate('/?auth=login');
      return;
    }
    if (product) {
      toggleFavorite.mutate({ productId: product.product_id, isFavorited: isFavorite });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-brand-text mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-sm text-brand-text-secondary mb-6">
          {(error as any)?.response?.data?.detail || 'Sản phẩm không tồn tại hoặc đã bị ẩn/xóa.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-burgundy text-white font-medium text-sm hover:bg-brand-burgundy/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>
      </div>
    );
  }

  const isOwner = Boolean(currentUser?.public_id && currentUser.public_id === product.seller.public_id);
  const listingMeta = getListingTypeMeta(product.listing_type);

  const { label: backLabel, handleBack } = getSafeBackAction(location.state, '/');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleBack(navigate)}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-text-secondary hover:text-brand-burgundy transition-colors"
          aria-label={backLabel}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>{backLabel}</span>
        </button>

        {isOwner && (
          <div className="flex items-center gap-2">
            {product.listing_type === 'FIXED_PRICE' && product.status === 'AVAILABLE' && product.moderation_status === 'CLEAR' && product.available_stock === 1 && (
              <button
                type="button"
                onClick={() => setIsSellerAuctionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <Gavel className="h-3.5 w-3.5" /> Bật đấu giá
              </button>
            )}
            <Link
              to={`/products/${product.product_id}/edit`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-soft-pink text-brand-burgundy font-bold text-xs hover:bg-brand-burgundy hover:text-white transition-colors"
            >
              <Edit className="h-3.5 w-3.5" /> Chỉnh sửa sản phẩm
            </Link>
          </div>
        )}
      </div>

      {/* Moderation Blocked Banner for Owner */}
      {isOwner && product.moderation_status === 'BLOCKED' && (
        <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h4 className="font-bold text-red-900">
              Tin đăng này đã bị quản trị viên ẩn
            </h4>
            <p className="mt-0.5 text-red-700">
              Tin đăng của bạn tạm thời không hiển thị công khai trên chợ vì lý do vi phạm tiêu chuẩn cộng đồng. Bạn vẫn có thể xem thông tin nhưng người mua không thể tìm kiếm hoặc đặt hàng.
            </p>
          </div>
        </div>
      )}

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Image Gallery + Seller Info + Safety Notice (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <ProductImageGallery
            images={product.images}
            title={product.title}
          />

          <div className="w-full min-w-0 p-4 sm:p-5 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card space-y-3">
            <h3 className="text-sm font-bold text-brand-text flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-burgundy" />
              Thông tin người bán
            </h3>

            <Link
              to={`/profile/${product.seller.public_id}?tab=sold`}
              state={{
                fromApp: true,
                returnTo: location.pathname + location.search + location.hash,
                returnLabel: 'product',
              }}
              className="group flex items-center gap-3.5 pt-1 p-2 -mx-2 -mt-1 rounded-2xl hover:bg-brand-soft-pink/50 transition-colors cursor-pointer"
              aria-label={`Xem hồ sơ của ${product.seller.full_name}`}
            >
              {product.seller.avatar_url ? (
                <img
                  src={product.seller.avatar_url}
                  alt={product.seller.full_name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-brand-burgundy/20 group-hover:border-brand-burgundy/50 transition-colors"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-burgundy/10 text-brand-burgundy">
                  <User className="h-6 w-6" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-brand-text truncate group-hover:text-brand-burgundy transition-colors">
                    {product.seller.full_name}
                  </h4>
                  {product.seller.rating_average !== null &&
                    product.seller.rating_average !== undefined && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/60 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {product.seller.rating_average.toFixed(1)}
                      </span>
                    )}
                </div>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  {product.seller.review_count && product.seller.review_count > 0
                    ? `${product.seller.review_count} đánh giá · Thành viên từ ${formatDate(product.seller.created_at)}`
                    : `Thành viên từ ${formatDate(product.seller.created_at)}`}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-brand-text-muted/60 group-hover:text-brand-burgundy group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {product.seller.delivery_area && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-brand-border/60 text-xs text-brand-text-secondary">
                <MapPin className="h-4 w-4 text-brand-burgundy shrink-0" />
                <span>
                  Phạm vi giao / nhận: <strong>{product.seller.delivery_area}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="w-full min-w-0 p-4 rounded-2xl bg-gradient-to-br from-brand-burgundy/5 via-brand-soft-pink/30 to-brand-gold/10 border border-brand-border/60 text-xs text-brand-text-secondary space-y-1">
            <p className="font-bold text-brand-text">💡 Lưu ý giao dịch an toàn:</p>
            <p className="leading-relaxed">
              Gặp mặt trực tiếp tại khuôn viên Học viện (Ký túc xá, Căn tin, Sảnh toà nhà) để kiểm tra kỹ sản phẩm trước khi thanh toán.
            </p>
          </div>
        </div>

        {/* Right Column: Product Info & Buy/Auction Box (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-block rounded-lg bg-brand-burgundy/10 px-2.5 py-1 text-xs font-bold text-brand-burgundy">
                {product.category.name}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  disabled={toggleFavorite.isPending}
                  className={`p-2 rounded-xl border transition-all ${isFavorite
                    ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100'
                    : 'bg-white border-brand-border text-brand-text-muted hover:text-rose-500 hover:border-rose-200'
                    }`}
                  title={isFavorite ? 'Bỏ lưu' : 'Lưu tin'}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
                </button>

                {listingMeta.isAuction && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${listingMeta.badgeClass}`}
                  >
                    Đấu giá
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-brand-text leading-snug min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
              {product.title}
            </h1>

            {product.listing_type === 'FIXED_PRICE' && (
              <div className="flex items-baseline justify-between p-3.5 rounded-2xl bg-brand-soft-pink/30 border border-brand-border/60">
                <div>
                  <span className="text-xl sm:text-2xl font-black text-brand-price">
                    {formatVND(product.price)}
                  </span>
                </div>

                <div className="text-right text-xs text-brand-text-secondary">
                  <div className="flex items-center gap-1 justify-end font-semibold text-emerald-700">
                    <Package className="h-3.5 w-3.5" /> Có sẵn: {product.available_stock}
                  </div>
                  <div className="flex items-center gap-1 justify-end text-brand-text-muted mt-0.5">
                    <Eye className="h-3.5 w-3.5" /> {new Intl.NumberFormat('vi-VN').format(product.view_count)} lượt xem
                  </div>
                </div>
              </div>
            )}

            {/* Action button for direct purchasing when FIXED_PRICE */}
            {!isOwner && product.status === 'AVAILABLE' && product.listing_type === 'FIXED_PRICE' && (
              <div className="pt-1">
                {product.available_stock > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!firebaseUser) {
                        navigate('/?auth=login');
                        return;
                      }
                      setIsPurchaseModalOpen(true);
                    }}
                    className="w-full py-3 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Mua ngay
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 px-6 rounded-2xl bg-stone-200 text-stone-500 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Tạm hết hàng (đang trong giao dịch)
                  </button>
                )}
              </div>
            )}


            {/* Direct Chat action for buyers */}
            {!isOwner && product.status === 'AVAILABLE' && (
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={handleStartChat}
                  disabled={isStartingChat}
                  className="w-full py-2.5 px-4 rounded-2xl border-2 border-brand-burgundy/20 hover:border-brand-burgundy hover:bg-brand-soft-pink/30 text-brand-burgundy text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isStartingChat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Nhắn tin cho người bán
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-brand-text-muted pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Đăng {formatRelativeTime(product.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {new Intl.NumberFormat('vi-VN').format(product.view_count)} lượt xem
                </span>
              </div>
              {!isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    if (!firebaseUser) {
                      navigate('/?auth=login');
                      return;
                    }
                    setIsReportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Báo cáo sản phẩm vi phạm"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>Báo cáo</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Auction Panel when AUCTION */}
          {product.listing_type === 'AUCTION' && (
            <AuctionPanel
              productId={product.product_id}
              product={product}
              isSeller={isOwner}
              isAuthenticated={!!firebaseUser}
              onRequireAuth={() => navigate('/?auth=login')}
            />
          )}

          <div className="p-4 sm:p-5 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card space-y-2">
            <h3 className="text-sm font-bold text-brand-text flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-burgundy" />
              Mô tả sản phẩm
            </h3>
            <div className="text-xs sm:text-sm text-brand-text-secondary whitespace-pre-line leading-relaxed pt-1">
              {product.description || 'Người bán chưa cung cấp mô tả chi tiết cho sản phẩm này.'}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Purchase Modal */}
      <DirectPurchaseModal
        product={product}
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />

      {/* Seller Auction Setup Modal */}
      <SellerAuctionModal
        isOpen={isSellerAuctionModalOpen}
        onClose={() => setIsSellerAuctionModalOpen(false)}
        product={product}
      />

      {/* Report Modal */}
      {product && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="PRODUCT"
          targetId={product.product_id}
          targetTitle={`Sản phẩm: ${product.title}`}
          onSuccess={() => {
            setSuccessToast('Đã gửi báo cáo. Ban quản trị sẽ xem xét.');
            setTimeout(() => setSuccessToast(null), 4000);
          }}
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
}
