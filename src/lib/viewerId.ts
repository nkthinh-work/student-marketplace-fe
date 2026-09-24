/**
 * Anonymous Viewer Identification Utility (Phase 9B)
 * Generates and persists a random opaque UUID for anonymous product view deduplication.
 * - Key: 'ptiters-viewer-id'
 * - Validates UUID format.
 * - Handles private browsing / localStorage restrictions with an in-memory fallback.
 * - Strictly for 24h view deduplication; never used for authentication or authorization.
 */

const STORAGE_KEY = 'ptiters-viewer-id';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let memoryViewerId: string | null = null;

export function isValidViewerId(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getAnonymousViewerId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidViewerId(stored)) {
      memoryViewerId = stored;
      return stored;
    }
  } catch {
    // localStorage restricted or disabled
  }

  if (memoryViewerId && isValidViewerId(memoryViewerId)) {
    return memoryViewerId;
  }

  const newId = generateUUID();
  memoryViewerId = newId;

  try {
    localStorage.setItem(STORAGE_KEY, newId);
  } catch {
    // In-memory fallback retained
  }

  return newId;
}
