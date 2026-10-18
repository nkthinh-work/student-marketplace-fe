import test from 'node:test';
import assert from 'node:assert/strict';

// Test Notification Sound & Multi-tab Suppression
test('Notification Sound: Toggle preference persistence and default state', () => {
  const store = new Map();
  const mockLocalStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };

  const getNotificationSoundEnabled = () => {
    const val = mockLocalStorage.getItem('ptit_notification_sound_enabled');
    return val !== 'false';
  };

  const setNotificationSoundEnabled = (enabled) => {
    mockLocalStorage.setItem('ptit_notification_sound_enabled', enabled ? 'true' : 'false');
  };

  // Default must be true (ON)
  assert.equal(getNotificationSoundEnabled(), true);

  // Toggle OFF
  setNotificationSoundEnabled(false);
  assert.equal(getNotificationSoundEnabled(), false);
  assert.equal(mockLocalStorage.getItem('ptit_notification_sound_enabled'), 'false');

  // Toggle ON
  setNotificationSoundEnabled(true);
  assert.equal(getNotificationSoundEnabled(), true);
  assert.equal(mockLocalStorage.getItem('ptit_notification_sound_enabled'), 'true');
});

test('Notification Sound: Multi-tab echo suppression prevents simultaneous chimes across tabs', () => {
  const store = new Map();
  const mockLocalStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
  };

  const MULTI_TAB_COOLDOWN_MS = 600;
  const LAST_SOUND_STORAGE_KEY = 'ptit_last_sound_timestamp';

  function simulateTabPlay(now) {
    const lastGlobalPlay = Number(mockLocalStorage.getItem(LAST_SOUND_STORAGE_KEY) || 0);
    if (now - lastGlobalPlay < MULTI_TAB_COOLDOWN_MS) {
      return false; // suppressed by other tab
    }
    mockLocalStorage.setItem(LAST_SOUND_STORAGE_KEY, String(now));
    return true; // plays sound
  }

  const baseTime = 1000000;
  // Tab 1 receives event at baseTime
  const tab1Result = simulateTabPlay(baseTime);
  assert.equal(tab1Result, true, 'Tab 1 should play sound');

  // Tab 2 receives the exact same broadcast 20ms later
  const tab2Result = simulateTabPlay(baseTime + 20);
  assert.equal(tab2Result, false, 'Tab 2 should be suppressed by multi-tab cooldown');

  // Tab 3 receives event 100ms later
  const tab3Result = simulateTabPlay(baseTime + 100);
  assert.equal(tab3Result, false, 'Tab 3 should be suppressed by multi-tab cooldown');

  // After 650ms, a new event arrives in Tab 2
  const tab2NewResult = simulateTabPlay(baseTime + 650);
  assert.equal(tab2NewResult, true, 'Subsequent event after cooldown should play sound');
});

test('Notification Sound: Self-echo messages are suppressed from playing sound', () => {
  const currentUserId = 42;

  function handleMessageCreated(event, currentUserId, playSoundMock) {
    const isSelfEcho = Boolean(currentUserId && event.sender_id === currentUserId);
    if (!isSelfEcho) {
      playSoundMock(event.conversation_id);
    }
  }

  let played = false;
  const playSoundMock = () => { played = true; };

  // Case 1: Message from self
  handleMessageCreated({ sender_id: 42, conversation_id: 10 }, currentUserId, playSoundMock);
  assert.equal(played, false, 'Own sent message should not play sound');

  // Case 2: Message from remote user
  handleMessageCreated({ sender_id: 99, conversation_id: 10 }, currentUserId, playSoundMock);
  assert.equal(played, true, 'Remote message must trigger play sound logic');
});

test('Notification Sound: Active conversation suppression in foreground', () => {
  function isConversationActive(targetId, currentPath, isDocVisible, isDocFocused) {
    if (!isDocVisible || !isDocFocused) return false;
    return currentPath === `/messages/${targetId}`;
  }

  // Active foreground window viewing conversation 10
  assert.equal(isConversationActive(10, '/messages/10', true, true), true);

  // Backgrounded tab viewing conversation 10 (tab hidden) -> NOT active, should alert
  assert.equal(isConversationActive(10, '/messages/10', false, true), false);

  // Viewing different conversation
  assert.equal(isConversationActive(10, '/messages/99', true, true), false);

  // Viewing home page
  assert.equal(isConversationActive(10, '/', true, true), false);
});
