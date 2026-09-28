import React, { useEffect, useMemo, useRef } from "react";
import { Star } from "lucide-react";
import { StarRating } from "./StarRating";
import { useSellerRecentReviews } from "../hooks";
import type { PublicSellerReviewItem } from "../types";

interface RecentReviewsMarqueeProps {
  userId: number;
  reviewCount?: number;
}

function formatReviewDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

interface ConveyorCardProps {
  review: PublicSellerReviewItem;
  isStatic?: boolean;
}

const ConveyorCard: React.FC<ConveyorCardProps> = ({ review, isStatic = false }) => {
  return (
    <div
      className={`rounded-2xl border border-brand-border bg-white p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between select-none ${
        isStatic
          ? "w-full max-w-md"
          : "w-[76vw] max-w-[320px] sm:max-w-[360px] min-w-[260px] shrink-0"
      }`}
    >
      {/* 1. Top row: Rating Stars & Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <StarRating rating={review.rating} size="sm" readOnly />
        </div>
        <span className="text-[11px] sm:text-xs text-brand-text-muted font-normal whitespace-nowrap">
          {formatReviewDate(review.created_at)}
        </span>
      </div>

      {/* 2. Middle: Clamped Review Comment */}
      {review.comment ? (
        <p className="mt-2 text-xs sm:text-sm text-brand-text-secondary leading-relaxed line-clamp-2 sm:line-clamp-3 break-words [overflow-wrap:anywhere] min-w-0 max-w-full">
          "{review.comment}"
        </p>
      ) : null}
    </div>
  );
};

export const RecentReviewsMarquee: React.FC<RecentReviewsMarqueeProps> = ({
  userId,
  reviewCount,
}) => {
  const { data, isLoading, isError } = useSellerRecentReviews(userId, 5);
  const items = useMemo(() => data?.items || [], [data?.items]);

  const trackRef = useRef<HTMLDivElement>(null);
  const setARef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

  // Web Animations API Motion Engine:
  // Normal Motion: ~24 px/sec
  // Reduced Motion: ~9 px/sec (gentle slow continuous drift)
  useEffect(() => {
    const track = trackRef.current;
    const setA = setARef.current;

    // Only animate when 2+ reviews exist
    if (!track || !setA || items.length < 2) {
      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }
      return;
    }

    const startAnimation = () => {
      if (!track || !setA) return;

      const sequenceWidth = setA.getBoundingClientRect().width;
      if (sequenceWidth <= 0) return;

      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Speed selection: 24 px/s for normal, 9 px/s for reduced motion
      const targetPxPerSecond = prefersReducedMotion ? 60 : 60;
      const durationMs = Math.max(4000, (sequenceWidth / targetPxPerSecond) * 1000);

      // Web Animations API: translate from -sequenceWidth px to 0px (RIGHTWARD motion)
      const anim = track.animate(
        [
          { transform: `translate3d(-${sequenceWidth}px, 0, 0)` },
          { transform: "translate3d(0px, 0, 0)" },
        ],
        {
          duration: durationMs,
          iterations: Infinity,
          easing: "linear",
        }
      );

      animRef.current = anim;
    };

    // Initial start
    startAnimation();

    // Listen for resize changes to keep distance & speed exact
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        startAnimation();
      });
      ro.observe(setA);
    }

    // Listen for live prefers-reduced-motion media query changes
    let mediaQuery: MediaQueryList | null = null;
    const handleMediaChange = () => {
      startAnimation();
    };

    if (typeof window !== "undefined" && window.matchMedia) {
      mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    // Cleanup on unmount or items change
    return () => {
      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }
      if (ro) {
        ro.disconnect();
      }
      if (mediaQuery) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
    };
  }, [items]);

  // 0 Reviews or loading/error
  if (reviewCount === 0 || isLoading || isError || items.length === 0) {
    return null;
  }

  // Exactly 1 Review: Render static card (no conveyor animation, no duplicate DOM)
  if (items.length === 1) {
    const singleReview = items[0];
    if (!singleReview) return null;

    return (
      <section className="recent-review-marquee-container rounded-2xl border border-brand-border bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span>Đánh giá gần đây</span>
        </div>
        <div>
          <ConveyorCard review={singleReview} isStatic />
        </div>
      </section>
    );
  }

  return (
    <section className="recent-review-marquee-container rounded-2xl border border-brand-border bg-white p-4 sm:p-5 shadow-xs space-y-3 overflow-hidden">
      {/* Section Title */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span>Đánh giá gần đây</span>
        </div>
        <span className="text-[11px] text-brand-text-muted">
          {items.length} nhận xét mới nhất
        </span>
      </div>

      {/* Conveyor Viewport with subtle edge gradient masks */}
      <div className="relative overflow-hidden w-full py-0.5">
        {/* Subtle left & right edge masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 sm:w-8 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Rightward moving conveyor track */}
        <div
          ref={trackRef}
          className="recent-review-marquee-track flex w-max"
          style={{
            display: "flex",
            width: "max-content",
            willChange: "transform",
            touchAction: "pan-y",
          }}
        >
          {/* Sequence A: Semantic primary set */}
          <div
            ref={setARef}
            className="flex items-stretch gap-3 shrink-0 pr-3"
          >
            {items.map((rev, idx) => (
              <ConveyorCard
                key={`primary-rev-${idx}-${rev.created_at}`}
                review={rev}
              />
            ))}
          </div>

          {/* Sequence B: Visual duplicate for seamless infinite loop (hidden from assistive tech) */}
          <div
            aria-hidden="true"
            className="flex items-stretch gap-3 shrink-0 pr-3"
          >
            {items.map((rev, idx) => (
              <ConveyorCard
                key={`duplicate-rev-${idx}-${rev.created_at}`}
                review={rev}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
