import React from "react";
import { CheckCircle2 } from "lucide-react";
import { StarRating } from "./StarRating";
import type { PublicSellerReviewItem } from "../types";

interface ReviewCardProps {
  review: PublicSellerReviewItem;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs space-y-3">
      {/* Top row: Badges + Stars + Date */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {review.verified_transaction && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/60 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Người mua đã xác minh
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} size="sm" readOnly />
          </div>
        </div>

        <span className="text-xs text-brand-text-muted whitespace-nowrap shrink-0">
          {formatRelativeTime(review.created_at)}
        </span>
      </div>

      {/* Review Comment Content */}
      {review.comment ? (
        <p className="text-xs sm:text-sm text-brand-text-secondary whitespace-pre-line leading-relaxed break-words [overflow-wrap:anywhere] min-w-0">
          "{review.comment}"
        </p>
      ) : (
        <p className="text-xs italic text-brand-text-muted">
          (Người mua không để lại nhận xét chi tiết)
        </p>
      )}
    </div>
  );
};
