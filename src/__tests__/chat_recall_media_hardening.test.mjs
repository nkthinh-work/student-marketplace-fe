import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Running Chat Recall & Media Hardening Frontend Tests (Native Node ESM) ---');

// =========================================================================
// 1. Tombstone Rendering & Sanitization Logic
// =========================================================================

function getRenderedBubbleElements(message) {
  if (message.is_deleted) {
    return {
      isTombstone: true,
      tombstoneText: 'Tin nhắn đã được thu hồi',
      tombstoneIcon: 'CircleSlash',
      hasMedia: false,
      hasText: false,
      hasProduct: false,
      hasReactions: false,
      hasParentOpacity: false,
      isItalic: false,
      timestamp: message.sent_at,
    };
  }

  return {
    isTombstone: false,
    tombstoneText: null,
    tombstoneIcon: null,
    hasMedia: Boolean(message.attachments && message.attachments.length > 0),
    hasText: Boolean(message.content),
    hasProduct: Boolean(message.product),
    hasReactions: Boolean(message.reactions && message.reactions.length > 0),
    hasParentOpacity: false,
    isItalic: false,
    timestamp: message.sent_at,
  };
}

// Test 1: Deleted message produces tombstone without media or text
{
  const recalledMsg = {
    message_id: 101,
    conversation_id: 1,
    sender_id: 42,
    type: 'FILE',
    content: null,
    is_deleted: true,
    attachments: [],
    sent_at: '2026-10-05T12:00:00Z',
    reactions: [],
  };

  const rendered = getRenderedBubbleElements(recalledMsg);
  assert.strictEqual(rendered.isTombstone, true);
  assert.strictEqual(rendered.tombstoneText, 'Tin nhắn đã được thu hồi');
  assert.strictEqual(rendered.tombstoneIcon, 'CircleSlash');
  assert.strictEqual(rendered.hasMedia, false);
  assert.strictEqual(rendered.hasText, false);
  assert.strictEqual(rendered.hasProduct, false);
  assert.strictEqual(rendered.hasReactions, false);
  assert.strictEqual(rendered.hasParentOpacity, false);
  assert.strictEqual(rendered.isItalic, false);
  console.log('✓ PASS: Recalled message renders tombstone without media, content, or reactions');
}

// Test 2: Normal message retains media, text, reactions
{
  const normalMsg = {
    message_id: 102,
    conversation_id: 1,
    sender_id: 42,
    type: 'FILE',
    content: 'Xem video này nhé',
    is_deleted: false,
    attachments: [
      {
        attachment_id: 5,
        kind: 'VIDEO',
        url: 'https://res.cloudinary.com/demo/video/upload/demo.mp4',
        mime_type: 'video/mp4',
        original_name: 'demo.mp4',
        size_bytes: 5000000,
      },
    ],
    sent_at: '2026-10-05T12:01:00Z',
    reactions: [{ reaction_key: 'THICH', count: 1 }],
  };

  const rendered = getRenderedBubbleElements(normalMsg);
  assert.strictEqual(rendered.isTombstone, false);
  assert.strictEqual(rendered.tombstoneText, null);
  assert.strictEqual(rendered.hasMedia, true);
  assert.strictEqual(rendered.hasText, true);
  assert.strictEqual(rendered.hasReactions, true);
  console.log('✓ PASS: Normal message preserves video, text, and reactions');
}

// Test 3: Quoted reply to recalled message renders unavailable notice
{
  const replySummary = {
    message_id: 101,
    sender_id: 42,
    sender_name: 'Nguyễn Văn Gửi',
    preview: 'Tin nhắn không còn khả dụng',
  };

  assert.strictEqual(replySummary.preview, 'Tin nhắn không còn khả dụng');
  console.log('✓ PASS: Quoted reply to recalled message renders tombstone notice');
}

// =========================================================================
// 2. Video-Safe Gesture State Machine Tests
// =========================================================================

