import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks';
import { ProductCard } from '@/features/products/components/ProductCard';
import { Heart, Loader2, RefreshCw, ShoppingBag, ArrowLeft } from 'lucide-react';
import type { ProductSummaryResponse } from '@/features/products/types';

export function FavoritesPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFavorites();

  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver tự động kích hoạt nạp trang tiếp theo
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Gom toàn bộ items từ các trang cursor
  const allFavorites: ProductSummaryResponse[] =
    data?.pages.flatMap((page) =>
      page.items.map((item) => ({
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        listing_type: item.listing_type,
        status: item.status,
        available_stock: item.available_stock,
        thumbnail_url: item.thumbnail_url,
        category: item.category,
        seller: item.seller,
        created_at: item.created_at,
      })),
    ) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 space-y-5">
      {/* Header section */}
      <div className="flex items-center justify-between gap-3 border-b border-brand-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft-pink text-brand-price">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-brand-text">
              Tin đã lưu
            </h1>
            <p className="text-xs text-brand-text-secondary">
              {allFavorites.length > 0
                ? `${allFavorites.length} sản phẩm đang quan tâm`
                : 'Danh sách sản phẩm bạn đã lưu'}
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="btn-interactive flex items-center gap-1.5 rounded-xl border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-text-secondary hover:bg-brand-soft-pink no-underline"
        >
          <ArrowLeft className="h-4 w-4" /> Khám phá
        </Link>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl bg-brand-warm-white border border-brand-border/60 animate-pulse"
            >
              <div className="aspect-[4/3] w-full bg-brand-soft-pink/60" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-1/3 rounded bg-brand-border/60" />
                <div className="h-4 w-full rounded bg-brand-border/60" />
                <div className="h-4 w-2/3 rounded bg-brand-border/60" />
                <div className="pt-2 border-t border-brand-border/40 flex justify-between items-center">
                  <div className="h-4 w-1/2 rounded bg-brand-border/60" />
                  <div className="h-4 w-4 rounded-full bg-brand-border/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-brand-warm-white border border-brand-border/60 p-8 text-center shadow-card space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-brand-text">
            Không thể tải danh sách tin đã lưu
          </h3>
          <p className="text-xs text-brand-text-secondary max-w-sm">
            {(error as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail || 'Vui lòng kiểm tra kết nối mạng và thử lại.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-interactive inline-flex items-center gap-1.5 rounded-2xl bg-brand-burgundy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-burgundy-dark"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Thử lại
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && allFavorites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-brand-warm-white border border-brand-border/60 p-10 text-center shadow-card space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft-pink text-brand-price">
            <Heart className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-brand-text">
              Bạn chưa lưu tin nào.
            </h3>
            <p className="text-xs text-brand-text-secondary max-w-sm">
              Hãy bấm vào biểu tượng trái tim ở các sản phẩm bạn quan tâm để lưu
              lại xem sau.
            </p>
          </div>
          <Link
            to="/"
            className="btn-interactive inline-flex items-center gap-2 rounded-2xl bg-brand-burgundy px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-burgundy-dark no-underline"
          >
            <ShoppingBag className="h-4 w-4" /> Khám phá ngay
          </Link>
        </div>
      )}

      {/* Product Grid */}
      {!isLoading && !isError && allFavorites.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {allFavorites.map((product, index) => (
              <ProductCard
                key={product.product_id}
                product={product}
                staggerIndex={(index % 6) + 1}
              />
            ))}
          </div>

          {/* Infinite Scroll Sentinel */}
          <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4 text-xs text-brand-text-secondary gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand-burgundy" />
              <span>Đang tải thêm tin đã lưu...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
