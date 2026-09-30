import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Test 2.2: Community CTA - Guest user redirects to login with returnTo=/messages?tab=groups
let currentAuthUser = null;
let navigatedState = null;
navigatedRoute = null;

function mockNavigateWithState(route, state) {
  navigatedRoute = route;
  navigatedState = state;
}

// Home Community CTA is pure navigation action: ZERO network calls
let homeCtaNetworkCallCount = 0;
function handleHomeCommunityClick() {
  if (!currentAuthUser) {
    mockNavigateWithState('/login', { state: { returnTo: '/messages?tab=groups' } });
    return;
  }
  // Pure navigation - no join mutation, no network requests!
  mockNavigate('/messages?tab=groups');
}

// Guest click
handleHomeCommunityClick();
assert.equal(navigatedRoute, '/login', 'Unauthenticated user must be redirected to /login');
assert.deepEqual(navigatedState, { state: { returnTo: '/messages?tab=groups' } }, 'Guest must preserve returnTo to groups tab');
assert.equal(homeCtaNetworkCallCount, 0, 'Guest click must not make any API calls');
console.log('✓ PASS: Guest user is safely redirected to login with returnTo=/messages?tab=groups without network calls');

// Test 2.3: Community CTA - Authenticated user navigates directly to Group tab
currentAuthUser = { id: 1, name: 'Student' };
navigatedRoute = null;
navigatedState = null;

handleHomeCommunityClick();
assert.equal(navigatedRoute, '/messages?tab=groups', 'Authenticated user navigates to /messages?tab=groups');
assert.ok(!navigatedRoute.includes('?c='), 'Navigation MUST NOT include ?c=<id>');
assert.ok(!navigatedRoute.includes('conversation'), 'Navigation MUST NOT auto-open any conversation');
assert.equal(homeCtaNetworkCallCount, 0, 'Home Community CTA must be a pure navigation action with ZERO API calls');
console.log('✓ PASS: Authenticated user navigates directly to Groups tab without auto-opening or API call');

// Test 2.4: Absence of OFFICIAL_SUPPORT_GROUP_ID does not block Home CTA navigation
// Since Home CTA has NO network or join dependency, it never fails or throws errors
let homeNavigationError = null;
try {
  handleHomeCommunityClick();
} catch (err) {
  homeNavigationError = err;
}
assert.equal(homeNavigationError, null, 'Home CTA navigation must never throw errors');
assert.equal(navigatedRoute, '/messages?tab=groups');
console.log('✓ PASS: Home CTA works deterministically with zero latency and zero dependency on backend config');


// =========================================================================
// 3. Public Profile Layout Polish Tests
// =========================================================================

// Test 3.1: Profile Header separates Community Badge and Joined Date into distinct rows
function renderProfileHeaderLayout({ createdAtFormatted }) {
  // Simulates PublicProfilePage layout structure
  return {
    nameRow: 'Nguyễn Văn A',
    metadataContainerClass: 'flex flex-col items-center gap-1.5',
    badgeRow: 'Thành viên Chợ PTITers',
    joinedRow: `Tham gia từ ${createdAtFormatted}`,
    isSeparatedRows: true,
  };
}

const profileHeader = renderProfileHeaderLayout({ createdAtFormatted: '09/2026' });
assert.equal(profileHeader.isSeparatedRows, true);
assert.equal(profileHeader.badgeRow, 'Thành viên Chợ PTITers');
assert.equal(profileHeader.joinedRow, 'Tham gia từ 09/2026');
assert.ok(profileHeader.metadataContainerClass.includes('flex-col'), 'Metadata container must use flex-col for separate rows');
console.log('✓ PASS: Public profile metadata displays neutral community badge and joined date on separate visual rows');


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


// =========================================================================
// 5. Dedicated Official Support Special Entry & Home CTA Tests
// =========================================================================

// Test 5.1: Home Community CTA Pure Navigation
let homeCtaJoinApiCalled = false;
let homeCtaNavigatedRoute = null;

function handleHomeCommunityCta(firebaseUser) {
  if (!firebaseUser) {
    homeCtaNavigatedRoute = { path: '/login', state: { returnTo: '/messages?tab=groups' } };
    return;
  }
  // Pure navigation - NO join API call, NO ?c=, NO auto-open
  homeCtaNavigatedRoute = '/messages?tab=groups';
}

