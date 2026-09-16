import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { useTodayDailyNeeds } from '../hooks';
import { DailyNeed } from '../types';

interface DailyNoteChipProps {
  note: DailyNeed;
}

const DailyNoteChip: React.FC<DailyNoteChipProps> = ({ note }) => {
  const isClickable = Boolean(note.author.user_id && note.author.user_id > 0);

  const authorBadge = (
    <div className="inline-flex items-center gap-1.5 group/author shrink-0">
      {note.author.avatar_url ? (
        <img
          src={note.author.avatar_url}
          alt={note.author.full_name}
          className="w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full object-cover border border-stone-200 shrink-0"
        />
      ) : (
        <div className="w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">
          {note.author.full_name.charAt(0)}
        </div>
      )}
      <span className="font-semibold text-[11px] sm:text-xs text-stone-600 group-hover/author:text-brand-burgundy transition-colors max-w-[80px] sm:max-w-[110px] truncate">
        {note.author.full_name}
      </span>
    </div>
  );

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-50 hover:bg-stone-100/90 border border-stone-200/70 text-xs shrink-0 whitespace-nowrap h-[28px] sm:h-[30px] transition-colors shadow-2xs">
      {isClickable ? (
        <Link
          to={`/users/${note.author.user_id}`}
          state={{
            fromApp: true,
            returnTo: '/',
            returnLabel: 'Về trang chủ',
            source: 'daily-needs-marquee',
          }}
          className="inline-flex items-center shrink-0"
          title={`Trang cá nhân của ${note.author.full_name}`}
          onClick={(e) => e.stopPropagation()}
        >
          {authorBadge}
        </Link>
      ) : (
        authorBadge
      )}
      <span className="text-stone-300 font-bold select-none">·</span>
      <span
        className="text-stone-800 text-xs font-normal max-w-[180px] sm:max-w-[280px] truncate"
        title={note.content}
      >
        {note.content}
      </span>
    </div>
  );
};

interface MarqueeLaneProps {
  notes: DailyNeed[];
  direction: 'rtl' | 'ltr';
  speedPxPerSec: number;
  laneKey: string;
  isPaused?: boolean;
}

