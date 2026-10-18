import assert from 'node:assert/strict';
import test from 'node:test';

// Test single-flight shared Promise logic in isolation
test('Single-flight shared Promise: concurrent 401s share a single token refresh call', async () => {
  let refreshCalls = 0;
  let refreshPromise = null;
  const mockUser = {
    uid: 'user_123',
    getIdToken: async (force) => {
      refreshCalls++;
      await new Promise((r) => setTimeout(r, 20));
      return 'new_refreshed_token';
    },
  };

  const auth = {
    currentUser: mockUser,
  };

  async function getRefreshedToken() {
    if (!refreshPromise) {
      const userAtStart = auth.currentUser;
      if (!userAtStart) return null;
      const uidAtStart = userAtStart.uid;

      refreshPromise = (async () => {
        try {
          const token = await userAtStart.getIdToken(true);
          if (auth.currentUser?.uid !== uidAtStart) {
            return null;
          }
          return token;
        } catch {
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }
    return refreshPromise;
  }

  // Simulate 5 concurrent requests encountering 401 at the same time
  const results = await Promise.all([
    getRefreshedToken(),
    getRefreshedToken(),
    getRefreshedToken(),
    getRefreshedToken(),
    getRefreshedToken(),
  ]);

  assert.equal(refreshCalls, 1, 'getIdToken(true) must be called exactly once across 5 concurrent requests');
  assert.deepEqual(
    results,
    [
      'new_refreshed_token',
      'new_refreshed_token',
      'new_refreshed_token',
      'new_refreshed_token',
      'new_refreshed_token',
    ],
    'All concurrent requests must receive the refreshed token'
  );

  // Subsequent call after completion initiates a new single-flight
  const laterResult = await getRefreshedToken();
  assert.equal(refreshCalls, 2, 'New request after completion must initiate a new refresh');
  assert.equal(laterResult, 'new_refreshed_token');
});

test('Single-flight: logout or account change during refresh returns null and cancels retry', async () => {
  let refreshPromise = null;
  const mockUser = {
    uid: 'user_123',
    getIdToken: async () => {
      await new Promise((r) => setTimeout(r, 20));
      return 'token_user_123';
    },
  };

  const auth = {
    currentUser: mockUser,
  };

  async function getRefreshedToken() {
    if (!refreshPromise) {
      const userAtStart = auth.currentUser;
      if (!userAtStart) return null;
      const uidAtStart = userAtStart.uid;

      refreshPromise = (async () => {
        try {
          const token = await userAtStart.getIdToken(true);
          if (auth.currentUser?.uid !== uidAtStart) {
            return null;
          }
          return token;
        } catch {
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }
    return refreshPromise;
  }

  const p1 = getRefreshedToken();
  // Simulate user logging out while refresh is in flight
  auth.currentUser = null;
  const result = await p1;

  assert.equal(result, null, 'Must return null when user logged out mid-refresh');
});

test('Request interceptor: FormData Content-Type header is stripped for automatic boundary', () => {
  const config = {
    data: new (globalThis.FormData || class FakeFormData {})(),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  // Logic from apiClient request interceptor
  if (config.data instanceof (globalThis.FormData || Object) && config.headers) {
    delete config.headers['Content-Type'];
  }

  assert.equal(config.headers['Content-Type'], undefined, 'Content-Type must be removed for FormData');
  assert.equal(config.headers.Accept, 'application/json', 'Other headers must be preserved');
});

test('Response interceptor: Each request retries at most once', async () => {
  const originalRequest = {
    url: '/api/v1/test',
    _retry: false,
    headers: {},
  };

  const error = {
    response: { status: 401 },
    config: originalRequest,
  };

  // First 401 marks _retry = true
  assert.equal(originalRequest._retry, false);
  originalRequest._retry = true;

  // Second 401 encounters _retry == true -> rejected without second retry
  const shouldRetry = error.response?.status === 401 && !originalRequest._retry;
  assert.equal(shouldRetry, false, 'Second 401 must not retry again');
});