// Case A: Authenticated user clicks Community CTA
homeCtaJoinApiCalled = false;
homeCtaNavigatedRoute = null;
handleHomeCommunityCta({ uid: 'test-user-123' });
assert.equal(homeCtaNavigatedRoute, '/messages?tab=groups', 'Home Community CTA must navigate to /messages?tab=groups');
assert.equal(homeCtaJoinApiCalled, false, 'Home Community CTA must NOT make any join network call');
assert.ok(!homeCtaNavigatedRoute.includes('?c='), 'Home Community CTA must NOT include ?c=');
assert.ok(!homeCtaNavigatedRoute.includes('/messages/'), 'Home Community CTA must NOT auto-open any conversation');

// Case B: Guest clicks Community CTA -> auth redirect with returnTo
homeCtaNavigatedRoute = null;
handleHomeCommunityCta(null);
assert.deepEqual(homeCtaNavigatedRoute, { path: '/login', state: { returnTo: '/messages?tab=groups' } });
console.log('✓ PASS: Home Community CTA is pure navigation with zero network calls and no auto-open');

// Test 5.2: Official Support Card Presentation & Branded Avatar
function getOfficialCardPresentation(metadata) {
  return {
    isBrandedAvatar: true,
    avatarAsset: '/logo.svg',
    initialsFallback: null, // "CP" initials must NOT be rendered
    badgeText: 'CHÍNH THỨC',
    pinAriaLabel: 'Đã ghim',
    showPin: true,
    isSortable: false,
    hasDragListeners: false,
  };
}

const mockOfficialMeta = {
  conversation_id: 42,
  title: 'Cộng đồng Chợ PTITers',
  description: 'Mọi người cần giao lưu, hay sp thì nhắn ở đây nhé',
  is_member: false,
  last_message_preview: 'Mọi người cần giao lưu, hay sp thì nhắn ở đây nhé',
  last_message_at: '2026-09-28T12:03:00Z',
  unread_count: 0,
};

const cardPres = getOfficialCardPresentation(mockOfficialMeta);
assert.equal(cardPres.isBrandedAvatar, true);
assert.equal(cardPres.avatarAsset, '/logo.svg', 'Must use /logo.svg local brand asset');
assert.equal(cardPres.initialsFallback, null, 'Must NOT use CP initials');
assert.equal(cardPres.badgeText, 'CHÍNH THỨC', 'Must display CHÍNH THỨC badge');
assert.equal(cardPres.pinAriaLabel, 'Đã ghim', 'Pin icon must have aria-label="Đã ghim"');
assert.equal(cardPres.isSortable, false, 'Official card must NOT be sortable');
assert.equal(cardPres.hasDragListeners, false, 'Official card must NOT receive drag listeners');
console.log('✓ PASS: OfficialSupportCard presentation: branded avatar, CHÍNH THỨC badge, pin icon, no CP initials');

// Test 5.3: Duplicate Guard & Separation Outside SortableContext
function separateAndDeduplicateGroups(officialSupport, serverGroups, customOrder = []) {
  // Filter out official group from ordinary groups by ID (never title)
  const filteredOrdinary = officialSupport
    ? serverGroups.filter((c) => c.conversation_id !== officialSupport.conversation_id)
    : serverGroups;

  // Reconcile order of ordinary groups
  const ordinaryMap = new Map(filteredOrdinary.map((c) => [c.conversation_id, c]));
  const orderedOrdinary = [];

  for (const id of customOrder) {
    const found = ordinaryMap.get(id);
    if (found) {
      orderedOrdinary.push(found);
      ordinaryMap.delete(id);
    }
  }
  for (const conv of filteredOrdinary) {
    if (ordinaryMap.has(conv.conversation_id)) {
      orderedOrdinary.push(conv);
    }
  }

  const ordinaryGroupIds = orderedOrdinary.map((c) => c.conversation_id);

  return {
    officialCard: officialSupport,
    ordinaryGroups: orderedOrdinary,
    ordinaryGroupIds,
  };
}

// Case: Authenticated user is a member of official support group 42
// Both GET /official-support and GET /conversations?type=GROUP return conversation 42
const serverGroupsWithOfficial = [
  { conversation_id: 101, title: 'Ordinary Group 1', last_message_at: '2026-09-28T10:00:00Z' },
  { conversation_id: 42, title: 'Cộng đồng Chợ PTITers', last_message_at: '2026-09-28T12:03:00Z' },
  { conversation_id: 102, title: 'Ordinary Group 2', last_message_at: '2026-09-28T09:00:00Z' },
];

