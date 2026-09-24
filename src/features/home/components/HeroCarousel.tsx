import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Camera, CheckCircle2, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useCommunityHeroMoments,
  CommunityUploadModal,
} from '@/features/communityMoments';

interface CarouselSlide {
  id: string;
  imageUrl: string;
  alt: string;
  momentId: number;
  note?: string | null;
}

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { firebaseUser } = useAuth();
  const { data: communityData } = useCommunityHeroMoments();

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Compose active slides strictly from approved Community Moments (up to 5, zero static backfill)
  const activeSlides: CarouselSlide[] = useMemo(() => {
    const communityItems = communityData?.items || [];
    return communityItems.map((item) => ({
      id: `community-${item.moment_id}`,
      imageUrl: item.image_url,
      alt: item.note || 'Khoảnh khắc cộng đồng PTITers',
      momentId: item.moment_id,
      note: item.note ?? null,
    }));
  }, [communityData?.items]);

  // Actual carousel state reconciliation:
  // Clamp or reset currentIndex when slide count changes
  useEffect(() => {
    if (activeSlides.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      if (activeSlides.length === 0) return 0;
      return (prev + 1) % activeSlides.length;
    });
  }, [activeSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      if (activeSlides.length === 0) return 0;
      return (prev - 1 + activeSlides.length) % activeSlides.length;
    });
  }, [activeSlides.length]);

  // Autoplay timer: only runs if 2 or more slides exist, pauses on hover
  useEffect(() => {
    if (isHovered || activeSlides.length <= 1) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [isHovered, nextSlide, activeSlides.length]);

  const handleCameraClick = () => {
    if (firebaseUser) {
      setIsUploadModalOpen(true);
      return;
    }

    // Canonical Auth UX: scroll to auth card
    const authCard = document.getElementById('auth-card');
    if (authCard) {
      authCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const safeCurrentIndex =
    activeSlides.length > 0 ? Math.min(currentIndex, activeSlides.length - 1) : 0;

  return (
    <>
      {/* Toast Banner */}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-16 inset-x-4 sm:max-w-md sm:mx-auto z-50 flex items-center justify-between gap-2.5 rounded-2xl bg-[#5E232B] text-white p-3.5 shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="h-5 w-5 text-[#E3B566] shrink-0" />
            <p className="text-xs sm:text-sm font-medium leading-snug">
              {toastMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white shrink-0"
            aria-label="Đóng thông báo"
          >
            <X className="h-4 w-4" />
          </button>
        </aside>
      )}

      {/* Hero Container: Canonical 16:9 aspect ratio across all breakpoints */}
      {activeSlides.length === 0 ? (
        /* CSS-only branded Hero fallback when 0 approved moments exist */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5E232B] via-[#6E2933] to-[#45181F] aspect-video shadow-md border border-white/10 flex items-center px-4 sm:px-6">
          <div className="min-w-0 max-w-[calc(100%-52px)] sm:max-w-[70%] space-y-1 sm:space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#E3B566] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chợ PTITers</span>
            </div>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white leading-snug drop-shadow-sm">
              Trao đổi đồ cũ sinh viên & Gắn kết cộng đồng
            </h2>
            <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed line-clamp-1 sm:line-clamp-2">
              Chia sẻ khoảnh khắc nhận hàng hoặc kỷ niệm học đường của bạn ngay hôm nay.
            </p>
          </div>

          {/* Camera Entry Point Button */}
          <button
            type="button"
            onClick={handleCameraClick}
            aria-label="Chia sẻ khoảnh khắc"
            title="Chia sẻ khoảnh khắc nhận hàng"
            className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#5E232B]/95 hover:bg-[#5E232B] text-white shadow-md border border-white/20 active:scale-95 transition-transform backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-white"
          >
            <Camera className="h-5 w-5 text-[#E3B566]" />
          </button>
        </div>
      ) : (
        /* Community Hero Carousel */
        <div
          className="relative overflow-hidden rounded-2xl bg-brand-soft-pink elevation-2 aspect-video"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Slides Track */}
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${safeCurrentIndex * 100}%)` }}
          >
            {activeSlides.map((slide) => (
              <div
                key={slide.id}
                className="relative min-w-full h-full"
              >
                <img
                  src={slide.imageUrl}
                  alt={slide.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3 sm:p-5 pointer-events-none">
                  {slide.note ? (
                    <span
                      className={`text-xs sm:text-sm font-medium text-white drop-shadow-md truncate bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/15 select-none ${
                        activeSlides.length > 1
                          ? 'max-w-[calc(50%-16px)] sm:max-w-[45%] md:max-w-[55%]'
                          : 'max-w-[calc(100%-60px)] sm:max-w-[calc(100%-80px)] md:max-w-[65%]'
                      }`}
                    >
                      {slide.note}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls: Only rendered if activeSlides.length > 1 */}
          {activeSlides.length > 1 && (
            <>
              {/* Arrows */}
              <button
                onClick={prevSlide}
                aria-label="Slide trước"
                className="icon-btn-interactive absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextSlide}
                aria-label="Slide kế tiếp"
                className="icon-btn-interactive absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {activeSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Đi tới slide ${idx + 1}`}
                    className={`h-2 rounded-full transition-all hover:scale-125 ${
                      idx === safeCurrentIndex
                        ? 'w-6 bg-brand-gold shadow-sm'
                        : 'w-2 bg-white/60 hover:bg-white/90'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Camera Entry Point Button */}
          <button
            type="button"
            onClick={handleCameraClick}
            aria-label="Chia sẻ khoảnh khắc"
            title="Chia sẻ khoảnh khắc nhận hàng"
            className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#5E232B]/95 hover:bg-[#5E232B] text-white shadow-md border border-white/20 active:scale-95 transition-transform backdrop-blur-xs focus-visible:outline-2 focus-visible:outline-white"
          >
            <Camera className="h-5 w-5 text-[#E3B566]" />
          </button>
        </div>
      )}

      {/* Upload Modal / Sheet */}
      <CommunityUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccessToast={(msg) => setToastMessage(msg)}
      />
    </>
  );
}
