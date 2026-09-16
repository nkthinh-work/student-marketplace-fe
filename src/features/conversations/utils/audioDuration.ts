/**
 * Authoritative duration formatter for voice messages and audio playback.
 * Strictly guards against NaN, Infinity, negative values, null, or undefined.
 * Returns "--:--" for invalid or non-finite values.
 */
export function formatAudioDuration(seconds?: number | null): string {
  if (
    seconds === undefined ||
    seconds === null ||
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return '--:--';
  }

  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
