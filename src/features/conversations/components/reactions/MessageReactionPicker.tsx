import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReactionKey } from '../../types';
import { SIGNATURE_REACTIONS } from './reactionCatalog';

interface MessageReactionPickerProps {
  currentReaction?: ReactionKey | null;
  onSelect: (key: ReactionKey) => void;
  onClose: () => void;
  isMine?: boolean;
  anchorElement?: HTMLElement | null;
}

export const MessageReactionPicker: React.FC<MessageReactionPickerProps> = ({
  currentReaction,
  onSelect,
  onClose,
  isMine = false,
  anchorElement,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const calculatePosition = () => {
      if (!anchorElement) {
        // Fallback center of screen
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isMobile = vw < 640;
        const width = isMobile ? Math.min(340, vw - 24) : 380;
        const height = isMobile ? 248 : 176;
        setCoords({
          top: Math.max(12, (vh - height) / 2),
          left: Math.max(12, (vw - width) / 2),
          width,
        });
        return;
      }

      const rect = anchorElement.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 640;
      const width = isMobile ? Math.min(340, vw - 24) : 380;
      const height = isMobile ? 248 : 176;

      // 1. Horizontal positioning with strict viewport clamping [12px, vw - width - 12px]
      let left: number;
      if (isMobile) {
        // Center relative to anchor on mobile, clamped to viewport
        const idealLeft = rect.left + rect.width / 2 - width / 2;
        left = Math.max(12, Math.min(idealLeft, vw - width - 12));
      } else {
        // Desktop: align right if own message, align left if other's message
        const idealLeft = isMine ? rect.right - width : rect.left;
        left = Math.max(12, Math.min(idealLeft, vw - width - 12));
      }

      // 2. Vertical positioning: flip above/below if insufficient space
      const spaceAbove = rect.top;
      const spaceBelow = vh - rect.bottom;
      let top: number;
      if (spaceAbove >= height + 10) {
        // Plenty of space above
        top = rect.top - height - 8;
      } else if (spaceBelow >= height + 10) {
        // Flip below
        top = rect.bottom + 8;
      } else {
        // Fallback clamped within screen bounds
        top = Math.max(12, Math.min(rect.top - height - 8, vh - height - 12));
      }

      setCoords({ top, left, width });
    };

    calculatePosition();

    // Recompute on window resize
    window.addEventListener('resize', calculatePosition);
    return () => {
      window.removeEventListener('resize', calculatePosition);
    };
  }, [anchorElement, isMine]);

  useEffect(() => {
    // Outside click handler
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        (!anchorElement || !anchorElement.contains(target))
      ) {
        onClose();
      }
    };

    // Escape key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const mountTime = Date.now();

    // Close on chat scroll to prevent floating detached popovers (ignore first 150ms after mount to prevent Android reflow dismissals)
    const handleScroll = (e: Event) => {
      if (Date.now() - mountTime < 150) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose, anchorElement]);

  const content = (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Chọn cảm xúc tin nhắn Chợ PTITers"
      onClick={(e) => e.stopPropagation()}
      style={
        coords
          ? {
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxWidth: 'calc(100vw - 24px)',
            }
          : { visibility: 'hidden' }
      }
      className="z-50 bg-brand-warm-white rounded-2xl shadow-xl border border-brand-border p-2.5 select-none overflow-x-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Title Header */}
      <div className="flex items-center justify-between px-1.5 pt-0.5 pb-2 mb-1.5 border-b border-brand-border/60">
        <span className="text-xs font-bold text-brand-burgundy tracking-wide">
          Cảm xúc PTITers
        </span>
        <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          12 biểu cảm
        </span>
      </div>

      {/* Grid: 4 columns on mobile (<640px), 6 columns on desktop (>=640px) */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-1.5">
        {SIGNATURE_REACTIONS.map((item) => {
          const isSelected = currentReaction === item.key;

          return (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              title={`${item.label} (${item.description})`}
              aria-label={item.label}
              onClick={() => onSelect(item.key)}
              className={`flex flex-col items-center justify-start p-1 sm:p-1.5 rounded-xl transition-all duration-150 cursor-pointer min-w-0 w-full group ${
                isSelected
                  ? 'bg-brand-soft-pink border border-brand-burgundy/50 ring-1 ring-brand-burgundy/30 shadow-2xs'
                  : 'hover:bg-brand-soft-pink/60 hover:scale-105 active:scale-95 border border-transparent'
              }`}
            >
              {/* Canonical P Mascot PNG Asset */}
              <img
                src={item.src}
                alt={item.label}
                className="w-9 h-9 sm:w-8.5 sm:h-8.5 object-contain select-none pointer-events-none shrink-0 transition-transform duration-150 group-hover:scale-110"
                loading="eager"
              />

              {/* Label */}
              <span className="text-[11px] sm:text-[10px] leading-tight text-brand-text font-medium text-center break-words mt-1 w-full min-h-[2.4em] flex items-center justify-center px-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
