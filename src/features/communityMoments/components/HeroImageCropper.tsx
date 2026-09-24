import React, { useCallback, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Loader2, AlertCircle } from 'lucide-react';
import { HERO_ASPECT_RATIO } from '../cropConstants';
import { createCroppedImageFile, type CroppedImageResult } from '../cropUtils';

export interface SavedCropState {
  crop: Point;
  zoom: number;
}

interface HeroImageCropperProps {
  imageSrc: string;
  initialCrop?: Point;
  initialZoom?: number;
  onConfirm: (result: CroppedImageResult, savedState: SavedCropState) => void;
  onChooseAnother: () => void;
  isSubmitting?: boolean;
}

export const HeroImageCropper: React.FC<HeroImageCropperProps> = ({
  imageSrc,
  initialCrop = { x: 0, y: 0 },
  initialZoom = 1,
  onConfirm,
  onChooseAnother,
  isSubmitting = false,
}) => {
  const [crop, setCrop] = useState<Point>(initialCrop);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, currentCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(currentCroppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels || isProcessing || isSubmitting) return;

    try {
      setIsProcessing(true);
      setError(null);

      const result = await createCroppedImageFile(imageSrc, croppedAreaPixels);
      onConfirm(result, { crop, zoom });
    } catch (err: any) {
      setError(
        err?.message || 'Không thể xử lý cắt ảnh. Vui lòng thử lại với ảnh khác.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Cropper Viewport Container with fixed aspect frame */}
      <div
        className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-stone-900 border border-brand-border/80 select-none"
        style={{ touchAction: 'none' }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={HERO_ASPECT_RATIO}
          objectFit="cover"
          restrictPosition={true}
          minZoom={1}
          maxZoom={3}
          zoomWithScroll={true}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          classes={{
            containerClassName: 'relative w-full h-full',
            cropAreaClassName:
              '!border-2 !border-brand-burgundy/80 !shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] !rounded-xl',
          }}
        />
      </div>

      {/* Subtle Mobile Gesture Guidance (NO ZOOM SLIDER) */}
      <div className="space-y-1 text-center select-none">
        <p className="text-xs text-brand-text-muted leading-tight">
          Kéo ảnh để chọn vùng hiển thị • Chụm 2 ngón tay để thu phóng
        </p>
        <p className="text-[11px] text-brand-text-muted/80 leading-tight">
          Khung hiển thị cố định 16:9.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-2.5 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Crop Controls */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onChooseAnother}
          disabled={isProcessing || isSubmitting}
          className="px-4 py-2 rounded-xl border border-brand-border text-xs sm:text-sm font-semibold text-brand-text-secondary hover:bg-black/5 active:scale-95 transition-all disabled:opacity-50 min-h-[42px]"
        >
          Chọn ảnh khác
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!croppedAreaPixels || isProcessing || isSubmitting}
          className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 min-h-[42px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <span>Xác nhận</span>
          )}
        </button>
      </div>
    </div>
  );
};
