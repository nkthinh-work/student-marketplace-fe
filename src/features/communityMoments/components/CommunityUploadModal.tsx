import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Image as ImageIcon, Loader2, X, AlertCircle, Scissors } from 'lucide-react';
import { useSubmitCommunityMoment } from '../hooks';
import { HeroImageCropper, type SavedCropState } from './HeroImageCropper';
import type { CroppedImageResult } from '../cropUtils';

const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB source limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type ModalStep = 'PICK' | 'CROP' | 'PREVIEW';

interface CommunityUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const CommunityUploadModal: React.FC<CommunityUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [step, setStep] = useState<ModalStep>('PICK');
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [savedCropState, setSavedCropState] = useState<SavedCropState>({
    crop: { x: 0, y: 0 },
    zoom: 1,
  });
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const croppedUrlRef = useRef<string | null>(null);
  const selectionGenRef = useRef<number>(0);

  sourceUrlRef.current = sourceUrl;
  croppedUrlRef.current = croppedUrl;

  const submitMutation = useSubmitCommunityMoment();

  // Helper to revoke individual URLs safely
  const revokeSourceUrl = () => {
    if (sourceUrlRef.current) {
      URL.revokeObjectURL(sourceUrlRef.current);
      sourceUrlRef.current = null;
    }
  };

  const revokeCroppedUrl = () => {
    if (croppedUrlRef.current) {
      URL.revokeObjectURL(croppedUrlRef.current);
      croppedUrlRef.current = null;
    }
  };

  const cleanupAllMedia = () => {
    revokeSourceUrl();
    revokeCroppedUrl();
    setSourceUrl(null);
    setCroppedFile(null);
    setCroppedUrl(null);
    setSavedCropState({ crop: { x: 0, y: 0 }, zoom: 1 });
    setStep('PICK');
    setErrorMessage(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      revokeSourceUrl();
      revokeCroppedUrl();
    };
  }, []);

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      cleanupAllMedia();
      setNote('');
    }
  }, [isOpen]);

  // Robust scroll-preserving body lock
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitMutation.isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitMutation.isPending, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(
        `Định dạng tệp "${file.name}" không được hỗ trợ. Vui lòng chọn ảnh JPEG, PNG hoặc WebP.`
      );
      return;
    }

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      setErrorMessage(
        `Dung lượng ảnh vượt quá giới hạn 10MB. Vui lòng chọn ảnh nhẹ hơn.`
      );
      return;
    }

    // Race-condition guard: increment generation counter
    const currentGen = ++selectionGenRef.current;

    // Revoke previous URLs before creating fresh ones
    revokeSourceUrl();
    revokeCroppedUrl();

    const newSourceUrl = URL.createObjectURL(file);

    // Verify race condition: only apply if this is still the active generation
    if (currentGen !== selectionGenRef.current) {
      URL.revokeObjectURL(newSourceUrl);
      return;
    }

    setSourceUrl(newSourceUrl);
    setCroppedFile(null);
    setCroppedUrl(null);
    setSavedCropState({ crop: { x: 0, y: 0 }, zoom: 1 });
    setStep('CROP');
  };

  const handleChooseAnother = () => {
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const handleCropConfirm = (result: CroppedImageResult, savedState: SavedCropState) => {
    // Revoke prior cropped URL if any, but KEEP sourceUrl alive for "Cắt lại"
    revokeCroppedUrl();

    setCroppedFile(result.file);
    setCroppedUrl(result.previewUrl);
    setSavedCropState(savedState);
    setStep('PREVIEW');
  };

  const handleRecrop = () => {
    // Revoke cropped preview URL, keep sourceUrl intact
    revokeCroppedUrl();
    setCroppedFile(null);
    setCroppedUrl(null);
    setStep('CROP');
  };

  const handleSubmit = async () => {
    if (!croppedFile) {
      setErrorMessage('Vui lòng hoàn tất cắt ảnh trước khi gửi.');
      return;
    }

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setErrorMessage('Vui lòng nhập lời nhắn ghi lại khoảnh khắc (1-80 ký tự).');
      return;
    }

    if (trimmedNote.length > 80) {
      setErrorMessage('Lời nhắn không được vượt quá 80 ký tự.');
      return;
    }

    try {
      setErrorMessage(null);
      // AUTHORITATIVE: Only croppedFile is transmitted; sourceFile is never uploaded
      await submitMutation.mutateAsync({ file: croppedFile, note: trimmedNote });

      cleanupAllMedia();
      setNote('');
      onClose();
      onSuccessToast?.(
        'Đã gửi ảnh khoảnh khắc. Ảnh sẽ được quản trị viên duyệt trước khi hiển thị trên trang chủ.'
      );
    } catch (err: any) {
      const errorData = err?.response?.data?.detail;
      if (errorData && typeof errorData === 'object' && errorData.code === 'COMMUNITY_MOMENT_PENDING') {
        setErrorMessage(errorData.message || 'Bạn đã có một ảnh đang chờ duyệt.');
      } else if (typeof errorData === 'string') {
        setErrorMessage(errorData);
      } else {
        setErrorMessage('Không thể gửi ảnh lúc này. Vui lòng thử lại sau.');
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="community-modal-title"
    >
      {/* Background click overlay */}
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        onClick={() => !submitMutation.isPending && onClose()}
        aria-label="Đóng bảng chia sẻ"
      />

      {/* Modal / Sheet Card */}
      <div className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-brand-warm-white p-4 sm:p-6 shadow-2xl border border-brand-border/80 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft-pink text-brand-burgundy">
              <Camera className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="community-modal-title"
                className="text-base sm:text-lg font-bold text-brand-text truncate"
              >
                {step === 'CROP' ? 'Chọn vùng hiển thị' : 'Chia sẻ ảnh lên Hero'}
              </h2>
              <p className="text-xs text-brand-text-muted mt-0.5 leading-tight">
                {step === 'CROP'
                  ? 'Khung hiển thị cố định 16:9'
                  : 'Ảnh sẽ xuất hiện trên banner Trang chủ sau khi được duyệt'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitMutation.isPending}
            className="icon-btn-interactive -mr-1 -mt-1 p-1.5 rounded-full text-brand-text-muted hover:text-brand-text hover:bg-black/5 transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Content Body */}
        <div className="py-3 space-y-3 overflow-y-auto">
          {/* STEP 1: PICK IMAGE */}
          {step === 'PICK' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">
                  Chia sẻ ảnh lên banner Trang chủ
                </p>
                <p className="text-amber-800/90 leading-relaxed">
                  Ảnh sẽ xuất hiện trên banner Trang chủ sau khi được duyệt. Nên chọn ảnh ngang tỷ lệ 16:9 để hiển thị đẹp nhất.
                </p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-border hover:border-brand-burgundy/60 bg-brand-soft-pink/30 hover:bg-brand-soft-pink/50 p-7 sm:p-8 transition-colors text-center"
              >
                <div className="h-12 w-12 rounded-full bg-brand-soft-pink flex items-center justify-center text-brand-burgundy mb-2 group-hover:scale-105 transition-transform">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-brand-text">
                  Chọn ảnh khoảnh khắc
                </p>
                <p className="text-xs text-brand-text-muted mt-1">
                  Ưu tiên ảnh ngang 16:9 để hiển thị đẹp trên banner Trang chủ.
                </p>
                <span className="mt-3 inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-brand-burgundy text-white text-xs font-semibold shadow-xs group-hover:bg-brand-burgundy-dark transition-colors">
                  Chọn ảnh
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: CROP IMAGE */}
          {step === 'CROP' && sourceUrl && (
            <HeroImageCropper
              imageSrc={sourceUrl}
              initialCrop={savedCropState.crop}
              initialZoom={savedCropState.zoom}
              onConfirm={handleCropConfirm}
              onChooseAnother={handleChooseAnother}
              isSubmitting={submitMutation.isPending}
            />
          )}

          {/* STEP 3: PREVIEW ACTUAL CROPPED BLOB + NOTE INPUT */}
          {step === 'PREVIEW' && croppedUrl && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Actual Cropped Output Preview (Exact 16:9 ratio) */}
              <div className="space-y-1.5">
                <div className="relative rounded-2xl overflow-hidden border border-brand-border/80 aspect-video bg-black/5 shadow-xs">
                  <img
                    src={croppedUrl}
                    alt="Xem trước ảnh Hero đã cắt"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-brand-text-muted font-medium">
                    Ảnh sẽ hiển thị theo khung 16:9 này sau khi được duyệt.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRecrop}
                      disabled={submitMutation.isPending}
                      className="text-xs font-semibold text-brand-burgundy hover:underline flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-brand-soft-pink/60 transition-colors"
                    >
                      <Scissors className="h-3.5 w-3.5" />
                      <span>Cắt lại</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleChooseAnother}
                      disabled={submitMutation.isPending}
                      className="text-xs font-semibold text-brand-text-secondary hover:underline py-1 px-2 rounded-lg hover:bg-black/5 transition-colors"
                    >
                      Chọn ảnh khác
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="moment-note-input" className="font-semibold text-brand-text">
                    Ghi lại khoảnh khắc
                  </label>
                  <span className={note.trim().length > 80 ? 'text-red-500 font-medium' : 'text-brand-text-muted'}>
                    {note.length} / 80
                  </span>
                </div>
                <input
                  id="moment-note-input"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  maxLength={80}
                  placeholder="Ví dụ: Nhận được giáo trình trước giờ lên lớp 😆"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-white text-base md:text-sm text-brand-text placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy transition-all"
                  disabled={submitMutation.isPending}
                />
              </div>

              <p className="text-[11px] text-brand-text-muted text-center leading-relaxed">
                Quản trị viên sẽ kiểm tra ảnh trước khi hiển thị trên Trang chủ.
              </p>
            </div>
          )}

          {/* Global Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 border border-red-200 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions (Only shown on PICK and PREVIEW steps) */}
        {step !== 'CROP' && (
          <div className="pt-3 border-t border-brand-border/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitMutation.isPending}
              className="px-4 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm font-semibold text-brand-text-secondary hover:bg-black/5 active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
            >
              Hủy
            </button>

            {step === 'PREVIEW' && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!croppedFile || !note.trim() || note.trim().length > 80 || submitMutation.isPending}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi ảnh chờ duyệt</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
