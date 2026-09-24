import {
  HERO_CROP_MIN_WIDTH,
  HERO_CROP_OUTPUT_HEIGHT,
  HERO_CROP_OUTPUT_WIDTH,
} from './cropConstants';

export interface CropAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedImageResult {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * Loads an image from a URL or Object URL into an HTMLImageElement.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = src;
  });
}

/**
 * Creates a cropped image File and preview URL from source image and pixel coordinates.
 *
 * Sizing policy:
 * - Downscales large crops to canonical HERO_CROP_OUTPUT_WIDTH (1600x900).
 * - Avoids unnecessary upscaling of lower-resolution crops while preserving exact 16:9 integer geometry.
 * - Fills opaque background before drawing to avoid black background artifacts on transparent PNGs.
 * - Detects actual generated Blob MIME and matches the filename extension (.webp, .jpg, .png).
 */
export async function createCroppedImageFile(
  imageSrc: string,
  cropPixels: CropAreaPixels
): Promise<CroppedImageResult> {
  const image = await loadImage(imageSrc);

  // Determine output dimensions respecting exact 16:9 integer ratio
  let targetWidth: number;
  let targetHeight: number;

  if (cropPixels.width >= HERO_CROP_OUTPUT_WIDTH) {
    targetWidth = HERO_CROP_OUTPUT_WIDTH;
    targetHeight = HERO_CROP_OUTPUT_HEIGHT;
  } else {
    // Avoid upscaling: use largest 16-divisible integer <= cropPixels.width, clamped to min threshold
    const stepWidth = Math.floor(cropPixels.width / 16) * 16;
    targetWidth = Math.max(HERO_CROP_MIN_WIDTH, stepWidth);
    targetHeight = Math.round((targetWidth * 9) / 16);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Không thể khởi tạo bộ xử lý ảnh (Canvas 2D context).');
  }

  // Safe opaque background for transparency / JPEG fallback
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw cropped slice
  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Attempt WebP first with quality 0.92, fallback to JPEG
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === 'image/webp') {
          resolve(webpBlob);
          return;
        }
        // Fallback to JPEG
        canvas.toBlob(
          (jpegBlob) => {
            if (jpegBlob) {
              resolve(jpegBlob);
            } else {
              reject(new Error('Không thể xuất tệp ảnh sau khi cắt.'));
            }
          },
          'image/jpeg',
          0.92
        );
      },
      'image/webp',
      0.92
    );
  });

  // Determine correct filename extension based on actual Blob MIME
  let filename = 'community-moment-cropped.jpg';
  if (blob.type === 'image/webp') {
    filename = 'community-moment-cropped.webp';
  } else if (blob.type === 'image/png') {
    filename = 'community-moment-cropped.png';
  }

  const file = new File([blob], filename, { type: blob.type });
  const previewUrl = URL.createObjectURL(blob);

  return {
    file,
    previewUrl,
    width: targetWidth,
    height: targetHeight,
  };
}
