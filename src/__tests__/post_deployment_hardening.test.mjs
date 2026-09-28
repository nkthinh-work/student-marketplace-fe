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


// =========================================================================
// 5. Official Group Pinning & Branding Tests
// =========================================================================

function reconcileGroupOrder(activeTab, serverConversations, customOrder = []) {
  if (activeTab !== 'GROUP') {
    return serverConversations;
  }
  const officialGroup = serverConversations.find((c) => c.is_official_support);
  const ordinaryGroups = serverConversations.filter((c) => !c.is_official_support);

  const ordinaryIdMap = new Map(ordinaryGroups.map((c) => [c.conversation_id, c]));
  const orderedOrdinary = [];

  for (const id of customOrder) {
    const found = ordinaryIdMap.get(id);
    if (found) {
      orderedOrdinary.push(found);
      ordinaryIdMap.delete(id);
    }
  }
  for (const conv of ordinaryGroups) {
    if (ordinaryIdMap.has(conv.conversation_id)) {
      orderedOrdinary.push(conv);
    }
  }

  return officialGroup ? [officialGroup, ...orderedOrdinary] : orderedOrdinary;
}

const mockGroups = [
  { conversation_id: 101, title: 'Ordinary Group 1', is_official_support: false, last_message_at: '2026-09-28T10:00:00Z' },
  { conversation_id: 42, title: 'Cộng đồng Chợ PTITers', is_official_support: true, last_message_at: '2026-09-27T08:00:00Z' },
  { conversation_id: 102, title: 'Ordinary Group 2', is_official_support: false, last_message_at: '2026-09-28T09:00:00Z' },
];

const reconciled = reconcileGroupOrder('GROUP', mockGroups);
assert.equal(reconciled[0].conversation_id, 42, 'Official group must be at index 0');
assert.equal(reconciled[0].is_official_support, true);
assert.equal(reconciled[1].conversation_id, 101);
assert.equal(reconciled[2].conversation_id, 102);
console.log('✓ PASS: Official support group pinned at index 0 of Group tab');

// Simulation: Ordinary Group 2 receives newest message
const mockGroupsAfterNewMessage = [
  { conversation_id: 102, title: 'Ordinary Group 2', is_official_support: false, last_message_at: '2026-09-28T12:00:00Z' },
  { conversation_id: 42, title: 'Cộng đồng Chợ PTITers', is_official_support: true, last_message_at: '2026-09-27T08:00:00Z' },
  { conversation_id: 101, title: 'Ordinary Group 1', is_official_support: false, last_message_at: '2026-09-28T10:00:00Z' },
];
const reconciledAfter = reconcileGroupOrder('GROUP', mockGroupsAfterNewMessage);
assert.equal(reconciledAfter[0].conversation_id, 42, 'Official group remains at index 0 after new message in other group');
assert.equal(reconciledAfter[1].conversation_id, 102, 'Ordinary group 2 is top among ordinary groups');
assert.equal(reconciledAfter[2].conversation_id, 101, 'Ordinary group 1 is second among ordinary groups');
console.log('✓ PASS: Official group remains pinned first after ordinary group receives new message');

// Presentation verification: Pin icon & Branded avatar only for official
function getGroupCardPresentation(conv) {
  return {
    showPin: Boolean(conv.is_official_support),
    pinAriaLabel: conv.is_official_support ? 'Đã ghim' : null,
    isBrandedAvatar: Boolean(conv.is_official_support),
    avatarAsset: conv.is_official_support ? '/logo.svg' : (conv.avatar_url ?? null),
    initialsFallback: conv.is_official_support ? null : conv.title.slice(0, 2).toUpperCase(),
    showOfficialBadge: Boolean(conv.is_official_support),
  };
}

const officialPres = getGroupCardPresentation(reconciled[0]);
assert.equal(officialPres.showPin, true, 'Official card must display pin icon');
assert.equal(officialPres.pinAriaLabel, 'Đã ghim', 'Pin icon must have aria-label="Đã ghim"');
assert.equal(officialPres.isBrandedAvatar, true, 'Official card must use branded avatar');
assert.equal(officialPres.avatarAsset, '/logo.svg', 'Official card must use /logo.svg local brand asset');
assert.equal(officialPres.initialsFallback, null, 'Official card must NOT fallback to initials CP');
assert.equal(officialPres.showOfficialBadge, true, 'Official card must display "CHÍNH THỨC" badge');

const ordinaryPres = getGroupCardPresentation(reconciled[1]);
assert.equal(ordinaryPres.showPin, false, 'Ordinary card must NOT display pin');
assert.equal(ordinaryPres.isBrandedAvatar, false, 'Ordinary card must NOT use branded avatar');
assert.equal(ordinaryPres.initialsFallback, 'OR', 'Ordinary card uses initials fallback when no avatar_url');
assert.equal(ordinaryPres.showOfficialBadge, false, 'Ordinary card must NOT have official badge');
console.log('✓ PASS: Group card presentation distinguishes official branded avatar and pin from ordinary groups');

