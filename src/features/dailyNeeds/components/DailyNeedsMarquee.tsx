import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
          referrerPolicy="no-referrer"
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
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-50 hover:bg-stone-100/90 border border-stone-200 text-xs shrink-0 whitespace-nowrap h-[28px] sm:h-[30px] transition-colors shadow-2xs">
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
}

const MarqueeLane: React.FC<MarqueeLaneProps> = ({
  notes,
  direction,
  speedPxPerSec,
  laneKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const setARef = useRef<HTMLDivElement>(null);
  const offsetPxRef = useRef<number>(0);

  // Reduced motion support: active if document explicitly declares reduced motion
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    (document.documentElement.getAttribute('data-reduced-motion') === 'true' ||
      document.body.classList.contains('reduced-motion'));

  // Default to 3 repeats so Track A is wide enough on desktop prior to measurement
  const [repeatCount, setRepeatCount] = useState<number>(3);

  // Construct display items for Track A
  const displayItems = useMemo(() => {
    if (notes.length === 0) return [];
    const count = Math.max(1, repeatCount);
    const result: { note: DailyNeed; repeatIndex: number }[] = [];
    for (let r = 0; r < count; r++) {
      for (const note of notes) {
        result.push({ note, repeatIndex: r });
      }
    }
    return result;
  }, [notes, repeatCount]);

  // Derive necessary repeatCount so Track A width covers visible container + 50% margin
  useEffect(() => {
    if (notes.length === 0) return;

    const measureAndAdjust = () => {
      if (!containerRef.current || !setARef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const trackAWidth = setARef.current.getBoundingClientRect().width;

      if (containerWidth <= 0 || trackAWidth <= 0) return;

      const estimatedBaseWidth = trackAWidth / Math.max(1, repeatCount);
      if (estimatedBaseWidth > 0) {
        const neededRepeat = Math.min(
          12,
          Math.max(2, Math.ceil((containerWidth * 1.5) / estimatedBaseWidth) + 1)
        );
        if (neededRepeat !== repeatCount) {
          setRepeatCount(neededRepeat);
        }
      }
    };

    const rafId = requestAnimationFrame(measureAndAdjust);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        requestAnimationFrame(measureAndAdjust);
      });
      ro.observe(containerRef.current);
    }

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        requestAnimationFrame(measureAndAdjust);
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }, [notes, repeatCount]);

  // Deterministic requestAnimationFrame motion driver
  // Mutates ONLY stripRef.current.style.transform directly on the DOM element
  useEffect(() => {
    if (isReducedMotion || notes.length === 0) return;

    let animId: number | null = null;
    let previousTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!stripRef.current || !setARef.current) {
        animId = requestAnimationFrame(step);
        return;
      }

      const trackAWidth = setARef.current.getBoundingClientRect().width;
      if (trackAWidth <= 0) {
        animId = requestAnimationFrame(step);
        return;
      }

      if (previousTimestamp === null) {
        previousTimestamp = timestamp;
      }

      let dt = timestamp - previousTimestamp;
      previousTimestamp = timestamp;

      // Clamp dt to avoid jumps after background tab pause
      if (dt > 100) dt = 100;
      if (dt < 0) dt = 0;

      offsetPxRef.current += (speedPxPerSec * dt) / 1000;
      if (offsetPxRef.current >= trackAWidth) {
        offsetPxRef.current %= trackAWidth;
      }

      // RTL moves strip leftwards (-offset); LTR moves strip rightwards (offset - trackAWidth)
      const x = direction === 'rtl' ? -offsetPxRef.current : offsetPxRef.current - trackAWidth;
      stripRef.current.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, [notes, repeatCount, speedPxPerSec, direction, isReducedMotion]);

  if (isReducedMotion) {
    return (
      <div className="relative w-full min-w-0 h-[28px] sm:h-[30px] flex items-center overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 shrink-0 pr-2">
          {notes.map((note) => (
            <DailyNoteChip
              key={`${laneKey}-reduced-${note.daily_need_id}`}
              note={note}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full min-w-0 h-[28px] sm:h-[30px] flex items-center overflow-hidden"
    >
      {/* Moving continuous strip: Driven purely by deterministic rAF mutating transform */}
      <div
        ref={stripRef}
        data-marquee-strip={direction}
        data-marquee-moving-strip="true"
        className={`flex shrink-0 w-max will-change-transform journal-marquee-strip-${direction}`}
        style={{
          transform: 'translate3d(0px, 0, 0)',
        }}
      >
        {/* Logical Track A: Semantic primary set */}
        <div ref={setARef} data-marquee-track="A" className="flex items-center gap-2 shrink-0 pr-2">
          {displayItems.map((item, idx) => (
            <DailyNoteChip
              key={`${laneKey}-trackA-${item.repeatIndex}-${idx}-${item.note.daily_need_id}`}
              note={item.note}
            />
          ))}
        </div>

        {/* Logical Track B: Exact structural duplicate of Track A for seamless infinite loop */}
        <div aria-hidden="true" data-marquee-track="B" className="flex items-center gap-2 shrink-0 pr-2">
          {displayItems.map((item, idx) => (
            <DailyNoteChip
              key={`${laneKey}-trackB-${item.repeatIndex}-${idx}-${item.note.daily_need_id}`}
              note={item.note}
            />
          ))}
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
    <div className="mb-3 sm:mb-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex items-stretch overflow-hidden">
      {/* Left attached speaker/megaphone badge: flush with container and marquee viewport */}
      <div
        data-ui-role="journal-speaker"
        className="ui-journal-speaker w-8 sm:w-9 flex items-center justify-center shrink-0 self-stretch select-none m-0 p-0 relative z-10"
        title="Nhật ký hôm nay"
        aria-label="Nhật ký hôm nay"
        style={{ backgroundColor: '#722F37', marginRight: '-1px' }}
      >
        <svg
          data-ui-role="journal-megaphone"
          className="ui-journal-megaphone w-4 h-4 shrink-0"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="#FCD34D"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ color: '#FCD34D', stroke: '#FCD34D' }}
        >
          <path
            d="m3 11 18-5v12L3 14v-3z"
            stroke="#FCD34D"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.6 16.8a3 3 0 1 1-5.8-1.6"
            stroke="#FCD34D"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Right content area: seamless white background holding two marquee lanes with 0px left gutter */}
      <div
        data-ui-role="marquee-viewport"
        className="flex-1 min-w-0 py-1.5 sm:py-2 pl-0 pr-2 flex flex-col justify-center gap-1.5 overflow-hidden bg-white m-0 border-l-0"
        style={{ paddingLeft: 0, marginLeft: 0, borderLeftWidth: 0 }}
      >
        {/* Lane 1: RIGHT -> LEFT (speed 40 px/sec) */}
        <MarqueeLane
          notes={row1Notes}
          direction="rtl"
          speedPxPerSec={40}
          laneKey="lane-top"
        />

        {/* Lane 2: LEFT -> RIGHT (speed 36 px/sec) */}
        <MarqueeLane
          notes={row2Notes}
          direction="ltr"
          speedPxPerSec={36}
          laneKey="lane-bottom"
        />
      </div>
    </div>
  );
};


