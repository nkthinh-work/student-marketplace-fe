import { useState, useEffect, useCallback } from 'react';
import { heroSlides } from '@/data/heroSlides';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const activeSlides = heroSlides.filter((slide) => slide.enabled);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  useEffect(() => {
    if (isHovered || activeSlides.length <= 1) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [isHovered, nextSlide, activeSlides.length]);

  if (activeSlides.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-brand-soft-pink elevation-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {activeSlides.map((slide) => (
          <div key={slide.id} className="relative min-w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[3/1] max-h-72">
            <img
              src={slide.imageUrl}
              alt={slide.alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4 sm:p-6">
              <span className="text-sm sm:text-base md:text-lg font-medium text-white drop-shadow">
                {slide.alt}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {activeSlides.length > 1 && (
        <>
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
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Đi tới slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all hover:scale-125 ${
                  idx === currentIndex
                    ? 'w-6 bg-brand-gold shadow-sm'
                    : 'w-2 bg-white/60 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