const MarqueeLane: React.FC<MarqueeLaneProps> = ({
  notes,
  direction,
  speedPxPerSec,
  laneKey,
  isPaused = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const setARef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

  // Duplication logic: ensure Set A has at least 8 items to guarantee sequenceWidth >= 1200px
  // Prevents track from ever being shorter than the visible container
  const displayItems = useMemo(() => {
    if (notes.length === 0) return [];
    const repeatCount = Math.max(2, Math.ceil(8 / notes.length));
    const result: DailyNeed[] = [];
    for (let r = 0; r < repeatCount; r++) {
      for (const note of notes) {
        result.push(note);
      }
    }
    return result;
  }, [notes]);

  useEffect(() => {
    const track = trackRef.current;
    const setA = setARef.current;
    if (!track || !setA || displayItems.length === 0) return;

    const startAnimation = () => {
      if (!track || !setA) return;
      const sequenceWidth = setA.getBoundingClientRect().width;
      if (sequenceWidth <= 0) return;

      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }

      const durationMs = (sequenceWidth / speedPxPerSec) * 1000;

      // Row 1 (rtl): 0px -> -sequenceWidth (moves RIGHT -> LEFT)
      // Row 2 (ltr): -sequenceWidth -> 0px (moves LEFT -> RIGHT)
      const keyframes =
        direction === 'rtl'
          ? [
            { transform: 'translate3d(0px, 0, 0)' },
            { transform: `translate3d(-${sequenceWidth}px, 0, 0)` },
          ]
          : [
            { transform: `translate3d(-${sequenceWidth}px, 0, 0)` },
            { transform: 'translate3d(0px, 0, 0)' },
          ];

      const anim = track.animate(keyframes, {
        duration: durationMs,
        iterations: Infinity,
        easing: 'linear',
      });

      if (isPaused) {
        anim.pause();
      }

      animRef.current = anim;
    };

    // Trigger on mount / paint
    const rafId = requestAnimationFrame(() => {
      startAnimation();
    });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        startAnimation();
      });
      ro.observe(setA);
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }
    };
  }, [displayItems, direction, speedPxPerSec]);

  useEffect(() => {
    if (!animRef.current) return;
    if (isPaused) {
      animRef.current.pause();
    } else {
      animRef.current.play();
    }
  }, [isPaused]);

  return (
    <div className="relative overflow-hidden w-full min-w-0 h-[28px] sm:h-[30px] flex items-center">
      {/* Edge gradient masks for smooth entry and exit */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10" />

      {/* Moving continuous track */}
      <div
        ref={trackRef}
        className="flex w-max"
        style={{
          display: 'flex',
          width: 'max-content',
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
      >
        {/* Set A: Semantic primary set */}
        <div ref={setARef} className="flex items-center gap-2 shrink-0 pr-2">
          {displayItems.map((note, idx) =>
            note ? (
              <DailyNoteChip
                key={`${laneKey}-primary-${note.daily_need_id}-${idx}`}
                note={note}
              />
            ) : null
          )}
        </div>

        {/* Set B: Duplicate set for seamless infinite loop (hidden from screen readers) */}
        <div aria-hidden="true" className="flex items-center gap-2 shrink-0 pr-2">
          {displayItems.map((note, idx) =>
            note ? (
              <DailyNoteChip
                key={`${laneKey}-dup-${note.daily_need_id}-${idx}`}
                note={note}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

const DEFAULT_DAILY_NOTES: DailyNeed[] = [
  {
    daily_need_id: -1,
    content: 'Chào mừng bạn đến với Chợ PTITers! Đăng nhật ký hôm nay để giữ chuỗi.',
    note_date: '',
    created_at: '',
    updated_at: '',
    author: {
      user_id: 0,
      full_name: 'PTITers',
      avatar_url: null,
    },
  },
  {
    daily_need_id: -2,
    content: 'Trao đổi sách giáo trình, tài liệu học tập và đồ dùng sinh viên tiện lợi.',
    note_date: '',
    created_at: '',
    updated_at: '',
    author: {
      user_id: 0,
      full_name: 'Góc học tập',
      avatar_url: null,
    },
  },
  {
    daily_need_id: -3,
    content: 'Cần tìm bạn cùng phòng trọ hoặc nhượng lại phòng gần cơ sở Hà Đông.',
    note_date: '',
    created_at: '',
    updated_at: '',
    author: {
      user_id: 0,
      full_name: 'Sinh viên PTIT',
      avatar_url: null,
    },
  },
  {
    daily_need_id: -4,
    content: 'Chia sẻ nhu cầu hoặc trạng thái trong ngày để kết nối cùng bạn bè!',
    note_date: '',
    created_at: '',
    updated_at: '',
    author: {
      user_id: 0,
      full_name: 'Chợ PTIT',
      avatar_url: null,
    },
  },
];

export const DailyNeedsMarquee: React.FC = () => {
  const { data } = useTodayDailyNeeds();

  // Always guaranteed to have notes: if data?.items is empty/null, use DEFAULT_DAILY_NOTES
  const allNotes = useMemo(() => {
    const items = data?.items || [];
    if (items.length > 0) {
      return items.slice(0, 10);
    }
    return DEFAULT_DAILY_NOTES;
  }, [data?.items]);

  const [isHovered, setIsHovered] = useState(false);

  // Distribute items across two lanes so both lanes always run:
  // If 1 note, both lanes run with that note.
  // If multiple notes, row 1 takes even indices, row 2 takes odd indices.
  const row1Notes = useMemo(
    () => (allNotes.length === 1 ? allNotes : allNotes.filter((_, idx) => idx % 2 === 0)),
    [allNotes]
  );
  const row2Notes = useMemo(
    () => (allNotes.length === 1 ? allNotes : allNotes.filter((_, idx) => idx % 2 === 1)),
    [allNotes]
  );

  return (
    <div
      className="mb-3 sm:mb-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex items-stretch overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left attached ribbon/tab: flush with container left edge, seamlessly integrated */}
      <div
        className="w-8 sm:w-9 bg-brand-burgundy flex items-center justify-center shrink-0 self-stretch select-none"
        title="Nhật ký hôm nay"
        aria-label="Nhật ký hôm nay"
      >
        <Megaphone className="w-4 h-4 text-amber-300 shrink-0" />
      </div>

      {/* Right content area: pure white background holding two opposite marquee lanes */}
      <div className="flex-1 min-w-0 py-1.5 sm:py-2 pl-2 pr-1 flex flex-col justify-center gap-1.5 overflow-hidden">
        {/* Lane 1: RIGHT -> LEFT (speed 40 px/sec) */}
        <MarqueeLane
          notes={row1Notes}
          direction="rtl"
          speedPxPerSec={40}
          laneKey="lane-top"
          isPaused={isHovered}
        />

        {/* Lane 2: LEFT -> RIGHT (speed 36 px/sec) */}
        <MarqueeLane
          notes={row2Notes}
          direction="ltr"
          speedPxPerSec={36}
          laneKey="lane-bottom"
          isPaused={isHovered}
        />
      </div>
    </div>
  );
};


