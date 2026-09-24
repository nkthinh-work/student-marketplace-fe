import React, { useRef, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSubmitFeedback } from '../hooks';
import {
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Send,
  Video as VideoIcon,
  X,
} from 'lucide-react';

interface FeedbackFormProps {
  onSubmitted?: () => void;
  onSuccessToast?: (msg: string) => void;
}

interface SelectedImage {
  file: File;
  previewUrl: string;
}

interface SelectedVideo {
  file: File;
  previewUrl: string;
}

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE_BYTES = 30 * 1024 * 1024; // 30MB

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSubmitted,
  onSuccessToast,
}) => {
  const { firebaseUser } = useAuth();
  const submitMutation = useSubmitFeedback();

  const [content, setContent] = useState<string>('');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [video, setVideo] = useState<SelectedVideo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    if (onSuccessToast) {
      onSuccessToast(msg);
    } else {
      setLocalToast(msg);
      setTimeout(() => setLocalToast(null), 4000);
    }
  };

  const cleanupMediaUrls = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    const newImages: SelectedImage[] = [];

    for (const f of filesToAdd) {
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        setErrorMsg(`Ảnh "${f.name}" vượt quá dung lượng tối đa 10MB.`);
        return;
      }
      newImages.push({
        file: f,
        previewUrl: URL.createObjectURL(f),
      });
    }

    setImages((prev) => [...prev, ...newImages]);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const f = files[0];
    if (!f) return;

    if (f.size > MAX_VIDEO_SIZE_BYTES) {
      setErrorMsg(`Video "${f.name}" vượt quá dung lượng tối đa 30MB.`);
      return;
    }

    if (video) {
      URL.revokeObjectURL(video.previewUrl);
    }

    setVideo({
      file: f,
      previewUrl: URL.createObjectURL(f),
    });

    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
      setVideo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = content.trim();
    if (trimmed.length < 5) {
      setErrorMsg('Vui lòng nhập nội dung ít nhất 5 ký tự.');
      return;
    }

    const formData = new FormData();
    formData.append('content', trimmed);
    images.forEach((img) => {
      formData.append('images', img.file);
    });
    if (video) {
      formData.append('video', video.file);
    }

    try {
      await submitMutation.mutateAsync(formData);
      cleanupMediaUrls();
      setContent('');
      setImages([]);
      setVideo(null);
      showToast('Cảm ơn bạn đã gửi Feedback 💛');
      onSubmitted?.();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : err?.message || 'Không thể gửi phản hồi.';
      setErrorMsg(message);
    }
  };

  if (!firebaseUser) {
    const handleLoginPrompt = () => {
      const authCard = document.getElementById('auth-card');
      if (authCard) {
        authCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const headerBtn = document.getElementById('header-profile-btn');
        headerBtn?.click();
      }
    };

    return (
      <div className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5 shadow-xs text-center space-y-2">
        <h3 className="text-sm sm:text-base font-bold text-brand-text">
          Đóng góp ý kiến cho Chợ PTITers
        </h3>
        <p className="text-xs text-brand-text-muted max-w-sm mx-auto">
          Vui lòng đăng nhập để gửi góp ý hoặc báo cáo lỗi cho bọn mình.
        </p>
        <button
          type="button"
          onClick={handleLoginPrompt}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          Đăng nhập để gửi Feedback
        </button>
      </div>
    );
  }

  const isSubmitting = submitMutation.isPending;
  const isContentValid = content.trim().length >= 5;

  return (
    <div className="relative rounded-2xl border border-brand-border bg-white p-3.5 sm:p-4 shadow-xs">
      {/* Local Toast if needed */}
      {localToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>{localToast}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="feedback-content"
            className="text-xs sm:text-sm font-bold text-brand-text"
          >
            Feedback của bạn
          </label>
          <span className="text-[11px] text-brand-text-muted">
            {content.trim().length} / 500
          </span>
        </div>

        {/* Textarea: 2-3 visible rows */}
        <textarea
          id="feedback-content"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          disabled={isSubmitting}
          placeholder="Gặp lỗi hay có điều gì chưa ổn? Mô tả chi tiết để bọn mình khắc phục nhé..."
          className="w-full resize-none rounded-xl border border-brand-border bg-brand-soft-pink/30 p-2.5 text-base sm:text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:border-brand-burgundy focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-burgundy transition-all"
        />

        {/* Media Attachments Preview */}
        {(images.length > 0 || video) && (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative h-14 w-14 rounded-lg border border-brand-border overflow-hidden bg-gray-100 flex-shrink-0 group"
              >
                <img
                  src={img.previewUrl}
                  alt={`Preview ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  disabled={isSubmitting}
                  className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black transition-colors"
                  aria-label="Xóa ảnh"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {video && (
              <div className="relative flex items-center gap-1.5 h-14 max-w-[200px] rounded-lg border border-brand-border bg-brand-soft-pink/40 px-2 py-1 flex-shrink-0">
                <VideoIcon className="h-5 w-5 text-brand-burgundy flex-shrink-0" />
                <div className="overflow-hidden text-[11px]">
                  <p className="truncate font-medium text-brand-text" title={video.file.name}>
                    {video.file.name}
                  </p>
                  <p className="text-brand-text-muted">
                    {(video.file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  disabled={isSubmitting}
                  className="ml-auto rounded-full bg-black/50 p-0.5 text-white hover:bg-black transition-colors"
                  aria-label="Xóa video"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Toolbar: + Ảnh, + Video, and Submit */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-brand-border/60">
          <div className="flex items-center gap-2">
            {/* Hidden inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImageChange}
              disabled={isSubmitting || images.length >= MAX_IMAGES}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleVideoChange}
              disabled={isSubmitting || Boolean(video)}
            />

            {/* Image button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isSubmitting || images.length >= MAX_IMAGES}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-soft-pink/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Tối đa 3 ảnh"
            >
              <ImageIcon className="h-3.5 w-3.5 text-brand-burgundy" />
              <span>+ Ảnh ({images.length}/{MAX_IMAGES})</span>
            </button>

            {/* Video button */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={isSubmitting || Boolean(video)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-soft-pink/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Tối đa 1 video ≤ 60s"
            >
              <VideoIcon className="h-3.5 w-3.5 text-brand-burgundy" />
              <span>+ Video {video ? '(1/1)' : ''}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!isContentValid || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Gửi Feedback</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-brand-text-muted">
          Tối đa 3 ảnh (≤10MB) và 1 video (≤30MB, ≤60 giây). Ảnh/video chỉ dùng làm minh chứng cho Admin kiểm tra.
        </p>
      </form>
    </div>
  );
};
