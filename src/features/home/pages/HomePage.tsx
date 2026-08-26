import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HeroCarousel } from '../components/HeroCarousel';
import { CategoryBar } from '../components/CategoryBar';
import { ProductFeedSection } from '@/features/products/components/ProductFeedSection';
import { LoginPrompt } from '@/components/common/LoginPrompt';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentUser } from '@/features/users/hooks';
import { useScrollReveal } from '@/lib/useScrollReveal';
import type {
  ProductFilterParams,
  ListingType,
} from '@/features/products/types';
import { Sparkles, User, ArrowRight } from 'lucide-react';

export function HomePage() {
  const { firebaseUser } = useAuth();
  const { data: user } = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filters: ProductFilterParams = useMemo(() => {
    const catParam = searchParams.get('category_id');
    const category_id = catParam ? parseInt(catParam, 10) : undefined;
    const listing_type = (searchParams.get('listing_type') as ListingType) || undefined;
    const minParam = searchParams.get('min_price');
    const min_price = minParam ? Number(minParam) : undefined;
    const maxParam = searchParams.get('max_price');
    const max_price = maxParam ? Number(maxParam) : undefined;
    const q = searchParams.get('q') || undefined;

    return {
      category_id: !isNaN(category_id!) ? category_id : undefined,
      listing_type,
      min_price,
      max_price,
      q,
    };
  }, [searchParams]);

  // Sticky detection via IntersectionObserver for shadow enhancement
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsSticky(!entry.isIntersecting);
        }
      },
      { threshold: 0, rootMargin: '-56px 0px 0px 0px' }, // 56px = Header height
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const revealRef = useScrollReveal();

  // Handle Category selection
  const handleCategorySelect = (categoryId?: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryId !== undefined) {
      newParams.set('category_id', String(categoryId));
    } else {
      newParams.delete('category_id');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Handle Filter changes from ProductFilters modal
  const handleFilterChange = (newFilters: ProductFilterParams) => {
    const newParams = new URLSearchParams(searchParams);

    if (newFilters.listing_type) {
      newParams.set('listing_type', newFilters.listing_type);
    } else {
      newParams.delete('listing_type');
    }

    if (newFilters.min_price !== undefined) {
      newParams.set('min_price', String(newFilters.min_price));
    } else {
      newParams.delete('min_price');
    }

    if (newFilters.max_price !== undefined) {
      newParams.set('max_price', String(newFilters.max_price));
    } else {
      newParams.delete('max_price');
    }

    setSearchParams(newParams, { replace: true });
  };

  const handleClearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('q');
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
      {/* Hero Carousel */}
      <div className="mb-4">
        <HeroCarousel />
      </div>

      {/* Sentinel — invisible marker for sticky detection, exactly at sticky container top */}
      <div
        ref={sentinelRef}
        className="h-0 w-0 pointer-events-none opacity-0"
        aria-hidden="true"
      />

      {/* Sticky CategoryBar ONLY — top-14 pt-0: 0px gap directly flush under Header */}
      <div
        className={`sticky top-14 z-40 bg-brand-cream isolate -mx-4 px-4 pt-0 pb-2 transition-shadow duration-200 ${
          isSticky ? 'border-b border-brand-border/70 shadow-sticky' : ''
        }`}
      >
        <section>
          <CategoryBar
            selectedCategoryId={filters.category_id}
            onSelectCategory={handleCategorySelect}
          />
        </section>
      </div>

      {/* Full Auth Prompt or User Welcome Card — in normal document flow */}
      <div className="mt-5 relative z-0">
        {!firebaseUser ? (
          <section id="auth-card" className="scroll-mt-20" ref={revealRef}>
            <div className="reveal rounded-2xl bg-gradient-to-br from-brand-burgundy/10 via-brand-soft-pink/30 to-brand-gold/10 p-5 border border-brand-border/60 card-interactive">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-burgundy" />
                <h2 className="text-sm sm:text-base font-bold text-brand-text">
                  Tham gia Chợ PTITers ngay hôm nay!
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-brand-text-secondary mb-4">
                Đăng nhập bằng tài khoản Google sinh viên để đăng tin rao vặt, trao đổi sách giáo trình và liên hệ người bán.
              </p>
              <LoginPrompt message="Đăng nhập nhanh chỉ với 1 chạm" />
            </div>
          </section>
        ) : (
          <section className="rounded-2xl bg-brand-warm-white p-4 border border-brand-border shadow-card card-interactive flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-10 w-10 rounded-full object-cover border border-brand-burgundy/20"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-burgundy/10 text-brand-burgundy">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="text-xs text-brand-text-muted">Chào mừng trở lại,</p>
                <h3 className="text-sm font-bold text-brand-text">
                  {user?.full_name || firebaseUser.displayName || 'PTITer'}
                </h3>
              </div>
            </div>
            <Link
              to="/profile"
              className="flex items-center gap-1 text-xs font-semibold text-brand-burgundy hover:underline"
            >
              Hồ sơ <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        )}
      </div>

      {/* Product Feed Section (Real API with Infinite Scroll, Search, Filters) */}
      <section ref={revealRef} className="reveal mt-6">
        <ProductFeedSection
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearSearch={handleClearSearch}
        />
      </section>
    </div>
  );
}