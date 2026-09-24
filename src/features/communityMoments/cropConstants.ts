/**
 * Canonical Hero dimensions and aspect ratio constants.
 *
 * Aspect ratio is strictly 16:9 (standard landscape).
 * All output dimensions are exact integer multiples of 16:9 to guarantee zero rounding distortion.
 */

// Canonical 16:9 ratio
export const HERO_ASPECT_RATIO = 16 / 9;

// Max target output dimensions (exact 16:9)
export const HERO_CROP_OUTPUT_WIDTH = 1600;
export const HERO_CROP_OUTPUT_HEIGHT = 900; // 1600 * 9 / 16 = 900 exact

// Practical minimum crop dimensions to avoid extreme pixelation (exact 16:9)
export const HERO_CROP_MIN_WIDTH = 320;
export const HERO_CROP_MIN_HEIGHT = 180; // 320 * 9 / 16 = 180 exact
