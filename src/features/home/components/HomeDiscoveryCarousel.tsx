import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/features/products/api';
import { productKeys } from '@/features/products/hooks';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface HomeDiscoveryCarouselProps {
  onSeeAll?: () => void;
  onLoadedStatus?: (hasItems: boolean) => void;
}

export const HomeDiscoveryCarousel: React.FC<HomeDiscoveryCarouselProps> = ({
  onSeeAll,
  onLoadedStatus,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollDebounceRef = useRef<number | null>(null);
  const isProgrammaticScrolling = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracted, setIsInteracted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isInViewport, setIsInViewport] = useState(true);

  // Fetch bounded set of 8 newest products
  const { data, isLoading, isError } = useQuery({
    queryKey: productKeys.publicList({ limit: 8 }),
    queryFn: () => getProducts({ limit: 8 }),
    staleTime: 60 * 1000,
  });

  const products = data?.items || [];
  const totalItems = products.length;

  // Notify parent of load status
  useEffect(() => {
    if (!isLoading) {
      onLoadedStatus?.(!isError && totalItems > 0);
    }
  }, [isLoading, isError, totalItems, onLoadedStatus]);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Listen to visibilitychange (page hidden/inactive tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // IntersectionObserver to detect when carousel is inside viewport
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInViewport(entry.isIntersecting);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track active slide on settled scroll (debounced to avoid fighting during touchpad momentum)
  const handleScroll = useCallback(() => {
    if (scrollDebounceRef.current) {
      window.clearTimeout(scrollDebounceRef.current);
    }
    scrollDebounceRef.current = window.setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;

      const scrollLeft = el.scrollLeft;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;

      const cardWidth = card.offsetWidth + 14; // card width + gap
      if (cardWidth > 0) {
        const index = Math.round(scrollLeft / cardWidth);
        setActiveIndex(Math.min(Math.max(index, 0), totalItems - 1));
      }
    }, 60);
  }, [totalItems]);

  // Cleanup scroll debounce on unmount
  useEffect(() => {
    return () => {
      if (scrollDebounceRef.current) {
        window.clearTimeout(scrollDebounceRef.current);
      }
    };
  }, []);

  // Scroll to specific index safely without stacking programmatic scroll calls
  const scrollToIndex = (index: number, userInitiated = false) => {
    if (userInitiated) {
      setIsInteracted(true);
    }
    const el = scrollRef.current;
    if (!el || isProgrammaticScrolling.current) return;

    const card = el.children[index] as HTMLElement | undefined;
    if (card) {
      isProgrammaticScrolling.current = true;
      el.scrollTo({
        left: card.offsetLeft - el.offsetLeft,
        behavior: 'smooth',
      });
      setActiveIndex(index);

      // Release programmatic scroll guard after transition finishes
      setTimeout(() => {
        isProgrammaticScrolling.current = false;
      }, 400);
    }
  };

  // User interaction handlers to immediately cancel autoplay
  const handleUserInteraction = () => {
    if (!isInteracted) {
      setIsInteracted(true);
    }
  };

  // Autoplay effect (~7 seconds, stops on last item or on user interaction)
  useEffect(() => {
    if (
      isInteracted ||
      isHovered ||
      !isPageVisible ||
      !isInViewport ||
      prefersReducedMotion ||
      totalItems < 3 ||
      activeIndex >= totalItems - 1
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const nextIndex = activeIndex + 1;
      if (nextIndex < totalItems) {
        scrollToIndex(nextIndex, false);
      }
    }, 7000);

    return () => clearTimeout(timer);
  }, [
    activeIndex,
    isInteracted,
    isHovered,
    isPageVisible,
    isInViewport,
    prefersReducedMotion,
    totalItems,
  ]);

  if (isError || (!isLoading && totalItems === 0)) {
    return null;
  }

  return (
    <section
      className="my-5 space-y-3"
      aria-label="Sản phẩm mới đăng"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm sm:text-base font-bold text-brand-text">
          Mới đăng
        </h2>

        <div className="flex items-center gap-2">

          {/* Desktop scroll arrows */}
          {totalItems > 2 && (
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={() => scrollToIndex(Math.max(0, activeIndex - 1), true)}
                disabled={activeIndex === 0}
                className="p-1 rounded-full border border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Sản phẩm trước"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToIndex(Math.min(totalItems - 1, activeIndex + 1), true)}
                disabled={activeIndex >= totalItems - 1}
                className="p-1 rounded-full border border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Sản phẩm tiếp theo"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-burgundy hover:underline cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex gap-3.5 overflow-hidden py-1 px-1 -mx-1 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[76vw] max-w-[280px] sm:w-[260px] h-64 shrink-0 rounded-2xl bg-stone-200"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Horizontal Snap Carousel with snap-mandatory and snap-always cards */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onTouchStart={handleUserInteraction}
            onPointerDown={handleUserInteraction}
            onWheel={handleUserInteraction}
            className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1 px-1 -mx-1 touch-pan-x"
          >
            {products.map((product, idx) => (
              <div
                key={product.product_id}
                className="w-[76vw] max-w-[280px] sm:w-[260px] shrink-0 snap-start snap-always"
              >
                <ProductCard product={product} staggerIndex={idx + 1} />
              </div>
            ))}
          </div>

          {/* Carousel Position Indicators */}
          {totalItems > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {products.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToIndex(idx, true)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === activeIndex
                      ? 'w-5 bg-brand-burgundy'
                      : 'w-1.5 bg-brand-border hover:bg-stone-400'
                  }`}
                  aria-label={`Chuyển đến sản phẩm ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};