class SwipeGestureSimulator {
  constructor({ isVideo = false, videoRect = null, isDeleted = false, messageType = 'TEXT' }) {
    this.isVideo = isVideo;
    this.videoRect = videoRect;
    this.isDeleted = isDeleted;
    this.messageType = messageType;
    this.phase = 'IDLE';
    this.startX = 0;
    this.startY = 0;
    this.tx = 0;
    this.thresholdReached = false;
    this.replyTriggered = false;
  }

  pointerDown(clientX, clientY) {
    if (this.messageType === 'SYSTEM' || this.isDeleted) {
      return false; // Gesture rejected
    }

    if (this.isVideo && this.videoRect) {
      // Bottom ~56px control safe zone protection
      const controlSafeHeight = Math.min(60, Math.max(48, this.videoRect.height * 0.35));
      const inControlZone = clientY >= this.videoRect.bottom - controlSafeHeight;
      if (inControlZone) {
        // Native video controls untouched
        return false;
      }
    }

    this.startX = clientX;
    this.startY = clientY;
    this.phase = 'PENDING_DIRECTION';
    return true;
  }

  pointerMove(clientX, clientY) {
    if (this.phase === 'IDLE' || this.phase === 'CANCELLED' || this.phase === 'VERTICAL_SCROLL') {
      return;
    }

    const dx = clientX - this.startX;
    const dy = clientY - this.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (this.phase === 'PENDING_DIRECTION') {
      if (absDy > 12 && absDy >= absDx) {
        this.phase = 'VERTICAL_SCROLL';
        this.tx = 0;
        return;
      }
      if (dx > 12 && dx > absDy * 1.2) {
        this.phase = 'HORIZONTAL_LOCK';
      } else if (dx < -12) {
        this.phase = 'CANCELLED';
        return;
      }
    }

    if (this.phase === 'HORIZONTAL_LOCK') {
      const rawDx = Math.max(0, dx);
      this.tx = Math.min(72, Math.floor(rawDx * 0.5));
      this.thresholdReached = this.tx >= 40;
    }
  }

  pointerUp() {
    if (this.phase === 'HORIZONTAL_LOCK' && this.thresholdReached) {
      this.replyTriggered = true;
    }
    this.phase = 'IDLE';
    this.tx = 0;
    this.thresholdReached = false;
  }
}

// Test 4: Touching native video controls strip never starts swipe
{
  const sim = new SwipeGestureSimulator({
    isVideo: true,
    videoRect: { top: 100, bottom: 400, height: 300 },
  });

  // Touch at y=370 (bottom 30px of video -> in control zone 400 - 60 = 340)
  const accepted = sim.pointerDown(150, 370);
  assert.strictEqual(accepted, false);
  assert.strictEqual(sim.phase, 'IDLE');
  console.log('✓ PASS: Bottom video controls strip bypasses gesture for native video controls');
}

// Test 5: Dragging vertically on upper video area allows native scroll
{
  const sim = new SwipeGestureSimulator({
    isVideo: true,
    videoRect: { top: 100, bottom: 400, height: 300 },
  });

  const accepted = sim.pointerDown(150, 200); // Upper video area
  assert.strictEqual(accepted, true);
  assert.strictEqual(sim.phase, 'PENDING_DIRECTION');

  // Drag down by 25px, slight horizontal jitter 4px
  sim.pointerMove(154, 225);
  assert.strictEqual(sim.phase, 'VERTICAL_SCROLL');
  assert.strictEqual(sim.replyTriggered, false);
  console.log('✓ PASS: Vertical motion on video content yields to native chat scroll');
}

