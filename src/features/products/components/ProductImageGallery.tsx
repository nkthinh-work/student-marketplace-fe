import { useState } from 'react';
import type { ProductImageResponse } from '../types';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ProductImageGalleryProps {
  images: ProductImageResponse[];
  title: string;
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  // Sort images by sort_order
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  // Default to thumbnail or first image
  const thumbnailIndex = sortedImages.findIndex((img) => img.is_thumbnail);
  const [selectedIndex, setSelectedIndex] = useState(
    thumbnailIndex !== -1 ? thumbnailIndex : 0,
  );

  if (sortedImages.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-brand-soft-pink flex items-center justify-center text-brand-text-muted border border-brand-border">
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="h-12 w-12 stroke-1" />
          <span className="text-xs">Chưa có ảnh sản phẩm</span>
        </div>
      </div>
    );
  }

  const currentImage = sortedImages[selectedIndex] || sortedImages[0];
  if (!currentImage) return null;

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Main Image Display */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-black/5 border border-brand-border shadow-card">
        <img
          src={currentImage.detail_url || currentImage.image_url}
          alt={`${title} - ảnh ${selectedIndex + 1}`}
          className="h-full w-full object-contain bg-brand-soft-pink/30 transition-all duration-300"
        />

        {/* Navigation Buttons (if > 1 image) */}
        {sortedImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="icon-btn-interactive absolute left-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-brand-text shadow-md hover:bg-white"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="icon-btn-interactive absolute right-2.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-brand-text shadow-md hover:bg-white"
              aria-label="Ảnh kế tiếp"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Counter Badge */}
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              {selectedIndex + 1} / {sortedImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip (if > 1 image) */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
          {sortedImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.image_id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-brand-burgundy ring-2 ring-brand-burgundy/20 scale-105 shadow-sm'
                    : 'border-brand-border/80 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.image_url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                {img.is_thumbnail && (
                  <span className="absolute bottom-0 inset-x-0 bg-brand-burgundy/90 text-[8px] font-bold text-white text-center py-0.5 leading-none">
                    Chính
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
