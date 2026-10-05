import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Running Chat Public Profile Navigation Hardening Tests (Native Node ESM) ---');

// =========================================================================
// 1. Direct Chat Info Drawer Navigation Logic
// =========================================================================

function simulateDirectInfoProfileNavigation(otherUser, convId = 1) {
  let navigatedTo = null;
  let navState = null;

  const navigate = (path, opts) => {
    navigatedTo = path;
    navState = opts?.state;
  };

  // Replicating DirectInfoDrawer.tsx navigateToProfile logic
  const navigateToProfile = () => {
    if (!otherUser?.public_id) return;
    navigate(`/users/${otherUser.public_id}`, {
      state: {
        fromApp: true,
        returnTo: `/messages/${convId}`,
        returnLabel: 'Quay lại cuộc trò chuyện',
        source: 'direct-info',
      },
    });
  };

  navigateToProfile();
  return { navigatedTo, navState };
}

// Test 1: EXACT VIDEO BUG REPRODUCTION - user_id: 4
{
  const participantBong = {
    user_id: 4,
    public_id: 'a0000000-0000-4000-8000-000000000004',
    full_name: 'Bống',
    avatar_url: null,
  };

  const result = simulateDirectInfoProfileNavigation(participantBong, 101);
  assert.equal(
    result.navigatedTo,
    '/users/a0000000-0000-4000-8000-000000000004',
    'Must navigate to UUID public_id'
  );
  assert.notEqual(result.navigatedTo, '/users/4', 'Must NEVER navigate to numeric user_id /users/4');
  console.log('✓ PASS: Video reproduction test (user_id=4) navigates to UUID public_id, NOT /users/4');
}

// Test 2: SECOND PARTICIPANT CASE - user_id: 10
{
  const participantHai = {
    user_id: 10,
    public_id: 'b1111111-1111-4111-8111-111111111110',
    full_name: 'Hải',
    avatar_url: null,
  };

  const result = simulateDirectInfoProfileNavigation(participantHai, 102);
  assert.equal(
    result.navigatedTo,
    '/users/b1111111-1111-4111-8111-111111111110',
    'Must navigate to generic UUID public_id'
  );
  assert.notEqual(result.navigatedTo, '/users/10', 'Must NEVER navigate to numeric user_id /users/10');
  console.log('✓ PASS: Second participant test (user_id=10) navigates to UUID public_id, NOT /users/10');
}

// Test 3: MISSING PUBLIC_ID SAFE GUARD
{
  const staleParticipant = {
    user_id: 4,
    full_name: 'Bống',
    avatar_url: null,
  };

  const result = simulateDirectInfoProfileNavigation(staleParticipant, 101);
  assert.equal(result.navigatedTo, null, 'Must NOT navigate when public_id is absent');
  assert.notEqual(result.navigatedTo, '/users/4', 'Must NEVER fallback to numeric user_id');
  console.log('✓ PASS: Missing public_id safely suppresses navigation without numeric fallback');
}

// =========================================================================
// 2. Group Chat Member Navigation Logic
// =========================================================================

function simulateGroupMemberProfileNavigation(member, convId = 50) {
  let navigatedTo = null;

  const navigate = (path) => {
    navigatedTo = path;
  };

  const navigateToProfile = (targetPublicId) => {
    if (!targetPublicId) return;
    navigate(`/users/${targetPublicId}`);
  };

  navigateToProfile(member?.public_id);
  return navigatedTo;
}

// Test 4: Group member navigates via public_id UUID
{
  const groupMember = {
    user_id: 15,
    public_id: 'c2222222-2222-4222-8222-222222222215',
    full_name: 'Thành viên nhóm',
    avatar_url: null,
    role: 'MEMBER',
    joined_at: '2026-03-01T00:00:00Z',
  };

  const target = simulateGroupMemberProfileNavigation(groupMember);
  assert.equal(target, '/users/c2222222-2222-4222-8222-222222222215');
  assert.notEqual(target, '/users/15');
  console.log('✓ PASS: Group member navigation uses UUID public_id, NOT /users/15');
}

