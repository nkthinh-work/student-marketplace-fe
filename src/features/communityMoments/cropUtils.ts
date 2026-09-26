import {
  createCroppedImageFile as sharedCreateCroppedImageFile,
  COMMUNITY_MOMENT_CROP_CONFIG,
  type CropAreaPixels,
  type CroppedImageResult,
  loadImage,
} from '@/components/common/cropUtils';

export type { CropAreaPixels, CroppedImageResult };
export { loadImage };

/**
 * Creates a cropped image File and preview URL for Community Moments.
 * Delegates to the shared cropUtils engine with COMMUNITY_MOMENT_CROP_CONFIG (16:9, max 1600x900).
 */
export async function createCroppedImageFile(
  imageSrc: string,
  cropPixels: CropAreaPixels
): Promise<CroppedImageResult> {
  return sharedCreateCroppedImageFile(
    imageSrc,
    cropPixels,
    COMMUNITY_MOMENT_CROP_CONFIG
  );
}
