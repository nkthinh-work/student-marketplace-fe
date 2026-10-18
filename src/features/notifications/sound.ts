/**
 * In-App Notification Sound Controller
 *
 * Implements subtle Web Audio chime, browser autoplay unlock,
 * localStorage user preference, active conversation suppression,
 * and burst cooldown.
 */

const STORAGE_KEY = 'ptit_notification_sound_enabled';
const CHAT_COOLDOWN_MS = 3500;
const GENERAL_COOLDOWN_MS = 1000;

// Centralized state
let audioCtx: AudioContext | null = null;
let isUnlocked = false;
let lastGeneralPlayTime = 0;
const conversationCooldownMap = new Map<string | number, number>();

/**
 * Get the current AudioContext, initializing it lazily.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  return audioCtx;
}

/**
 * Unlock AudioContext on first user interaction (browser autoplay policy compliance).
 */
function unlockAudioContext() {
  if (isUnlocked || typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isUnlocked = true;
      removeUnlockListeners();
    }).catch(() => {
      // Ignore failure, will retry on next user gesture
    });
  } else if (ctx.state === 'running') {
    isUnlocked = true;
    removeUnlockListeners();
  }
}

function removeUnlockListeners() {
  if (typeof window === 'undefined') return;
  window.removeEventListener('click', unlockAudioContext, true);
  window.removeEventListener('keydown', unlockAudioContext, true);
  window.removeEventListener('touchstart', unlockAudioContext, true);
}

// Attach unlock listeners immediately on client
if (typeof window !== 'undefined') {
  window.addEventListener('click', unlockAudioContext, true);
  window.addEventListener('keydown', unlockAudioContext, true);
  window.addEventListener('touchstart', unlockAudioContext, true);
}

/**
 * Check if notification sound is enabled in user preferences (localStorage).
 * Defaults to true.
 */
export function getNotificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

/**
 * Set user notification sound preference in localStorage.
 */
export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    // Dispatch event so UI toggles synchronize seamlessly
    window.dispatchEvent(new CustomEvent('ptit_sound_preference_changed', { detail: { enabled } }));
  } catch {
    // ignore quota/storage errors
  }
}

/**
 * Determine if user is actively viewing a specific conversation.
 * If window has focus, document is visible, and the active conversation matches,
 * chat sound should be suppressed.
 */
export function isConversationActive(conversationId: number | string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const isDocVisible = !document.hidden;
  const isDocFocused = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
  if (!isDocVisible || !isDocFocused) return false;

  const pathname = window.location.pathname;
  const targetIdStr = String(conversationId);

  // Check URL routes: /messages/{id} or /messages?c={id}
  if (pathname === `/messages/${targetIdStr}`) {
    return true;
  }

  if (pathname === '/messages' || pathname.startsWith('/messages')) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('c') === targetIdStr) {
      return true;
    }
  }

  return false;
}

/**
 * Synthesize a short, gentle chime using the Web Audio API.
 * Uses a soft two-tone harmonic envelope (E5 659Hz -> B5 987Hz) with exponential decay.
 */
function playChimeInternal(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: 659.25 Hz (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // subtle slide to G5

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.02); // soft attack
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28); // gentle decay

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2 (higher harmonic chime slightly delayed): 987.77 Hz (B5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(987.77, now + 0.08);

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.4);
  } catch (err) {
    // Fail silently without disrupting app runtime
    console.debug('Failed to play notification chime:', err);
  }
}

const MULTI_TAB_COOLDOWN_MS = 600;
const LAST_SOUND_STORAGE_KEY = 'ptit_last_sound_timestamp';

/**
 * Public notification sound player with policy checks:
 * - Preference enabled
 * - Multi-tab echo suppression
 * - Active conversation suppression
 * - Burst cooldown per conversation (3.5s) and general (1s)
 */
export function playNotificationSound(options?: {
  conversationId?: number | string | null;
  isChatMessage?: boolean;
}): boolean {
  try {
    if (!getNotificationSoundEnabled()) {
      return false;
    }

    const now = Date.now();

    // Multi-tab sound echo suppression: prevent simultaneous chimes across multiple open tabs
    if (typeof localStorage !== 'undefined') {
      try {
        const lastGlobalPlay = Number(localStorage.getItem(LAST_SOUND_STORAGE_KEY) || 0);
        if (now - lastGlobalPlay < MULTI_TAB_COOLDOWN_MS) {
          return false;
        }
        localStorage.setItem(LAST_SOUND_STORAGE_KEY, String(now));
      } catch {
        // ignore localStorage access limitations
      }
    }

    const convId = options?.conversationId;
    const isChat = options?.isChatMessage ?? Boolean(convId);

    if (isChat && convId) {
      // Check active suppression
      if (isConversationActive(convId)) {
        return false;
      }

      // Check per-conversation cooldown
      const lastConvTime = conversationCooldownMap.get(convId) || 0;
      if (now - lastConvTime < CHAT_COOLDOWN_MS) {
        return false;
      }
      conversationCooldownMap.set(convId, now);
    } else {
      // General lifecycle notification cooldown
      if (now - lastGeneralPlayTime < GENERAL_COOLDOWN_MS) {
        return false;
      }
      lastGeneralPlayTime = now;
    }

    playChimeInternal();
    return true;
  } catch {
    // Never crash caller
    return false;
  }
}