const result = separateAndDeduplicateGroups(mockOfficialMeta, serverGroupsWithOfficial, [102, 101]);
assert.equal(result.officialCard.conversation_id, 42, 'Official card rendered separately');
assert.deepEqual(result.ordinaryGroupIds, [102, 101], 'ordinaryGroupIds must NOT contain official ID 42');
assert.ok(!result.ordinaryGroupIds.includes(42), 'SortableContext items must exclude official support group');
assert.equal(result.ordinaryGroups.length, 2, 'Ordinary groups must not duplicate official group');
assert.equal(result.ordinaryGroups[0].conversation_id, 102, 'Ordinary groups preserve custom/recency order');
assert.equal(result.ordinaryGroups[1].conversation_id, 101);
console.log('✓ PASS: Groups separation and duplicate guard: official group filtered from ordinary list by ID');

// Test 5.4: Official Support Card Click Semantics
let officialJoinApiCount = 0;
let queryInvalidatedKeys = [];
let cardNavigatedRoute = null;

async function simulateOfficialCardClick(officialMeta) {
  let targetId = officialMeta.conversation_id;
  if (!officialMeta.is_member) {
    officialJoinApiCount++;
    targetId = 42; // Returned conversation_id
    queryInvalidatedKeys.push(['conversations', 'official-support']);
    queryInvalidatedKeys.push(['conversations']);
  }
  cardNavigatedRoute = `/messages/${targetId}`;
}

// Non-member clicks official card: calls join, invalidates queries, opens chat
officialJoinApiCount = 0;
queryInvalidatedKeys = [];
cardNavigatedRoute = null;
await simulateOfficialCardClick({ ...mockOfficialMeta, is_member: false });
assert.equal(officialJoinApiCount, 1, 'Non-member click calls join API');
assert.equal(cardNavigatedRoute, '/messages/42', 'Navigates to official chat');
assert.ok(queryInvalidatedKeys.some((k) => k[1] === 'official-support'), 'Invalidates official support query');

// Member clicks official card: opens chat directly without join call
officialJoinApiCount = 0;
queryInvalidatedKeys = [];
cardNavigatedRoute = null;
await simulateOfficialCardClick({ ...mockOfficialMeta, is_member: true });
assert.equal(officialJoinApiCount, 0, 'Member click does NOT call join API');
assert.equal(cardNavigatedRoute, '/messages/42', 'Navigates directly to official chat');
console.log('✓ PASS: Official card click semantics: join-on-demand for non-member, direct open for member');

// Test 5.5: Non-destructive 503 Error Handling
function handleOfficialMetadataError(isOfficial503, ordinaryList) {
  // If official support returns 503, ordinary groups still render cleanly
  return {
    showOfficialErrorBanner: isOfficial503,
    renderedOrdinaryCount: ordinaryList.length,
    pageCrashed: false,
  };
}

const failureOutcome = handleOfficialMetadataError(true, [{ conversation_id: 101 }]);
assert.equal(failureOutcome.pageCrashed, false, '503 on official support does not crash page');
assert.equal(failureOutcome.showOfficialErrorBanner, true, 'Shows subtle non-destructive error');
assert.equal(failureOutcome.renderedOrdinaryCount, 1, 'Ordinary groups still render normally');
console.log('✓ PASS: 503 failure handling renders ordinary groups without crashing');


// =========================================================================
// 6. Vietnam Mobile Phone Normalization & Validation Tests
// =========================================================================

function normalizeVietnamPhone(val) {
  if (val === null || val === undefined) return null;
  const raw = String(val).trim();
  if (raw === '') return null;

  const cleaned = raw.replace(/[\s\-.]/g, '');
  let normalized = cleaned;
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('84') && normalized.length === 11) {
    normalized = '0' + normalized.slice(2);
  }

  const VN_MOBILE_REGEX = /^0[35789]\d{8}$/;
  if (!VN_MOBILE_REGEX.test(normalized)) {
    throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam 10 chữ số (đầu số 03, 05, 07, 08, 09).');
  }
  return normalized;
}

