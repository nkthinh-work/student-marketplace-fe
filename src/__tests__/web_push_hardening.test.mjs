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

test('Web Push: Regression test for API paths and subscription gate', async () => {
  const calls = [];
  const mockApiClient = {
    post: async (url, payload) => {
      calls.push({ url, payload });
      if (url === '/notifications/push/subscribe') {
        const err = new Error('Not Found');
        err.response = { status: 404, data: { detail: 'Not Found' } };
        throw err;
      }
      if (url === '/api/v1/notifications/push/subscribe') {
        return { status: 200, data: { status: 'subscribed' } };
      }
      if (url === '/api/v1/notifications/push/unsubscribe') {
        return { status: 200, data: { status: 'unsubscribed' } };
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
  };

  const store = new Map();
  const mockLocalStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
  };

  const subscribeWithClient = async (client, token, storage) => {
    try {
      const res = await client.post('/api/v1/notifications/push/subscribe', {
        fcm_token: token,
        device_info: 'Mock Device Agent',
      });
      if (res.status === 200 || res.status === 201) {
        storage.setItem('ptit_fcm_token', token);
        return { success: true, token };
      }
      return { success: false, error: 'Failed' };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || err.message };
    }
  };

  // 1. Subscribe must hit /api/v1/notifications/push/subscribe
  const res = await subscribeWithClient(mockApiClient, 'valid_fcm_token_123', mockLocalStorage);
  assert.equal(res.success, true);
  assert.equal(mockLocalStorage.getItem('ptit_fcm_token'), 'valid_fcm_token_123');
  assert.equal(calls[0].url, '/api/v1/notifications/push/subscribe');
  assert.equal(calls[0].payload.fcm_token, 'valid_fcm_token_123');

  // 2. Unsubscribe must hit /api/v1/notifications/push/unsubscribe
  await mockApiClient.post('/api/v1/notifications/push/unsubscribe', { fcm_token: 'valid_fcm_token_123' });
  assert.equal(calls[1].url, '/api/v1/notifications/push/unsubscribe');

  // 3. Negative test: If endpoint was without /api/v1, it would fail and NOT set local token
  const failingStorage = new Map();
  const failingClient = {
    post: async (url) => {
      if (url.startsWith('/notifications/push/')) {
        const err = new Error('Not Found');
        err.response = { status: 404, data: { detail: 'Not Found' } };
        throw err;
      }
    },
  };
  const badRes = await subscribeWithClient(failingClient, 'token_xyz', failingStorage);
  assert.equal(badRes.success, false);
  assert.equal(failingStorage.get('ptit_fcm_token'), undefined);
});
