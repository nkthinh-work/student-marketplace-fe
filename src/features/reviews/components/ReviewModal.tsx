import React, { useState, useEffect } from "react";
import { X, Loader2, ShieldCheck } from "lucide-react";
import { StarRating } from "./StarRating";
import { useCreateOrderReview, useUpdateOrderReview } from "../hooks";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  sellerName?: string;
  initialData?: {
    rating: number;
    comment: string | null;
  } | null;
  onSuccess?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Rất không hài lòng",
  2: "Không hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Rất hài lòng & tin cậy",
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  sellerName = "người bán",
  initialData,
  onSuccess,
}) => {
  const isEditing = Boolean(initialData);
  const [rating, setRating] = useState<number>(initialData?.rating || 5);
  const [comment, setComment] = useState<string>(initialData?.comment || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useCreateOrderReview(orderId);
  const updateMutation = useUpdateOrderReview(orderId);

  useEffect(() => {
    if (isOpen) {
      setRating(initialData?.rating || 5);
      setComment(initialData?.comment || "");
      setErrorMsg(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rating < 1 || rating > 5) {
      setErrorMsg("Vui lòng chọn số sao đánh giá (1 đến 5 sao).");
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          rating,
          comment: comment.trim() ? comment.trim() : null,
        });
      } else {
        await createMutation.mutateAsync({
          rating,
          comment: comment.trim() ? comment.trim() : null,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : "Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-brand-warm-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-brand-border my-8 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div>
            <h3 className="text-lg font-black text-brand-text">
              {isEditing ? "Chỉnh sửa đánh giá" : "Đánh giá người bán"}
            </h3>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Giao dịch với <span className="font-medium text-brand-text">{sellerName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-brand-text-muted hover:text-brand-text rounded-full hover:bg-brand-soft-pink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          {/* Star Picker Section */}
          <div className="flex flex-col items-center justify-center py-3.5 px-4 bg-amber-50/70 rounded-2xl border border-amber-200/70">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
              Trải nghiệm giao dịch
            </span>
            <StarRating
              rating={rating}
              onChange={setRating}
              size="lg"
              className="py-1"
            />
            <span className="text-sm font-semibold text-amber-800 mt-2 h-5">
              {RATING_LABELS[rating] || "Chọn mức độ hài lòng"}
            </span>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="review-comment"
                className="text-xs font-bold uppercase tracking-wider text-brand-text-muted"
              >
                Nhận xét chi tiết (tùy chọn)
              </label>
              <span className="text-xs text-brand-text-muted">
                {comment.length}/1000
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm về thái độ người bán, tình trạng hàng nhận được hoặc độ đúng giờ khi giao dịch..."
              className="w-full px-4 py-3 rounded-2xl border border-brand-border bg-white text-brand-text placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-burgundy/40 focus:border-brand-burgundy text-sm resize-none transition-shadow"
            />
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Đánh giá của bạn sẽ hiển thị với huy hiệu <span className="font-semibold text-emerald-900">✓ Người mua đã xác minh</span> và không hiển thị thông tin danh tính cá nhân trên trang công khai để bảo vệ quyền riêng tư sinh viên.
            </p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-2xl border border-brand-border text-sm font-bold text-brand-text hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy-dark active:scale-[0.99] text-white text-sm font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 min-w-[130px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : isEditing ? (
                "Lưu thay đổi"
              ) : (
                "Gửi đánh giá"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