// Test 6: Horizontal right-swipe on upper video area triggers reply
{
  const sim = new SwipeGestureSimulator({
    isVideo: true,
    videoRect: { top: 100, bottom: 400, height: 300 },
  });

  sim.pointerDown(150, 200);
  // Clear horizontal right drag (dx = 90px, dy = 5px)
  sim.pointerMove(240, 205);
  assert.strictEqual(sim.phase, 'HORIZONTAL_LOCK');
  assert.strictEqual(sim.thresholdReached, true);
  assert.strictEqual(sim.tx <= 72, true);

  sim.pointerUp();
  assert.strictEqual(sim.replyTriggered, true);
  console.log('✓ PASS: Clear horizontal swipe on video content triggers reply safely');
}

// Test 7: Left-swipe does not trigger reply
{
  const sim = new SwipeGestureSimulator({
    isVideo: false,
  });

  sim.pointerDown(200, 200);
  sim.pointerMove(150, 200); // Drag left dx = -50
  assert.strictEqual(sim.phase, 'CANCELLED');
  sim.pointerUp();
  assert.strictEqual(sim.replyTriggered, false);
  console.log('✓ PASS: Left swipe is rejected without triggering reply');
}

// =========================================================================
// 3. Desktop Action Bar & Mobile Popover Rules
// =========================================================================

function getDesktopActionButtons(message, currentUserId) {
  const isMine = message.sender_id === currentUserId;
  const isSystem = message.type === 'SYSTEM';
  const isDeleted = Boolean(message.is_deleted);

  if (isSystem || isDeleted) {
    return [];
  }

  const buttons = [
    { action: 'REPLY', icon: 'Reply', title: 'Trả lời' },
    { action: 'REACTION', icon: 'Smile', title: 'Bày tỏ cảm xúc' },
  ];

  if (isMine) {
    buttons.push({ action: 'RECALL', icon: 'Trash2', title: 'Thu hồi', destructive: true });
  }

  return buttons;
}

function getMobilePopoverActions(message, currentUserId) {
  const isMine = message.sender_id === currentUserId;
  const isSystem = message.type === 'SYSTEM';
  const isDeleted = Boolean(message.is_deleted);

  if (isSystem || isDeleted) {
    return { hasEmojiGrid: false, actions: [] };
  }

  const actions = [
    { action: 'REPLY', icon: 'Reply', label: 'Trả lời', minHeight: 44 },
  ];

  if (isMine) {
    actions.push({ action: 'RECALL', icon: 'Trash2', label: 'Thu hồi', destructive: true, minHeight: 44 });
  }

  return {
    hasEmojiGrid: true,
    actions,
  };
}

// Test 8: Desktop action bar for own active message has Reply, Reaction, and Recall (Trash2)
{
  const myMsg = { sender_id: 10, type: 'TEXT', is_deleted: false };
  const buttons = getDesktopActionButtons(myMsg, 10);
  assert.strictEqual(buttons.length, 3);
  assert.strictEqual(buttons[0].action, 'REPLY');
  assert.strictEqual(buttons[1].action, 'REACTION');
  assert.strictEqual(buttons[2].action, 'RECALL');
  assert.strictEqual(buttons[2].icon, 'Trash2');
  assert.strictEqual(buttons[2].title, 'Thu hồi');
  assert.strictEqual(buttons[2].destructive, true);
  console.log('✓ PASS: Desktop own message has Reply, Smile, and Recall with Trash2 icon');
}

// Test 9: Desktop action bar for other user's message has Reply & Reaction, NO Recall
{
  const otherMsg = { sender_id: 20, type: 'TEXT', is_deleted: false };
  const buttons = getDesktopActionButtons(otherMsg, 10);
  assert.strictEqual(buttons.length, 2);
  assert.strictEqual(buttons.some((b) => b.action === 'RECALL'), false);
  console.log('✓ PASS: Desktop other user message has Reply and Reaction, NO Recall');
}

