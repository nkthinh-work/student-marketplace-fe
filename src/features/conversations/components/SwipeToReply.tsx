import React, { useRef, useState } from 'react';
import { Reply } from 'lucide-react';
import { MessageItem } from '../types';

interface SwipeToReplyProps {
  message: MessageItem;
  onReply?: (message: MessageItem) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

type GesturePhase =
  | 'IDLE'
  | 'PENDING_DIRECTION'
  | 'HORIZONTAL_LOCK'
  | 'VERTICAL_SCROLL'
  | 'CANCELLED';

export const SwipeToReply: React.FC<SwipeToReplyProps> = ({
  message,
  onReply,
  disabled = false,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const dragXRef = useRef<number>(0);
  const gesturePhaseRef = useRef<GesturePhase>('IDLE');

  const [isSwiping, setIsSwiping] = useState(false);
  const [isThresholdActive, setIsThresholdActive] = useState(false);

  const isEligible =
    !disabled &&
    Boolean(onReply) &&
    message.type !== 'SYSTEM' &&
    !message.is_deleted;

  const handlePointerDownCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary || e.button !== 0 || !isEligible) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Do not intercept interactive elements or buttons
    if (target.closest('button, a, input, textarea, [data-no-swipe]')) {
      return;
    }

    // Video-safe controls protection:
    // If the pointer starts inside a <video>, check whether it is in the native controls zone
    const videoEl = target instanceof HTMLVideoElement ? target : target.closest('video');
    if (videoEl) {
      const rect = videoEl.getBoundingClientRect();
      // Bottom safe strip (~56px or ~35% of video height)
      const controlSafeHeight = Math.min(60, Math.max(48, rect.height * 0.35));
      const inControlZone = e.clientY >= rect.bottom - controlSafeHeight;
      if (inControlZone) {
        // Allow native controls to receive the event with zero interference
        return;
      }
    }

    // Candidate gesture start
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    gesturePhaseRef.current = 'PENDING_DIRECTION';
    dragXRef.current = 0;
  };

  const handlePointerMoveCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId || gesturePhaseRef.current === 'IDLE') {
      return;
    }

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (gesturePhaseRef.current === 'PENDING_DIRECTION') {
      // If vertical movement dominates beyond 12px, cancel and let chat scroll naturally
      if (absDy > 12 && absDy >= absDx) {
        gesturePhaseRef.current = 'VERTICAL_SCROLL';
        resetTransform();
        return;
      }

      // If horizontal rightwards movement dominates beyond 12px with 1.2 ratio: lock swipe
      if (dx > 12 && dx > absDy * 1.2) {
        gesturePhaseRef.current = 'HORIZONTAL_LOCK';
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // ignore unsupported setPointerCapture
        }
        setIsSwiping(true);
      } else if (dx < -12) {
        // Left swipe is not used for reply
        gesturePhaseRef.current = 'CANCELLED';
        return;
      } else if (absDx > 24 || absDy > 24) {
        gesturePhaseRef.current = 'CANCELLED';
        return;
      }
    }

    if (gesturePhaseRef.current === 'HORIZONTAL_LOCK') {
      if (e.cancelable) {
        e.preventDefault();
      }

      const rawDx = Math.max(0, dx);
      const maxDrag = 72;
      // Damped curve to max 72px
      const tx = Math.min(maxDrag, Math.floor(rawDx * 0.5));
      dragXRef.current = tx;

      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(${tx}px, 0, 0)`;
        contentRef.current.style.transition = 'none';
      }

      const reached = tx >= 40; // corresponds to ~56px rawDx
      setIsThresholdActive(reached);
    }
  };

  const handlePointerUpOrCancelCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    if (gesturePhaseRef.current === 'HORIZONTAL_LOCK' && isThresholdActive && onReply) {
      try {
        navigator.vibrate?.(25);
      } catch {
        // ignore
      }
      onReply(message);
    }

    resetTransform();

    pointerIdRef.current = null;
    gesturePhaseRef.current = 'IDLE';
    dragXRef.current = 0;
    setIsThresholdActive(false);
    setIsSwiping(false);
  };

  const resetTransform = () => {
    if (contentRef.current) {
      contentRef.current.style.transform = 'translate3d(0, 0, 0)';
      contentRef.current.style.transition =
        'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)';
    }
  };

  return (
    <div
      onPointerDownCapture={handlePointerDownCapture}
      onPointerMoveCapture={handlePointerMoveCapture}
      onPointerUpCapture={handlePointerUpOrCancelCapture}
      onPointerCancelCapture={handlePointerUpOrCancelCapture}
      className="relative w-full touch-pan-y"
    >
      {/* Swipe Reply indicator revealed behind/left of bubble */}
      {isEligible && (
        <div
          className={`pointer-events-none absolute -left-8 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150 z-0 ${
            isSwiping ? 'opacity-100' : 'opacity-0'
          } ${
            isThresholdActive
              ? 'bg-brand-burgundy text-white scale-110 shadow-xs'
              : 'bg-stone-200 text-stone-500 scale-90'
          }`}
          aria-hidden="true"
        >
          <Reply className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Message content translated on horizontal gesture */}
      <div ref={contentRef} className="relative w-full">
        {children}
      </div>
    </div>
  );
};
