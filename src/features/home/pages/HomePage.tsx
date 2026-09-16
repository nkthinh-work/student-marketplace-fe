import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HeroCarousel } from '../components/HeroCarousel';
import { CategoryBar } from '../components/CategoryBar';
import { HomeDiscoveryCarousel } from '../components/HomeDiscoveryCarousel';
import { ProductFeedSection } from '@/features/products/components/ProductFeedSection';
import { LoginPrompt } from '@/components/common/LoginPrompt';
import {
  DailyNeedsMarquee,
  DailyNeedModal,
  useMyDailyNeedSummary,
} from '@/features/dailyNeeds';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCurrentUser } from '@/features/users/hooks';
import { useScrollReveal } from '@/lib/useScrollReveal';
import { Avatar } from '@/components/common/Avatar';
import type {
  ProductFilterParams,
  ListingType,
} from '@/features/products/types';
import { Sparkles, ArrowRight, PenSquare, Flame } from 'lucide-react';

export function HomePage() {
  const { firebaseUser } = useAuth();
  const { data: user } = useCurrentUser();
  const { data: journalSummary } = useMyDailyNeedSummary(Boolean(firebaseUser));
  const [searchParams, setSearchParams] = useSearchParams();
  const [carouselHasItems, setCarouselHasItems] = useState<boolean | null>(null);
  const [isDailyNeedModalOpen, setIsDailyNeedModalOpen] = useState(false);
  const [isActivatingFlame, setIsActivatingFlame] = useState(false);

  const hasCheckedInToday = Boolean(journalSummary?.has_checked_in_today);
  const hasJournalToday = Boolean(journalSummary?.has_journal_today);
  const streakCount = journalSummary?.streak_count ?? 0;



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

  // Check whether any search or filter is active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.q ||
      filters.category_id !== undefined ||
      filters.listing_type ||
      filters.min_price !== undefined ||
      filters.max_price !== undefined
    );
  }, [filters]);

  const isViewAll = searchParams.get('view') === 'all';

  // Determine whether to show carousel and full product feed
  const showCarousel = !hasActiveFilters && carouselHasItems !== false;
  const showProductFeed = hasActiveFilters || isViewAll || carouselHasItems === false;

  const revealRef = useScrollReveal();

  // Handle "Xem tất cả" to reveal full browsing feed
  const handleSeeAll = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', 'all');
    setSearchParams(newParams);
    setTimeout(() => {
      document.getElementById('product-feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // Handle Category selection
  const handleCategorySelect = (categoryId?: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('view');
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
    newParams.delete('view');

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
    newParams.delete('view');
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
      {/* 1. Hero Carousel */}
      <div className="mb-3 sm:mb-4">
        <HeroCarousel />
      </div>

      {/* 2. Welcome Card (Auth Prompt or Authenticated Personal Identity & Streak) */}
      <div className="mb-3 sm:mb-4 relative z-0">
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
          <section className="rounded-2xl bg-brand-warm-white p-3.5 sm:p-4 border border-brand-border shadow-card card-interactive">
            {/* Top row: User identity & profile action */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <Avatar
                  src={user?.avatar_url}
                  name={user?.full_name || firebaseUser.displayName}
                  size="md"
                  className="border border-brand-burgundy/20"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-brand-text-muted leading-tight">
                    Chào mừng trở lại,
                  </p>
                  <h3 className="text-sm sm:text-base font-bold text-brand-text break-words leading-snug mt-0.5">
                    {user?.full_name || firebaseUser.displayName || 'PTITer'}
                  </h3>
                </div>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-1 text-xs font-semibold text-brand-burgundy hover:underline shrink-0 pt-0.5"
              >
                <span>Hồ sơ</span> <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Bottom row: Streak flame status & Journal CTA */}
            <div className="mt-3 pt-2.5 border-t border-brand-border/50 flex items-center justify-between gap-2">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                  hasCheckedInToday
                    ? 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs'
                    : 'bg-stone-100 text-stone-500 border border-stone-200/60'
                }`}
                title={
                  hasCheckedInToday
                    ? 'Bạn đã giữ chuỗi hôm nay'
                    : 'Đăng nhật ký hôm nay để giữ chuỗi'
                }
                aria-label={
                  hasCheckedInToday
                    ? 'Bạn đã giữ chuỗi hôm nay'
                    : 'Đăng nhật ký hôm nay để giữ chuỗi'
                }
              >
                <span
                  className={`inline-flex items-center justify-center ${
                    isActivatingFlame ? 'animate-flame-pulse' : ''
                  }`}
                >
                  <Flame
                    className={`w-4 h-4 transition-colors ${
                      hasCheckedInToday
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-stone-400 fill-transparent'
                    }`}
                  />
                </span>
                <span>{streakCount} ngày</span>
              </div>

              <button
                type="button"
                onClick={() => setIsDailyNeedModalOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-brand-burgundy/10 hover:bg-brand-burgundy/15 text-brand-burgundy text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 shadow-2xs shrink-0"
                title={
                  hasJournalToday
                    ? 'Chỉnh sửa nhật ký hôm nay'
                    : 'Đăng nhật ký hôm nay'
                }
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nhật ký hôm nay</span>
                <span className="sm:hidden">Nhật ký</span>
              </button>
            </div>

          </section>
        )}
      </div>

      {/* 3. Daily Journal Marquee (Directly below Welcome Card, before Categories) */}
      <DailyNeedsMarquee />

      {/* 4. Sticky CategoryBar — top-[56px] with invariant geometry (0px gap directly under fixed 56px Header) */}
      <div className="sticky top-[56px] z-40 bg-brand-cream isolate -mx-4 px-4 pt-0 pb-2 border-b border-brand-border/60">
        <section>
          <CategoryBar
            selectedCategoryId={filters.category_id}
            onSelectCategory={handleCategorySelect}
          />
        </section>
      </div>


      {/* Discovery Carousel (Displayed on default Home preview and view=all) */}
      {showCarousel && (
        <HomeDiscoveryCarousel
          onSeeAll={isViewAll ? undefined : handleSeeAll}
          onLoadedStatus={setCarouselHasItems}
        />
      )}

      {/* Product Feed Section (Revealed on active filters, view=all, or carousel fallback) */}
      {showProductFeed && (
        <section id="product-feed" ref={revealRef} className="reveal mt-6">
          <ProductFeedSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearSearch={handleClearSearch}
          />
        </section>
      )}

      {/* Daily Need Create / Edit Modal */}
      <DailyNeedModal
        isOpen={isDailyNeedModalOpen}
        onClose={() => setIsDailyNeedModalOpen(false)}
        onJournalPublished={(wasFirstPostToday) => {
          if (wasFirstPostToday) {
            setIsActivatingFlame(true);
            setTimeout(() => setIsActivatingFlame(false), 700);
          }
        }}
      />

    </div>
  );
}