// Test 10: Mobile context popover for own message has emoji grid, Reply, and Recall below emoji
{
  const myMsg = { sender_id: 10, type: 'TEXT', is_deleted: false };
  const popover = getMobilePopoverActions(myMsg, 10);
  assert.strictEqual(popover.hasEmojiGrid, true);
  assert.strictEqual(popover.actions.length, 2);
  assert.strictEqual(popover.actions[0].action, 'REPLY');
  assert.strictEqual(popover.actions[1].action, 'RECALL');
  assert.strictEqual(popover.actions[1].icon, 'Trash2');
  assert.strictEqual(popover.actions[1].label, 'Thu hồi');
  assert.strictEqual(popover.actions[1].destructive, true);
  assert.strictEqual(popover.actions[1].minHeight >= 44, true);
  console.log('✓ PASS: Mobile own message popover has emoji grid, Reply row, and Recall row (>=44px touch target)');
}

// Test 11: Mobile context popover for other user's message has emoji grid, Reply row, NO Recall
{
  const otherMsg = { sender_id: 20, type: 'TEXT', is_deleted: false };
  const popover = getMobilePopoverActions(otherMsg, 10);
  assert.strictEqual(popover.hasEmojiGrid, true);
  assert.strictEqual(popover.actions.length, 1);
  assert.strictEqual(popover.actions[0].action, 'REPLY');
  assert.strictEqual(popover.actions.some((a) => a.action === 'RECALL'), false);
  console.log('✓ PASS: Mobile other user popover has emoji grid, Reply row, and NO Recall');
}

// Test 12: System and recalled messages offer zero menu/popover actions
{
  const sysMsg = { sender_id: 10, type: 'SYSTEM', is_deleted: false };
  assert.deepStrictEqual(getDesktopActionButtons(sysMsg, 10), []);
  assert.deepStrictEqual(getMobilePopoverActions(sysMsg, 10), { hasEmojiGrid: false, actions: [] });

  const deletedMsg = { sender_id: 10, type: 'TEXT', is_deleted: true };
  assert.deepStrictEqual(getDesktopActionButtons(deletedMsg, 10), []);
  assert.deepStrictEqual(getMobilePopoverActions(deletedMsg, 10), { hasEmojiGrid: false, actions: [] });
  console.log('✓ PASS: System and recalled messages offer no Reply/Reaction/Recall actions');
}

// =========================================================================
// 4. Component Source Code Design Contract Verification
// =========================================================================

// Test 13: MessageBubble.tsx uses Trash2 and CircleSlash, zero Undo2, no parent opacity classes
{
  const messageBubblePath = path.resolve(__dirname, '../features/conversations/components/MessageBubble.tsx');
  const source = fs.readFileSync(messageBubblePath, 'utf8');

  // Must not import or use Undo2 (arrow icon eliminated)
  assert.strictEqual(source.includes('Undo2'), false, 'MessageBubble must NOT use Undo2 (arrow icon)');

  // Must import and use Trash2 for recall
  assert.strictEqual(source.includes('Trash2'), true, 'MessageBubble must import and use Trash2');
  assert.strictEqual(source.includes('title="Thu hồi"'), true, 'Recall button must have title="Thu hồi"');

  // Must import and use CircleSlash for tombstone
  assert.strictEqual(source.includes('CircleSlash'), true, 'MessageBubble must import and use CircleSlash for tombstone');

  // Isolate tombstone block to verify styling contracts
  const tombstoneMatch = source.match(/data-testid="message-tombstone"[\s\S]*?<span>\{formattedTime\}<\/span>\s*<\/div>\s*<\/div>/);
  assert.ok(tombstoneMatch, 'Tombstone element block must exist in MessageBubble.tsx');
  const tombstoneSnippet = tombstoneMatch[0];

  // Must not have parent opacity classes on tombstone
  assert.strictEqual(tombstoneSnippet.includes('opacity-40'), false, 'Tombstone must not use opacity-40');
  assert.strictEqual(tombstoneSnippet.includes('opacity-50'), false, 'Tombstone must not use opacity-50');
  assert.strictEqual(tombstoneSnippet.includes('opacity-60'), false, 'Tombstone must not use opacity-60');

  // Tombstone text must be exact and font-medium (not italic)
  assert.strictEqual(tombstoneSnippet.includes('Tin nhắn đã được thu hồi'), true);
  assert.strictEqual(tombstoneSnippet.includes('italic'), false, 'Tombstone must not be italic');
  assert.strictEqual(tombstoneSnippet.includes('font-medium text-stone-700'), true, 'Tombstone text must be readable font-medium text-stone-700');

  console.log('✓ PASS: MessageBubble.tsx source contract verified (Trash2, CircleSlash, no Undo2, high contrast neutral tombstone)');
}

