import React, { useEffect, useRef, useState } from 'react';

interface StreakFlameProps {
  streakCount: number;
  isActive: boolean;
  forceCelebrate?: boolean;
  onCelebrationEnd?: () => void;
  className?: string;
  size?: number;
}

/**
 * StreakFlame Component
 *
 * Deterministic SVG flame with 3 states:
 * - INACTIVE: Gray (#A8A29E), no glow, no particles. (has_checked_in_today === false)
 * - ACTIVE: Warm orange/gold (#F97316 / #FBBF24), subtle static glow, no continuous loop. (has_checked_in_today === true)
 * - JUST INCREASED: One-shot celebration (~800ms) with bounce and 4 tiny rising warm sparks. (checkin_created === true)
 *
 * Honors prefers-reduced-motion. Does not shift layout or interfere with marquee.
 */
export const StreakFlame: React.FC<StreakFlameProps> = ({
  streakCount,
  isActive,
  forceCelebrate = false,
  onCelebrationEnd,
  className = '',
  size = 18,
}) => {
  // CRITICAL RULE: Active state MUST come strictly from has_checked_in_today (via isActive prop),
  // NEVER from streakCount > 0!
  const isStreakActive = Boolean(isActive);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const prevForceCelebrateRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Primary celebration trigger driven by server checkin_created === true
  // strictly one-shot on rising edge of forceCelebrate
  useEffect(() => {
    if (forceCelebrate && !prevForceCelebrateRef.current) {
      prevForceCelebrateRef.current = true;
      setIsCelebrating(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsCelebrating(false);
        onCelebrationEnd?.();
      }, 850);
    } else if (!forceCelebrate) {
      prevForceCelebrateRef.current = false;
    }
  }, [forceCelebrate, onCelebrationEnd]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Deterministic sRGB colors (no ambiguous currentColor, no OS emoji)
  const outerFill = isStreakActive ? '#F97316' : '#E7E5E4';
  const outerStroke = isStreakActive ? '#EA580C' : '#A8A29E';
  const innerFill = isStreakActive ? '#FBBF24' : 'transparent';
  const innerStroke = isStreakActive ? '#F59E0B' : 'transparent';

  return (
    <span
      data-ui-role="streak-flame"
      data-streak-count={streakCount}
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Flame Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-colors duration-300 ${
          isCelebrating ? 'flame-celebrating' : ''
        }`}
        style={{
          filter: isStreakActive
            ? 'drop-shadow(0 1px 2px rgba(249, 115, 22, 0.35))'
            : 'none',
        }}
      >
        {/* Outer Flame */}
        <path
          d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
          fill={outerFill}
          stroke={outerStroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />
        {/* Inner Warm Core (accent) */}
        {isStreakActive && (
          <path
            d="M12 18.5a1.75 1.75 0 0 0 1.75-1.75c0-.65-.3-1.1-.6-1.5-.6-.9-1.15-1.5-1.15-2.25 0 .75-.55 1.35-1.15 2.25-.3.4-.6.85-.6 1.5A1.75 1.75 0 0 0 12 18.5z"
            fill={innerFill}
            stroke={innerStroke}
            strokeWidth="0.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}
      </svg>

      {/* Decorative Rising Sparks (One-Shot celebration only, 4 small particles) */}
      {isCelebrating && (
        <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span
            className="flame-spark-1 absolute rounded-full opacity-0"
            style={{
              width: 3.5,
              height: 3.5,
              backgroundColor: '#F59E0B',
              left: '25%',
              top: '20%',
            }}
          />
          <span
            className="flame-spark-2 absolute rounded-full opacity-0"
            style={{
              width: 4,
              height: 4,
              backgroundColor: '#F97316',
              left: '50%',
              top: '15%',
            }}
          />
          <span
            className="flame-spark-3 absolute rounded-full opacity-0"
            style={{
              width: 3,
              height: 3,
              backgroundColor: '#FBBF24',
              left: '70%',
              top: '25%',
            }}
          />
          <span
            className="flame-spark-4 absolute rounded-full opacity-0"
            style={{
              width: 3.5,
              height: 3.5,
              backgroundColor: '#EF4444',
              left: '40%',
              top: '10%',
            }}
          />
        </span>
      )}
    </span>
  );
};
