import { useEffect, useRef, useState } from 'react';
import { useProducts } from '../hooks';
import type { ProductFilterParams } from '../types';
import { ProductCard } from './ProductCard';
import { ProductFilters } from './ProductFilters';
import {
  ShoppingBag,
  Tag,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface ProductFeedSectionProps {
  filters: ProductFilterParams;
  onFilterChange: (filters: ProductFilterParams) => void;
  onClearSearch?: () => void;
}

export function ProductFeedSection({
  filters,
  onFilterChange,
  onClearSearch,
}: ProductFeedSectionProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProducts(filters);

  // Sentinel for infinite loading
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }, // Fetch early before reaching bottom
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all items across cursor pages
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const allProducts = data?.pages.flatMap((page) => page.items) || [];
  const totalItemsLoaded = allProducts.length;

  // Calculate active filter count (excluding q and category_id which are displayed separately)
  const activeFilterCount = [
    filters.listing_type,
    filters.min_price,
    filters.max_price,
  ].filter((v) => v !== undefined).length;

  const hasActiveRefinements = activeFilterCount > 0 || Boolean(filters.q);

  const handleClearRefinements = () => {
    onFilterChange({
      ...filters,
      listing_type: undefined,
      min_price: undefined,
      max_price: undefined,
    });
    if (filters.q && onClearSearch) {
      onClearSearch();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div
        data-ui-role="search-results-header"
        className="flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBag className="h-5 w-5 text-brand-burgundy shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-brand-text truncate">
            {filters.q ? `Kết quả cho "${filters.q}"` : 'Mặt hàng gần đây'}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ProductFilters
            filters={filters}
            onChange={onFilterChange}
            activeCount={activeFilterCount}
            isOpen={isFilterModalOpen}
            onOpenChange={setIsFilterModalOpen}
          />
        </div>
      </div>

      {/* Active Search Tag if searching */}
      {filters.q && (
        <div className="flex items-center gap-2 text-xs bg-brand-soft-pink text-brand-burgundy px-3 py-1.5 rounded-xl border border-brand-burgundy/20 w-fit">
          <Search className="h-3.5 w-3.5" />
          <span>
            Tìm kiếm: <strong>{filters.q}</strong>
          </span>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="ml-1 text-xs font-bold hover:underline"
            >
              Xóa
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col overflow-hidden rounded-2xl bg-brand-warm-white border border-brand-border animate-pulse"
            >
              <div className="aspect-[4/3] w-full bg-brand-soft-pink/60" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-1/3 bg-brand-border/60 rounded-md" />
                <div className="h-4 w-full bg-brand-border/80 rounded-md" />
                <div className="h-4 w-2/3 bg-brand-border/80 rounded-md" />
                <div className="h-4 w-1/2 bg-brand-price/30 rounded-md pt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-brand-price mb-2" />
          <p className="text-sm font-semibold text-brand-text">
            Không thể tải danh sách sản phẩm
          </p>
          <p className="text-xs text-brand-text-secondary mt-1 mb-4">
            {(error as { response?: { data?: { detail?: string } } })?.response?.data
              ?.detail || 'Đã có lỗi kết nối máy chủ. Vui lòng thử lại.'}
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

      {/* Empty State */}
      {!isLoading && !isError && allProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border p-8 text-center bg-brand-warm-white/50">
          <Tag className="h-8 w-8 text-brand-text-muted mb-2" />
          {hasActiveRefinements ? (
            /* CASE A: Active filters/search produced 0 matches */
            <>
              <p className="text-sm font-bold text-brand-text">
                Không tìm thấy sản phẩm phù hợp
              </p>
              <p className="text-xs text-brand-text-muted mt-1 max-w-sm">
                Thử thay đổi khoảng giá, từ khóa tìm kiếm hoặc đặt lại bộ lọc để tìm thêm sản phẩm.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleClearRefinements}
                  className="btn-interactive px-3.5 py-2 rounded-xl bg-brand-soft-pink text-brand-burgundy border border-brand-burgundy/20 text-xs font-semibold hover:bg-brand-soft-pink/80 transition-colors shadow-2xs"
                >
                  Xóa bộ lọc
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="btn-interactive flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-burgundy text-white text-xs font-semibold hover:bg-brand-burgundy-dark transition-colors shadow-2xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Điều chỉnh bộ lọc</span>
                </button>
              </div>
            </>
          ) : (
            /* CASE B: Genuinely empty browse context / category */
            <>
              <p className="text-sm font-bold text-brand-text">
                Chưa có sản phẩm
              </p>
              <p className="text-xs text-brand-text-muted mt-1 max-w-sm">
                {filters.category_id
                  ? 'Hiện chưa có sản phẩm nào trong danh mục này. Hãy quay lại sau hoặc khám phá toàn bộ nhé!'
                  : 'Hiện chưa có sản phẩm nào được đăng bán. Hãy là người đầu tiên đăng tin nhé!'}
              </p>
              {filters.category_id && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, category_id: undefined })}
                  className="mt-4 btn-interactive px-4 py-2 rounded-xl bg-brand-burgundy text-white text-xs font-semibold hover:bg-brand-burgundy-dark transition-colors shadow-2xs"
                >
                  Xem tất cả sản phẩm
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !isError && allProducts.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3">
            {allProducts.map((product, index) => (
              <ProductCard
                key={product.product_id}
                product={product}
                staggerIndex={(index % 6) + 1}
              />
            ))}
          </div>

          {/* Infinite Scroll Sentinel & Load More Status */}
          <div
            ref={loadMoreSentinelRef}
            className="py-4 flex flex-col items-center justify-center gap-2"
          >
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brand-burgundy" />
                <span>Đang tải thêm sản phẩm...</span>
              </div>
            )}

            {!isFetchingNextPage && hasNextPage && (
              <button
                type="button"
                onClick={() => fetchNextPage()}
                className="btn-interactive rounded-xl border border-brand-border bg-brand-warm-white px-4 py-2 text-xs font-semibold text-brand-text-secondary hover:bg-brand-soft-pink"
              >
                Tải thêm ({totalItemsLoaded} đã tải)
              </button>
            )}

            {!hasNextPage && totalItemsLoaded > 0 && (
              <p className="text-[11px] text-brand-text-muted text-center pt-2">
                Đã hiển thị toàn bộ {totalItemsLoaded} sản phẩm phù hợp ✨
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