// Test 5: Group member missing public_id suppresses navigation
{
  const staleMember = {
    user_id: 15,
    full_name: 'Thành viên nhóm',
    role: 'MEMBER',
    joined_at: '2026-03-01T00:00:00Z',
  };

  const target = simulateGroupMemberProfileNavigation(staleMember);
  assert.equal(target, null);
  assert.notEqual(target, '/users/15');
  console.log('✓ PASS: Group member without public_id suppresses navigation safely');
}

// =========================================================================
// 3. MessageBubble Avatar / Name Navigation Logic
// =========================================================================

function simulateMessageBubbleSenderNavigation(message) {
  let navigatedTo = null;

  const navigate = (path) => {
    navigatedTo = path;
  };

  const handleAvatarClick = () => {
    if (!message?.sender_public_id) return;
    navigate(`/users/${message.sender_public_id}`);
  };

  handleAvatarClick();
  return navigatedTo;
}

// Test 6: Message sender avatar click navigates via sender_public_id
{
  const msgWithPublicId = {
    message_id: 999,
    sender_id: 4,
    sender_public_id: 'a0000000-0000-4000-8000-000000000004',
    sender_name: 'Bống',
  };

  const target = simulateMessageBubbleSenderNavigation(msgWithPublicId);
  assert.equal(target, '/users/a0000000-0000-4000-8000-000000000004');
  assert.notEqual(target, '/users/4');
  console.log('✓ PASS: MessageBubble sender click uses sender_public_id UUID, NOT /users/4');
}

// Test 7: Message without sender_public_id (e.g. SYSTEM) suppresses navigation
{
  const sysMsg = {
    message_id: 1000,
    sender_id: 0,
    sender_name: 'Hệ thống',
  };

  const target = simulateMessageBubbleSenderNavigation(sysMsg);
  assert.equal(target, null);
  console.log('✓ PASS: Message without sender_public_id suppresses navigation safely');
}

// =========================================================================
// 4. Source Code Contract Audit
// =========================================================================

// Test 8: DirectInfoDrawer.tsx source audit
{
  const directDrawerPath = path.resolve(__dirname, '../features/conversations/components/DirectInfoDrawer.tsx');
  const src = fs.readFileSync(directDrawerPath, 'utf8');

  assert(
    !src.includes('/users/${otherUser.user_id}'),
    'DirectInfoDrawer must not contain /users/${otherUser.user_id}'
  );
  assert(
    src.includes('/users/${otherUser.public_id}'),
    'DirectInfoDrawer must contain /users/${otherUser.public_id}'
  );
  assert(
    !src.includes('public_id ?? user_id') && !src.includes('public_id || user_id'),
    'DirectInfoDrawer must not have fallback to user_id'
  );
  console.log('✓ PASS: DirectInfoDrawer.tsx source contract verified');
}

// Test 9: GroupInfoDrawer.tsx source audit
{
  const groupDrawerPath = path.resolve(__dirname, '../features/conversations/components/GroupInfoDrawer.tsx');
  const src = fs.readFileSync(groupDrawerPath, 'utf8');

  assert(
    !src.includes('/users/${targetUserId}'),
    'GroupInfoDrawer must not contain /users/${targetUserId}'
  );
  assert(
    src.includes('/users/${targetPublicId}'),
    'GroupInfoDrawer must contain /users/${targetPublicId}'
  );
  assert(
    !src.includes('navigateToProfile(member.user_id)'),
    'GroupInfoDrawer must not call navigateToProfile with numeric member.user_id'
  );
  console.log('✓ PASS: GroupInfoDrawer.tsx source contract verified');
}

// Test 10: MessageBubble.tsx source audit
{
  const bubblePath = path.resolve(__dirname, '../features/conversations/components/MessageBubble.tsx');
  const src = fs.readFileSync(bubblePath, 'utf8');

  assert(
    !src.includes('/users/${message.sender_id}'),
    'MessageBubble must not contain /users/${message.sender_id}'
  );
  assert(
    src.includes('/users/${message.sender_public_id}'),
    'MessageBubble must contain /users/${message.sender_public_id}'
  );
  console.log('✓ PASS: MessageBubble.tsx source contract verified');
}

console.log('--- ALL CHAT PUBLIC PROFILE NAVIGATION TESTS PASSED SUCCESSFULLY ---');
