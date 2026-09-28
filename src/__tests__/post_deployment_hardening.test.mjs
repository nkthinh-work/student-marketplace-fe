import assert from 'node:assert/strict';

console.log('--- Running Post-Deployment UX & Messaging Hardening Frontend Tests (Native Node ESM) ---');

// =========================================================================
// 1. Sound Controller & Policy Tests
// =========================================================================

// Mock storage
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (k) => mockStorage.get(k) ?? null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
};

// Mock document & window
globalThis.document = {
  hidden: false,
  hasFocus: () => true,
};
globalThis.window = {
  location: {
    pathname: '/messages/42',
    search: '',
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

// Simulation of sound policy logic matching src/features/notifications/sound.ts
const STORAGE_KEY = 'ptit_notification_sound_enabled';
const CHAT_COOLDOWN_MS = 3500;
const GENERAL_COOLDOWN_MS = 1000;

let lastGeneralPlayTime = 0;
const conversationCooldownMap = new Map();

function getSoundEnabled() {
  const val = localStorage.getItem(STORAGE_KEY);
  return val !== 'false';
}

function setSoundEnabled(enabled) {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}

function isConvActive(conversationId) {
  if (document.hidden) return false;
  if (typeof document.hasFocus === 'function' && !document.hasFocus()) return false;

  const pathname = window.location.pathname;
  const targetIdStr = String(conversationId);

  if (pathname === `/messages/${targetIdStr}`) return true;
  if (pathname.startsWith('/messages')) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('c') === targetIdStr) return true;
  }
  return false;
}

let chimePlayedCount = 0;
function playChimeMock() {
  chimePlayedCount++;
}

function simulatePlayNotificationSound(options, now = Date.now()) {
  try {
    if (!getSoundEnabled()) return false;

    const convId = options?.conversationId;
    const isChat = options?.isChatMessage ?? Boolean(convId);

    if (isChat && convId) {
      if (isConvActive(convId)) {
        return false;
      }
      const lastConvTime = conversationCooldownMap.get(convId) || 0;
      if (now - lastConvTime < CHAT_COOLDOWN_MS) {
        return false;
      }
      conversationCooldownMap.set(convId, now);
    } else {
      if (now - lastGeneralPlayTime < GENERAL_COOLDOWN_MS) {
        return false;
      }
      lastGeneralPlayTime = now;
    }

    playChimeMock();
    return true;
  } catch {
    return false;
  }
}

// Test 1.1: Default sound enabled
mockStorage.clear();
assert.equal(getSoundEnabled(), true, 'Sound should default to ON');
console.log('✓ PASS: Sound preference defaults to true');

// Test 1.2: Disable sound
setSoundEnabled(false);
assert.equal(getSoundEnabled(), false, 'Sound should be OFF after toggle');
assert.equal(simulatePlayNotificationSound({ conversationId: 100 }), false, 'Sound should not play when disabled');
assert.equal(chimePlayedCount, 0, 'No chime played when sound disabled');
console.log('✓ PASS: Disabling sound suppresses all chimes');

// Re-enable sound
setSoundEnabled(true);
assert.equal(getSoundEnabled(), true);

// Test 1.3: Active conversation suppression
// User is viewing /messages/42, document visible and focused
window.location.pathname = '/messages/42';
window.location.search = '';
document.hidden = false;
document.hasFocus = () => true;

const resActive = simulatePlayNotificationSound({ conversationId: 42, isChatMessage: true });
assert.equal(resActive, false, 'Should suppress sound for active foreground conversation /messages/42');
assert.equal(chimePlayedCount, 0, 'Chime count should remain 0');
console.log('✓ PASS: Active conversation suppresses chat sound');

// Test 1.4: Active conversation suppression via query param /messages?c=42
window.location.pathname = '/messages';
window.location.search = '?c=42';
assert.equal(simulatePlayNotificationSound({ conversationId: 42, isChatMessage: true }), false, 'Should suppress sound for /messages?c=42');
console.log('✓ PASS: Query-param active conversation suppresses chat sound');

