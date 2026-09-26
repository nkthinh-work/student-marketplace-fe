import React, { useState, useEffect, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Loader2, AlertCircle, X, Crop as CropIcon } from 'lucide-react';
import {
  type CropDimensionsConfig,
  createCroppedImageFile,
} from './cropUtils';

export interface ImageCropDialogProps {
  isOpen: boolean;
  file: File | null;
  config: CropDimensionsConfig;
  title?: string;
  stepInfo?: string;
  onConfirm: (croppedFile: File, previewUrl: string) => void;
  onCancel: () => void;
  onSkip?: () => void;
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  isOpen,
  file,
  config,
  title = 'Chọn vùng hiển thị ảnh',
  stepInfo,
  onConfirm,
  onCancel,
  onSkip,
}) => {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate and manage object URL for the source file
  useEffect(() => {
    if (!file) {
      setSourceUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, currentCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(currentCroppedAreaPixels);
    },
    [],
  );

  const handleConfirm = async () => {
    if (!sourceUrl || !croppedAreaPixels || isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      const result = await createCroppedImageFile(sourceUrl, croppedAreaPixels, config);
      onConfirm(result.file, result.previewUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xử lý cắt ảnh. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !file || !sourceUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-brand-border/60 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-brand-burgundy/10 text-brand-burgundy dark:bg-brand-burgundy/20">
              <CropIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-brand-text truncate">
                {title}
              </h3>
              {stepInfo && (
                <p className="text-[11px] text-brand-burgundy font-medium">
                  {stepInfo}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cropper Viewport */}
        <div className="relative p-4 flex-1 flex flex-col justify-center bg-stone-950/90 select-none">
          <div
            className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-stone-900 border border-stone-800"
            style={{ touchAction: 'none' }}
          >
            <Cropper
              image={sourceUrl}
              crop={crop}
              zoom={zoom}
              aspect={config.aspect}
              objectFit="contain"
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
                  '!border-2 !border-brand-burgundy/90 !shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] !rounded-lg',
              }}
            />
          </div>

          {/* Gesture Guidance (NO SLIDER) */}
          <div className="mt-3 text-center space-y-0.5 select-none">
            <p className="text-xs text-stone-300 font-medium">
              Kéo để di chuyển • Chụm 2 ngón tay hoặc cuộn chuột để thu phóng
            </p>
            <p className="text-[11px] text-stone-400">
              Khung hiển thị chuẩn tỉ lệ {config.aspectRatioX}:{config.aspectRatioY}
            </p>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-950/80 p-2.5 border border-red-800 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-brand-surface dark:bg-stone-900 border-t border-brand-border/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl border border-brand-border text-xs sm:text-sm font-semibold text-brand-text-secondary hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl border border-dashed border-brand-border text-xs sm:text-sm font-medium text-brand-text-muted hover:text-brand-text hover:bg-black/5 active:scale-95 transition-all disabled:opacity-50"
              >
                Bỏ qua
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || isProcessing}
            className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 min-h-[38px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Dùng ảnh này</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
