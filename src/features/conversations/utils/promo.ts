/**
 * User-scoped LocalStorage helpers for Community discovery promo card.
 * Key format: chat:community-promo-seen:{userId}
 */

export function getCommunityPromoSeen(
  userId?: number | string | null
): boolean {
  if (!userId) return false;
  try {
    return localStorage.getItem(`chat:community-promo-seen:${userId}`) === 'true';
  } catch {
    return false;
  }
}

export function markCommunityPromoSeen(
  userId?: number | string | null
): void {
  if (!userId) return;
  try {
    localStorage.setItem(`chat:community-promo-seen:${userId}`, 'true');
  } catch {
    // Ignore storage quota / access issues
  }
}