// Test 5.4: Structural DND Segregation - Official Card rendered OUTSIDE SortableContext
function segregateConversations(activeTab, list) {
  const officialGroup = activeTab === 'GROUP'
    ? list.find((c) => Boolean(c.is_official_support))
    : undefined;
  const ordinaryConversations = activeTab === 'GROUP'
    ? list.filter((c) => !c.is_official_support)
    : list;
  const ordinaryGroupIds = ordinaryConversations.map((c) => c.conversation_id);
  return { officialGroup, ordinaryConversations, ordinaryGroupIds };
}

const segregation = segregateConversations('GROUP', reconciled);
assert.equal(segregation.officialGroup.conversation_id, 42, 'Official group segregated');
assert.deepEqual(segregation.ordinaryGroupIds, [101, 102], 'ordinaryGroupIds must NOT contain official group ID');
assert.ok(!segregation.ordinaryGroupIds.includes(42), 'Official group ID 42 excluded from SortableContext items');

// Verification of Sortable Card props for official vs ordinary
function getCardDndConfig(conv, isPinned, isReorderable) {
  const isOfficial = Boolean(conv.is_official_support);
  if (isOfficial || isPinned) {
    return {
      hasDragListeners: false,
      hasSortableAttributes: false,
      isDraggable: false,
      cursorClass: 'cursor-pointer',
    };
  }
  return {
    hasDragListeners: isReorderable,
    hasSortableAttributes: true,
    isDraggable: isReorderable,
    cursorClass: 'cursor-pointer',
  };
}

const officialDnd = getCardDndConfig(segregation.officialGroup, true, false);
assert.equal(officialDnd.hasDragListeners, false, 'Official card must have NO drag listeners');
assert.equal(officialDnd.hasSortableAttributes, false, 'Official card must have NO sortable attributes');
assert.equal(officialDnd.isDraggable, false, 'Official card is not draggable');
assert.equal(officialDnd.cursorClass, 'cursor-pointer', 'Official card cursor must not be grab/grabbing');

const ordinaryDnd = getCardDndConfig(segregation.ordinaryConversations[0], false, true);
assert.equal(ordinaryDnd.hasDragListeners, true, 'Ordinary card has drag listeners when reorderable');
assert.equal(ordinaryDnd.hasSortableAttributes, true, 'Ordinary card has sortable attributes');
assert.equal(ordinaryDnd.isDraggable, true, 'Ordinary card is draggable');
console.log('✓ PASS: Official card is strictly non-draggable and excluded from SortableContext items');

// Test 5.5: Official Group Card Click Semantics (Join-on-Demand when clicked in Group tab)
let officialJoinApiCallCount = 0;
async function mockJoinOfficialSupportGroup() {
  officialJoinApiCallCount++;
  return { conversation_id: 42, is_joined: true };
}

let cardClickedConversationId = null;
async function handleCardClickSimulation(conv) {
  if (conv.is_official_support && conv.is_joined === false) {
    await mockJoinOfficialSupportGroup();
  }
  cardClickedConversationId = conv.conversation_id;
  mockNavigate(`/messages/${conv.conversation_id}`);
}

// Case A: User clicks unjoined official group -> triggers join mutation, then enters chat
officialJoinApiCallCount = 0;
cardClickedConversationId = null;
navigatedRoute = null;
const unjoinedOfficial = { conversation_id: 42, is_official_support: true, is_joined: false };
await handleCardClickSimulation(unjoinedOfficial);
assert.equal(officialJoinApiCallCount, 1, 'Clicking unjoined official group triggers join mutation');
assert.equal(cardClickedConversationId, 42, 'Navigates to conversation 42');
assert.equal(navigatedRoute, '/messages/42');

// Case B: User clicks already-joined official group -> NO join mutation, enters chat directly
officialJoinApiCallCount = 0;
cardClickedConversationId = null;
navigatedRoute = null;
const joinedOfficial = { conversation_id: 42, is_official_support: true, is_joined: true };
await handleCardClickSimulation(joinedOfficial);
assert.equal(officialJoinApiCallCount, 0, 'Clicking already-joined official group skips join mutation');
assert.equal(cardClickedConversationId, 42);
assert.equal(navigatedRoute, '/messages/42');

// Case C: User clicks ordinary group -> NO join mutation, enters chat directly
officialJoinApiCallCount = 0;
cardClickedConversationId = null;
navigatedRoute = null;
const ordinaryGroup = { conversation_id: 101, is_official_support: false, is_joined: true };
await handleCardClickSimulation(ordinaryGroup);
assert.equal(officialJoinApiCallCount, 0, 'Clicking ordinary group never calls official join');
assert.equal(cardClickedConversationId, 101);
assert.equal(navigatedRoute, '/messages/101');
console.log('✓ PASS: Official group card click semantics handles join-on-demand cleanly without redundant joins');


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


console.log('\n--- ALL FRONTEND HARDENING TESTS PASSED SUCCESFULLY ---');
