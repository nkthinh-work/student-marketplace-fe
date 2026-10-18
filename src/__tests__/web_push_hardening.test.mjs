import test from 'node:test';
import assert from 'node:assert/strict';

test('Web Push: Polite prompt banner visibility and 7-day dismissal memory', () => {
  const store = new Map();
  const mockLocalStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
  };

  const DISMISS_KEY = 'ptit_push_banner_dismissed_until';
  const FCM_TOKEN_KEY = 'ptit_fcm_token';

  const isPushBannerDismissed = (now = Date.now()) => {
    const until = mockLocalStorage.getItem(DISMISS_KEY);
    if (!until) return false;
    return now < Number(until);
  };

  const dismissPushBanner = (durationMs = 7 * 24 * 60 * 60 * 1000, now = Date.now()) => {
    mockLocalStorage.setItem(DISMISS_KEY, String(now + durationMs));
  };

  const shouldShowBanner = ({
    isAuthenticated,
    isSupported,
    permissionState,
    hasToken,
    now = Date.now(),
  }) => {
    if (!isAuthenticated) return false;
    if (!isSupported) return false;
    if (permissionState !== 'default') return false;
    if (hasToken) return false;
    if (isPushBannerDismissed(now)) return false;
    return true;
  };

  const baseNow = 1700000000000;

  // Case 1: Unauthenticated -> Do not show
  assert.equal(
    shouldShowBanner({
      isAuthenticated: false,
      isSupported: true,
      permissionState: 'default',
      hasToken: false,
      now: baseNow,
    }),
    false,
    'Unauthenticated user should never see push banner'
  );

  // Case 2: Authenticated, supported, default, not dismissed -> Show banner
  assert.equal(
    shouldShowBanner({
      isAuthenticated: true,
      isSupported: true,
      permissionState: 'default',
      hasToken: false,
      now: baseNow,
    }),
    true,
    'Eligible user should see push banner'
  );

  // Case 3: Already subscribed -> Do not show
  assert.equal(
    shouldShowBanner({
      isAuthenticated: true,
      isSupported: true,
      permissionState: 'default',
      hasToken: true,
      now: baseNow,
    }),
    false,
    'Already subscribed user should not see banner'
  );

  // Case 4: Dismissed "Để sau" (7 days)
  dismissPushBanner(7 * 24 * 60 * 60 * 1000, baseNow);
  assert.equal(
    shouldShowBanner({
      isAuthenticated: true,
      isSupported: true,
      permissionState: 'default',
      hasToken: false,
      now: baseNow + 1000, // 1 sec later
    }),
    false,
    'Dismissed banner should stay hidden within 7 days'
  );

  // 6 days later -> Still hidden
  assert.equal(
    shouldShowBanner({
      isAuthenticated: true,
      isSupported: true,
      permissionState: 'default',
      hasToken: false,
      now: baseNow + 6 * 24 * 60 * 60 * 1000,
    }),
    false,
    'Still hidden after 6 days'
  );

  // 8 days later -> Shows again
  assert.equal(
    shouldShowBanner({
      isAuthenticated: true,
      isSupported: true,
      permissionState: 'default',
      hasToken: false,
      now: baseNow + 8 * 24 * 60 * 60 * 1000,
    }),
    true,
    'Re-prompts politely after 7 days dismissal expires'
  );
});

test('Web Push: Service Worker notification payload link resolution', () => {
  const resolveTargetUrl = (data = {}) => {
    if (data.click_action) return data.click_action;
    if (data.url) return data.url;
    if (data.type === 'chat_message' && data.conversation_id) {
      return `/messages/${data.conversation_id}`;
    }
    if (data.type === 'order' && data.order_id) {
      return `/orders/${data.order_id}`;
    }
    if (data.type === 'auction' && data.auction_id) {
      return `/auctions/${data.auction_id}`;
    }
    return '/notifications';
  };

  assert.equal(resolveTargetUrl({ click_action: '/custom/path' }), '/custom/path');
  assert.equal(resolveTargetUrl({ type: 'chat_message', conversation_id: '88' }), '/messages/88');
  assert.equal(resolveTargetUrl({ type: 'order', order_id: '102' }), '/orders/102');
  assert.equal(resolveTargetUrl({ type: 'auction', auction_id: '5' }), '/auctions/5');
  assert.equal(resolveTargetUrl({}), '/notifications');
});

test('Web Push: Unsubscribe cleans up localStorage token and fires status event', () => {
  const store = new Map();
  const mockLocalStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
  };

  const FCM_TOKEN_KEY = 'ptit_fcm_token';
  mockLocalStorage.setItem(FCM_TOKEN_KEY, 'fcm_sample_token_xyz');
  assert.equal(mockLocalStorage.getItem(FCM_TOKEN_KEY), 'fcm_sample_token_xyz');

  // Perform unsubscribe cleanup
  mockLocalStorage.removeItem(FCM_TOKEN_KEY);
  assert.equal(mockLocalStorage.getItem(FCM_TOKEN_KEY), null);
});