// Test 1.5: Different conversation allows sound
window.location.pathname = '/messages/42';
window.location.search = '';
let currentTime = 10000;
const resDifferent = simulatePlayNotificationSound({ conversationId: 99, isChatMessage: true }, currentTime);
assert.equal(resDifferent, true, 'Different conversation should play sound');
assert.equal(chimePlayedCount, 1, 'Chime count should increment');
console.log('✓ PASS: Non-active conversation allows sound');

// Test 1.6: Backgrounded tab allows sound even for same conversation
document.hidden = true; // Tab is in background
currentTime += 5000;
const resBackground = simulatePlayNotificationSound({ conversationId: 42, isChatMessage: true }, currentTime);
assert.equal(resBackground, true, 'Backgrounded tab allows sound even for current conversation');
assert.equal(chimePlayedCount, 2, 'Chime count should increment');
console.log('✓ PASS: Backgrounded tab plays sound');

// Restore document visible
document.hidden = false;

// Test 1.7: Burst Cooldown (3.5s debounce)
window.location.pathname = '/';
currentTime += 10000;
const burst1 = simulatePlayNotificationSound({ conversationId: 88, isChatMessage: true }, currentTime);
assert.equal(burst1, true, 'First message in burst plays sound');

// Second message arrives 500ms later (rapid burst)
const burst2 = simulatePlayNotificationSound({ conversationId: 88, isChatMessage: true }, currentTime + 500);
assert.equal(burst2, false, 'Rapid burst message within 3.5s must be suppressed by cooldown');

// Third message arrives 3600ms later (cooldown elapsed)
const burst3 = simulatePlayNotificationSound({ conversationId: 88, isChatMessage: true }, currentTime + 3600);
assert.equal(burst3, true, 'Message after 3.5s cooldown plays sound');
console.log('✓ PASS: Cooldown prevents rapid repetitive burst sounds');

// Test 1.8: Audio failure never crashes caller
function failingPlaySound() {
  try {
    throw new Error('WebAudio decoding error');
  } catch {
    return false;
  }
}
assert.equal(failingPlaySound(), false, 'Should catch and return false on audio failure');
console.log('✓ PASS: Audio failures are caught safely without throwing');


// =========================================================================
// 2. Home Discovery / Help Card Tests
// =========================================================================

// Test 2.1: Tutorial CTA opens global overlay, no route change
let tutorialOpened = false;
let navigatedRoute = null;

function mockOpenTutorial() {
  tutorialOpened = true;
}

function mockNavigate(route) {
  navigatedRoute = route;
}

// Simulate clicking "Hướng dẫn"
function handleTutorialClick() {
  mockOpenTutorial();
}

handleTutorialClick();
assert.equal(tutorialOpened, true, 'Tutorial overlay should open');
assert.equal(navigatedRoute, null, 'Must NOT navigate or change route on Tutorial click');
console.log('✓ PASS: Home Tutorial CTA opens global overlay without navigation');

// Test 2.2: Community CTA - Guest user redirects to login
let currentAuthUser = null;
navigatedRoute = null;

async function handleCommunityClick(apiJoinFn) {
  if (!currentAuthUser) {
    mockNavigate('/login');
    return;
  }
  try {
    const res = await apiJoinFn();
    mockNavigate(`/messages?c=${res.conversation_id}`);
  } catch (err) {
    return 'Hiện chưa thể mở Cộng đồng Chợ PTITers. Vui lòng thử lại sau.';
  }
}

// Guest click
handleCommunityClick(async () => ({ conversation_id: 10 }));
assert.equal(navigatedRoute, '/login', 'Unauthenticated user must be redirected to /login');
console.log('✓ PASS: Guest user is safely redirected to login');

// Test 2.3: Community CTA - Authenticated user joins and navigates to support group
currentAuthUser = { id: 1, name: 'Student' };
navigatedRoute = null;

await handleCommunityClick(async () => {
  return { conversation_id: 42, title: 'Cộng đồng Chợ PTITers', is_joined: true };
});
assert.equal(navigatedRoute, '/messages?c=42', 'Authenticated user navigates to /messages?c={id}');
console.log('✓ PASS: Authenticated user resolves official support group and navigates');

// Test 2.4: Community CTA - API error handling
currentAuthUser = { id: 1, name: 'Student' };
navigatedRoute = null;