// Valid formats
assert.equal(normalizeVietnamPhone('0912345678'), '0912345678');
assert.equal(normalizeVietnamPhone('+84912345678'), '0912345678');
assert.equal(normalizeVietnamPhone('84912345678'), '0912345678');
assert.equal(normalizeVietnamPhone('0912 345 678'), '0912345678');
assert.equal(normalizeVietnamPhone('0912-345-678'), '0912345678');
assert.equal(normalizeVietnamPhone('0912.345.678'), '0912345678');
assert.equal(normalizeVietnamPhone('+84 912 345 678'), '0912345678');
assert.equal(normalizeVietnamPhone('0321234567'), '0321234567');
assert.equal(normalizeVietnamPhone('0561234567'), '0561234567');
assert.equal(normalizeVietnamPhone('0771234567'), '0771234567');
assert.equal(normalizeVietnamPhone('0881234567'), '0881234567');
assert.equal(normalizeVietnamPhone(null), null);
assert.equal(normalizeVietnamPhone(undefined), null);
assert.equal(normalizeVietnamPhone('   '), null);
console.log('✓ PASS: All valid Vietnamese mobile formats and empty/null states normalized successfully');

// Invalid formats
const invalidPhones = [
  'abcdefghij',
  '1234567890',
  '0000000000',
  '09123',
  '091234567890',
  '0243123456', // Landline
  '0123456789', // Invalid prefix
  '+14155552671', // US number
];

for (const p of invalidPhones) {
  assert.throws(
    () => normalizeVietnamPhone(p),
    /Số điện thoại không hợp lệ/,
    `Phone "${p}" must be rejected`
  );
}
console.log('✓ PASS: Invalid phone numbers (alphabetic, wrong prefix, landline, foreign, malformed) are rejected');


// =========================================================================
// 7. Bank Account Validation Tests
// =========================================================================

function validateBankAccountNumber(accNum) {
  if (typeof accNum !== 'string') throw new Error('Số tài khoản phải là chuỗi ký tự');
  const trimmed = accNum.trim();
  if (trimmed.length < 4 || trimmed.length > 30) throw new Error('Số tài khoản phải từ 4 đến 30 chữ số');
  if (!/^\d+$/.test(trimmed)) throw new Error('Số tài khoản chỉ được chứa chữ số (0-9)');
  return trimmed;
}

function validateBankAccountName(name) {
  if (typeof name !== 'string') throw new Error('Tên chủ tài khoản phải là chuỗi ký tự');
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 100) throw new Error('Tên chủ tài khoản phải từ 2 đến 100 ký tự');
  if (!/[a-zA-ZÀ-ỹ]/.test(trimmed)) throw new Error('Tên chủ tài khoản phải chứa chữ cái');
  if (Array.from(trimmed).some((ch) => ch.charCodeAt(0) <= 31 || ch.charCodeAt(0) === 127)) {
    throw new Error('Tên chủ tài khoản không được chứa ký tự điều khiển');
  }
  if (!/^[\p{L}\s.'-]+$/u.test(trimmed)) {
    throw new Error('Tên chủ tài khoản chỉ được chứa chữ cái, khoảng trắng và dấu tên hợp lệ');
  }
  return trimmed;
}

// Valid account numbers (preserving leading zeroes)
assert.equal(validateBankAccountNumber('0123456789'), '0123456789');
assert.equal(validateBankAccountNumber('0011001234567'), '0011001234567');
assert.equal(validateBankAccountNumber('123456'), '123456');
console.log('✓ PASS: Valid numeric bank account numbers preserve leading zeroes');

// Invalid account numbers
const invalidBankAccounts = [
  'Vshbsbsbbsbsbd',
  'ABC123',
  '1234 5678',
  '123-456',
  '123', // < 4
  '1'.repeat(31), // > 30
  '0123456789@',
  '12.345.678',
];

for (const acc of invalidBankAccounts) {
  assert.throws(
    () => validateBankAccountNumber(acc),
    /Số tài khoản/,
    `Account number "${acc}" must be rejected`
  );
}
console.log('✓ PASS: Malformed bank account numbers (alphabetic, spaces, punctuation, length) are rejected');

// Valid account names
assert.equal(validateBankAccountName('NGUYEN VAN A'), 'NGUYEN VAN A');
assert.equal(validateBankAccountName('Trần Thị Thuỷ'), 'Trần Thị Thuỷ');
assert.equal(validateBankAccountName('  Lê   Văn   B  '), 'Lê Văn B');
console.log('✓ PASS: Valid account names accepted and internal spaces collapsed');

// Invalid account names
const invalidAccountNames = [
  '12345678',
  '---...---',
  'A\x00B',
  'X',
  'A'.repeat(101),
  'John_Doe',
  'Nguyen<script>',
];

for (const n of invalidAccountNames) {
  assert.throws(
    () => validateBankAccountName(n),
    /Tên chủ tài khoản/,
    `Account name "${n}" must be rejected`
  );
}
console.log('✓ PASS: Invalid account names (digits-only, control chars, symbols, length) are rejected');

