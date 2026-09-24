import React from 'react';
import { Plus } from 'lucide-react';
import { ReactionAggregateItem, ReactionKey } from '../../types';
import { REACTION_MAP } from './reactionCatalog';

interface MessageReactionBarProps {
  reactions: ReactionAggregateItem[];
  myReaction?: ReactionKey | null;
  onSelect: (key: ReactionKey) => void;
  onOpenPicker?: (targetElement: HTMLElement) => void;
  isMine?: boolean;
}

export const MessageReactionBar: React.FC<MessageReactionBarProps> = ({
  reactions,
  myReaction,
  onSelect,
  onOpenPicker,
  isMine = false,
}) => {
  const activeReactions = reactions.filter((r) => r.count > 0);

  if (activeReactions.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 mt-1 max-w-full z-10 select-none ${
        isMine ? 'justify-end' : 'justify-start'
      }`}
    >
      {activeReactions.map((item) => {
        const def = REACTION_MAP.get(item.reaction_key);
        if (!def) return null;

        const isMyReaction = myReaction === item.reaction_key;

        return (
          <button
            key={item.reaction_key}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.reaction_key);
            }}
            title={`${def.label}: ${item.count} người bày tỏ (${
              isMyReaction ? 'Nhấn để gỡ bỏ' : 'Nhấn để bày tỏ'
            })`}
            aria-label={`${def.label} ${item.count}`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-2xs ${
              isMyReaction
                ? 'bg-brand-soft-pink border-brand-burgundy text-brand-burgundy ring-1 ring-brand-burgundy/30 scale-102'
                : 'bg-brand-warm-white hover:bg-brand-soft-pink border-brand-burgundy/25 hover:border-brand-burgundy/40 text-brand-burgundy'
            }`}
          >
            {/* Small-size enhanced mascot icon: 24px on mobile, 22px on desktop */}
            <img
              src={def.src}
              alt={def.label}
              className="w-6 h-6 sm:w-[22px] sm:h-[22px] object-contain select-none pointer-events-none opacity-100"
              style={{
                filter: 'contrast(1.12) saturate(1.10) drop-shadow(0 0 0.4px rgba(114, 47, 55, 0.4))',
              }}
              loading="lazy"
            />
            {/* High-contrast solid dark burgundy count text */}
            <span className="text-[12px] sm:text-[11.5px] leading-none tabular-nums font-bold text-brand-burgundy">
              {item.count}
            </span>
          </button>
        );
      })}

      {/* Secondary neutral + button */}
      {onOpenPicker && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPicker(e.currentTarget);
          }}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100/80 hover:bg-stone-200/80 border border-stone-200 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer shadow-2xs"
          title="Thêm cảm xúc khác"
          aria-label="Thêm cảm xúc khác"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
