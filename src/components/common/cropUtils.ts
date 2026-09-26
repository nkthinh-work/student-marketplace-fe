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

export interface CropDimensionsConfig {
  aspect: number;
  aspectRatioX: number;
  aspectRatioY: number;
  maxOutputWidth: number;
  maxOutputHeight: number;
  minOutputWidth: number;
  minOutputHeight: number;
  defaultFilenamePrefix?: string;
}

export const COMMUNITY_MOMENT_CROP_CONFIG: CropDimensionsConfig = {
  aspect: 16 / 9,
  aspectRatioX: 16,
  aspectRatioY: 9,
  maxOutputWidth: 1600,
  maxOutputHeight: 900,
  minOutputWidth: 320,
  minOutputHeight: 180,
  defaultFilenamePrefix: 'community-moment',
};

export const PRODUCT_IMAGE_CROP_CONFIG: CropDimensionsConfig = {
  aspect: 4 / 3,
  aspectRatioX: 4,
  aspectRatioY: 3,
  maxOutputWidth: 1200,
  maxOutputHeight: 900,
  minOutputWidth: 320,
  minOutputHeight: 240,
  defaultFilenamePrefix: 'product-image',
};

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
 * - Downscales large crops to config.maxOutputWidth x config.maxOutputHeight.
 * - Avoids unnecessary upscaling of lower-resolution crops while preserving exact aspect integer geometry.
 * - Fills opaque background before drawing to avoid black background artifacts on transparent PNGs.
 * - Detects actual generated Blob MIME and matches the filename extension (.webp, .jpg, .png).
 */
export async function createCroppedImageFile(
  imageSrc: string,
  cropPixels: CropAreaPixels,
  config: CropDimensionsConfig = COMMUNITY_MOMENT_CROP_CONFIG,
): Promise<CroppedImageResult> {
  const image = await loadImage(imageSrc);

  let targetWidth: number;
  let targetHeight: number;

  if (cropPixels.width >= config.maxOutputWidth) {
    targetWidth = config.maxOutputWidth;
    targetHeight = config.maxOutputHeight;
  } else {
    // Avoid upscaling: use largest divisible integer <= cropPixels.width, clamped to min threshold
    const stepWidth = Math.floor(cropPixels.width / config.aspectRatioX) * config.aspectRatioX;
    targetWidth = Math.max(config.minOutputWidth, stepWidth);
    targetHeight = Math.round((targetWidth * config.aspectRatioY) / config.aspectRatioX);
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
    targetHeight,
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
          0.92,
        );
      },
      'image/webp',
      0.92,
    );
  });

  const prefix = config.defaultFilenamePrefix || 'cropped-image';
  let filename = `${prefix}.jpg`;
  if (blob.type === 'image/webp') {
    filename = `${prefix}.webp`;
  } else if (blob.type === 'image/png') {
    filename = `${prefix}.png`;
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