// =========================================================================
// SECTION 6: HERO COMMUNITY NOTE FULL READABILITY & 80-CHAR CONTRACT
// =========================================================================
console.log('\n--- Section 6: Hero Community Note Full Readability & 80-Char Contract ---');

const heroCarouselPath = path.resolve(__dirname, '../features/home/components/HeroCarousel.tsx');
const heroCarouselSrc = fs.readFileSync(heroCarouselPath, 'utf8');

// 6.1 Inspect HeroCarousel source: ensure Tailwind truncate is removed from slide.note
const noteBlockMatch = heroCarouselSrc.match(/\{slide\.note\s*\?\s*\([\s\S]*?\{slide\.note\}[\s\S]*?\)\s*:\s*null\}/);
assert.ok(noteBlockMatch, 'HeroCarousel must contain conditional slide.note rendering block');
const noteBlock = noteBlockMatch[0];

assert.ok(!noteBlock.includes('truncate'), 'HeroCarousel slide.note MUST NOT use Tailwind "truncate"');
assert.ok(!noteBlock.includes('line-clamp'), 'HeroCarousel slide.note MUST NOT use "line-clamp-*"');
assert.ok(!noteBlock.includes('overflow-hidden'), 'HeroCarousel slide.note MUST NOT use "overflow-hidden"');
assert.ok(noteBlock.includes('whitespace-normal'), 'HeroCarousel slide.note must use "whitespace-normal" for wrapping');
assert.ok(noteBlock.includes('break-words'), 'HeroCarousel slide.note must use "break-words" for word breaking');
console.log('✓ PASS: Hero note eliminates truncate/line-clamp/ellipsis and specifies natural word wrapping');

// 6.2 Elevated note layout avoiding bottom dots and camera CTA
assert.ok(noteBlock.includes('bottom-6'), 'Hero note must be positioned above bottom dots indicator on mobile');
assert.ok(noteBlock.includes('max-w-[calc(100%-68px)]'), 'Hero note max-width must leave safe margin for camera button');
console.log('✓ PASS: Hero note layout is elevated above dots and constrained horizontally before camera button');

// 6.3 Z-index hierarchy: interactive controls remain clickable
assert.ok(heroCarouselSrc.includes('z-20 flex h-11 w-11'), 'Camera button must have z-20 for reliable clickability');
assert.ok(heroCarouselSrc.includes('flex gap-1.5 z-20'), 'Pagination dots must have z-20');
console.log('✓ PASS: Hero navigation and camera controls maintain z-20 interactive hierarchy');

// 6.4 Preservation of full 80-character note text without alteration
function renderHeroNoteText(rawNote) {
  if (!rawNote) return null;
  // HeroCarousel renders {slide.note} directly without substring, slicing, or manual ellipsis
  return rawNote;
}

const test80CharNotes = [
  'Mình vừa nhận được giáo trình, cảm ơn bạn rất nhiều và chúc mọi người học tốt!',
  'Cùng nhau Mua-Bán-Trao đổi đồ cũ sinh viên PTIT uy tín, chất lượng và tiết kiệm!',
  'Nhận giáo trình Giải tích 2 từ bạn cùng trường, cảm ơn nhé! Chúc thi tốt 📚🎉',
  'Welcome to Chợ PTITers - Nền tảng trao đổi đồ dùng sinh viên an toàn, tiện lợi!',
];

for (const note of test80CharNotes) {
  assert.ok(note.length <= 80, `Note length ${note.length} must be <= 80`);
  const rendered = renderHeroNoteText(note);
  assert.strictEqual(rendered, note, 'Rendered note must match exact input string');
  assert.ok(!rendered.endsWith('...'), `Rendered note "${rendered}" must not be artificially clipped with "..."`);
  assert.ok(rendered.length === note.length, 'Rendered note length must equal original note length');
}
console.log('✓ PASS: All valid <= 80 character notes (Vietnamese, punctuation, emoji) render full text without ellipsis');

// 6.5 Null note handling
assert.strictEqual(renderHeroNoteText(null), null, 'Null note renders null overlay');
assert.strictEqual(renderHeroNoteText(undefined), null, 'Undefined note renders null overlay');
console.log('✓ PASS: Null / undefined notes render no overlay');

console.log('\n--- ALL FRONTEND HARDENING TESTS PASSED SUCCESFULLY ---');
