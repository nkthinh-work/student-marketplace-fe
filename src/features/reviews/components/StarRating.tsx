import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  showValue?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  onChange,
  size = "md",
  readOnly = false,
  showValue = false,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Đánh giá sao">
        {Array.from({ length: maxRating }, (_, i) => {
          const starNumber = i + 1;
          const isFilled = starNumber <= currentRating;

          if (readOnly) {
            return (
              <span key={starNumber} className="inline-block">
                <Star
                  className={`${starSizes[size]} ${
                    isFilled
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-stone-300"
                  } transition-colors`}
                />
              </span>
            );
          }

          return (
            <button
              key={starNumber}
              type="button"
              role="radio"
              aria-checked={rating === starNumber}
              aria-label={`${starNumber} sao`}
              onClick={() => onChange?.(starNumber)}
              onMouseEnter={() => setHoverRating(starNumber)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-burgundy hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                    : "fill-transparent text-stone-300"
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-semibold text-brand-text ml-1">
          {rating > 0 ? rating.toFixed(1) : "0.0"}
        </span>
      )}
    </div>
  );
};
