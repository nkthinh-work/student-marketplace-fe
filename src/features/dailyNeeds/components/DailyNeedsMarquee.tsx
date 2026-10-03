import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecentDailyNeeds } from '../hooks';
import { DailyNeed } from '../types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DailyNeedModal } from './DailyNeedModal';
import { Sparkles } from 'lucide-react';

interface DailyNoteChipProps {
  note: DailyNeed;
}

const DailyNoteChip: React.FC<DailyNoteChipProps> = ({ note }) => {
  const isClickable = Boolean(note.author.public_id && note.author.public_id.trim().length > 0);


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
          to={`/profile/${note.author.public_id}`}
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
  slots: DailyNeed[];
  direction: 'rtl' | 'ltr';
  speedPxPerSec: number;
  laneKey: string;
  isSecondaryRow?: boolean;
}

const MarqueeLane: React.FC<MarqueeLaneProps> = ({
  slots,
  direction,
  speedPxPerSec,
  laneKey,
  isSecondaryRow = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const setARef = useRef<HTMLDivElement>(null);
  const offsetPxRef = useRef<number>(0);

  // Reduced motion support
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    (document.documentElement.getAttribute('data-reduced-motion') === 'true' ||
      document.body.classList.contains('reduced-motion'));

  // Deterministic requestAnimationFrame motion driver
  useEffect(() => {
    if (isReducedMotion || slots.length === 0) return;

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

      if (dt > 100) dt = 100;
      if (dt < 0) dt = 0;

      offsetPxRef.current += (speedPxPerSec * dt) / 1000;
      if (offsetPxRef.current >= trackAWidth) {
        offsetPxRef.current %= trackAWidth;
      }

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
  }, [slots, speedPxPerSec, direction, isReducedMotion]);

  if (isReducedMotion) {
    return (
      <div
        className="relative w-full min-w-0 h-[28px] sm:h-[30px] flex items-center overflow-x-auto hide-scrollbar"
        aria-hidden={isSecondaryRow}
      >
        <div className="flex items-center gap-2 shrink-0 pr-2">
          {slots.map((note, slotIndex) => (
            <DailyNoteChip
              key={`${laneKey}-reduced-${note.daily_need_id}-${slotIndex}`}
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
      aria-hidden={isSecondaryRow}
    >
      <div
        ref={stripRef}
        data-marquee-strip={direction}
        data-marquee-moving-strip="true"
        className={`flex shrink-0 w-max will-change-transform journal-marquee-strip-${direction}`}
        style={{
          transform: 'translate3d(0px, 0, 0)',
        }}
      >
        {/* Logical Track A: 10 presentation slots */}
        <div ref={setARef} data-marquee-track="A" className="flex items-center gap-2 shrink-0 pr-2">
          {slots.map((note, slotIndex) => (
            <DailyNoteChip
              key={`${laneKey}-trackA-${note.daily_need_id}-${slotIndex}`}
              note={note}
            />
          ))}
        </div>

        {/* Logical Track B: Purely presentational duplicate for seamless infinite animation */}
        <div aria-hidden="true" data-marquee-track="B" className="flex items-center gap-2 shrink-0 pr-2">
          {slots.map((note, slotIndex) => (
            <DailyNoteChip
              key={`${laneKey}-trackB-${note.daily_need_id}-${slotIndex}`}
              note={note}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const DailyNeedsMarquee: React.FC = () => {
  const { data, isLoading, isError } = useRecentDailyNeeds(10);
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Maximum 10 REAL daily journal items across dates
  const realNotes = useMemo(() => {
    const items = data?.items || [];
    return items.slice(0, 10);
  }, [data?.items]);

  // Fill presentation pool to exactly 10 slots if 1 <= realNotes.length < 10
  const displaySlots = useMemo(() => {
    if (realNotes.length === 0) return [];
    if (realNotes.length >= 10) return realNotes.slice(0, 10);
    const slots: DailyNeed[] = [];
    for (let i = 0; i < 10; i++) {
      const item = realNotes[i % realNotes.length];
      if (item) {
        slots.push(item);
      }
    }
    return slots;
  }, [realNotes]);

  // Row 1 uses displaySlots directly
  const row1Slots = displaySlots;

  // Row 2 uses the same 10-slot pool rotated/offset by 1 slot deterministically
  const row2Slots = useMemo(() => {
    if (displaySlots.length === 0) return [];
    return [...displaySlots.slice(1), ...displaySlots.slice(0, 1)];
  }, [displaySlots]);

  const handleShareClick = () => {
    if (!firebaseUser) {
      navigate('/login');
    } else {
      setIsModalOpen(true);
    }
  };

  const hasNotes = realNotes.length > 0;

  return (
    <>
      <div className="mb-3 sm:mb-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex items-stretch overflow-hidden">
        {/* Left attached speaker/megaphone badge */}
        <div
          data-ui-role="journal-speaker"
          className="ui-journal-speaker w-8 sm:w-9 flex items-center justify-center shrink-0 self-stretch select-none m-0 p-0 relative z-10"
          title="Nhật ký sinh viên"
          aria-label="Nhật ký sinh viên"
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

        {/* Right content area */}
        <div
          data-ui-role="marquee-viewport"
          className="flex-1 min-w-0 py-1.5 sm:py-2 pl-0 pr-2 flex flex-col justify-center overflow-hidden bg-white m-0 border-l-0"
          style={{ paddingLeft: 0, marginLeft: 0, borderLeftWidth: 0 }}
        >
          {isLoading ? (
            /* Loading Skeleton: Small shimmer bar, no false empty flash */
            <div className="flex items-center gap-2 px-3 py-1.5 animate-pulse">
              <div className="h-5 w-24 bg-stone-200/80 rounded-lg shrink-0" />
              <div className="h-5 w-40 bg-stone-100 rounded-lg shrink-0 hidden sm:block" />
              <div className="h-5 flex-1 bg-stone-100/60 rounded-lg" />
            </div>
          ) : isError ? (
            /* Safe compact unavailable state */
            <div className="flex items-center px-3 py-1 text-xs text-stone-400">
              <span>Tạm thời không thể tải nhật ký.</span>
            </div>
          ) : !hasNotes ? (
            /* Dedicated Zero-Journal Clean Empty State: NO fake journal card */
            <div className="flex items-center justify-between gap-2 px-3 py-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-stone-500 truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Chưa có nhật ký nào. Hãy là người đầu tiên chia sẻ ✨</span>
              </div>
              <button
                type="button"
                onClick={handleShareClick}
                className="shrink-0 text-xs font-semibold text-brand-burgundy hover:text-brand-burgundy-dark hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Chia sẻ ngay</span>
              </button>
            </div>
          ) : (
            /* Always render TWO continuous marquee lanes in opposite directions when >=1 real note exists */
            <div className="flex flex-col gap-1.5">
              <MarqueeLane
                slots={row1Slots}
                direction="rtl"
                speedPxPerSec={40}
                laneKey="lane-top"
                isSecondaryRow={false}
              />
              <MarqueeLane
                slots={row2Slots}
                direction="ltr"
                speedPxPerSec={36}
                laneKey="lane-bottom"
                isSecondaryRow={true}
              />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <DailyNeedModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