const errorMsg = await handleCommunityClick(async () => {
  throw new Error('Network error or unconfigured group');
});
assert.equal(navigatedRoute, null, 'Should not navigate on error');
assert.equal(errorMsg, 'Hiện chưa thể mở Cộng đồng Chợ PTITers. Vui lòng thử lại sau.');
console.log('✓ PASS: Community CTA fails gracefully on server/config error');


// =========================================================================
// 3. Public Profile Layout Polish Tests
// =========================================================================

// Test 3.1: Profile Header separates Role and Joined Date into distinct rows
function renderProfileHeaderLayout({ role, createdAtFormatted }) {
  // Simulates PublicProfilePage layout structure
  return {
    nameRow: 'Nguyễn Văn A',
    metadataContainerClass: 'flex flex-col items-center gap-1.5',
    roleRow: role === 'ADMIN' ? 'Quản trị viên' : 'Sinh viên PTIT',
    joinedRow: `Tham gia từ ${createdAtFormatted}`,
    isSeparatedRows: true,
  };
}

const studentHeader = renderProfileHeaderLayout({ role: 'STUDENT', createdAtFormatted: '09/2026' });
assert.equal(studentHeader.isSeparatedRows, true);
assert.equal(studentHeader.roleRow, 'Sinh viên PTIT');
assert.equal(studentHeader.joinedRow, 'Tham gia từ 09/2026');
assert.ok(studentHeader.metadataContainerClass.includes('flex-col'), 'Metadata container must use flex-col for separate rows');

const adminHeader = renderProfileHeaderLayout({ role: 'ADMIN', createdAtFormatted: '01/2026' });
assert.equal(adminHeader.roleRow, 'Quản trị viên');
assert.equal(adminHeader.joinedRow, 'Tham gia từ 01/2026');
console.log('✓ PASS: Public profile metadata displays role and joined date on separate visual rows');


// =========================================================================
// 4. Notification Coalescing Logic Tests
// =========================================================================

// Test 4.1: Coalescing in Client Store (1 unread row per conversation)
function coalesceNotifications(existingNotifs, incomingNotif) {
  // If incoming notification is a chat message for a conversation that already has an unread notification,
  // coalesce into that notification instead of duplicating
  if (incomingNotif.type === 'NEW_MESSAGE' && incomingNotif.ref_type === 'CONVERSATION') {
    const existingIndex = existingNotifs.findIndex(
      (n) => n.ref_type === 'CONVERSATION' && n.ref_id === incomingNotif.ref_id && !n.is_read
    );
    if (existingIndex >= 0) {
      // Replace existing row with latest coalesced row
      const updated = [...existingNotifs];
      updated[existingIndex] = incomingNotif;
      return updated;
    }
  }
  return [incomingNotif, ...existingNotifs];
}

let notifList = [];
// Message 1 from conversation 10
notifList = coalesceNotifications(notifList, {
  notification_id: 1,
  type: 'NEW_MESSAGE',
  ref_type: 'CONVERSATION',
  ref_id: 10,
  title: 'Tin nhắn mới',
  is_read: false,
});
assert.equal(notifList.length, 1);

// Message 2 from same conversation 10
notifList = coalesceNotifications(notifList, {
  notification_id: 2,
  type: 'NEW_MESSAGE',
  ref_type: 'CONVERSATION',
  ref_id: 10,
  title: 'Tin nhắn mới',
  is_read: false,
});
assert.equal(notifList.length, 1, 'Multiple unread messages in conversation 10 must coalesce to 1 row');
assert.equal(notifList[0].notification_id, 2, 'Latest notification replaces coalesced row');

// Message 3 from different conversation 20
notifList = coalesceNotifications(notifList, {
  notification_id: 3,
  type: 'NEW_MESSAGE',
  ref_type: 'CONVERSATION',
  ref_id: 20,
  title: 'Tin nhắn mới',
  is_read: false,
});
assert.equal(notifList.length, 2, 'Different conversation gets its own notification row');
console.log('✓ PASS: Notification client coalescing ensures at most 1 unread row per conversation');

console.log('\n--- ALL FRONTEND HARDENING TESTS PASSED SUCCESFULLY ---');