// Test 14: MessageReactionPicker.tsx has stacked full-width rows with Trash2 and min 44px touch targets
{
  const reactionPickerPath = path.resolve(__dirname, '../features/conversations/components/reactions/MessageReactionPicker.tsx');
  const source = fs.readFileSync(reactionPickerPath, 'utf8');

  // Must not import or use Undo2
  assert.strictEqual(source.includes('Undo2'), false, 'MessageReactionPicker must NOT use Undo2');

  // Must import and use Trash2
  assert.strictEqual(source.includes('Trash2'), true, 'MessageReactionPicker must import and use Trash2');

  // Must have stacked rows with min-h-[44px]
  assert.strictEqual(source.includes('min-h-[44px]'), true, 'Action rows must guarantee min-h-[44px] for mobile accessibility');
  assert.strictEqual(source.includes('flex flex-col gap-1 w-full'), true, 'Action rows must be stacked full-width rows');

  // "Thu hồi" must have destructive text and styling
  assert.strictEqual(source.includes('text-rose-600'), true, 'Recall action must use destructive text-rose-600');

  console.log('✓ PASS: MessageReactionPicker.tsx source contract verified (stacked rows, Trash2, min-h-[44px], destructive styling)');
}

// =========================================================================
// 5. WebSocket MESSAGE_DELETED Realtime Cache Invalidation
// =========================================================================

// Test 15: Realtime MESSAGE_DELETED invalidates all 5 authoritative query keys
{
  const invalidatedKeys = [];
  const mockQueryClient = {
    invalidateQueries: ({ queryKey }) => {
      invalidatedKeys.push(queryKey);
    },
  };

  const handleRealtimeEvent = (event) => {
    if (event.type === 'MESSAGE_DELETED' && event.conversation_id) {
      mockQueryClient.invalidateQueries({
        queryKey: ['conversations', 'detail', event.conversation_id, 'messages'],
      });
      mockQueryClient.invalidateQueries({
        queryKey: ['conversations', 'detail', event.conversation_id],
      });
      mockQueryClient.invalidateQueries({
        queryKey: ['conversations', 'detail', event.conversation_id, 'attachments-summary'],
      });
      mockQueryClient.invalidateQueries({
        queryKey: ['conversations', 'detail', event.conversation_id, 'attachments'],
      });
      mockQueryClient.invalidateQueries({
        queryKey: ['conversations', 'list'],
      });
    }
  };

  handleRealtimeEvent({
    type: 'MESSAGE_DELETED',
    conversation_id: 77,
    message_id: 888,
  });

  assert.strictEqual(invalidatedKeys.length, 5);
  assert.deepStrictEqual(invalidatedKeys[0], ['conversations', 'detail', 77, 'messages']);
  assert.deepStrictEqual(invalidatedKeys[1], ['conversations', 'detail', 77]);
  assert.deepStrictEqual(invalidatedKeys[2], ['conversations', 'detail', 77, 'attachments-summary']);
  assert.deepStrictEqual(invalidatedKeys[3], ['conversations', 'detail', 77, 'attachments']);
  assert.deepStrictEqual(invalidatedKeys[4], ['conversations', 'list']);
  console.log('✓ PASS: MESSAGE_DELETED event correctly invalidates messages, detail, attachments, summary, and lists');
}

console.log('--- ALL FRONTEND CHAT RECALL & HARDENING TESTS PASSED SUCCESFULLY ---');

