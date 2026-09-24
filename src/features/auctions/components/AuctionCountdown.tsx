import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { AuctionStatus } from '../types';
import { parseServerDateTime } from '@/lib/formatters';
import { Loader2 } from 'lucide-react';

interface AuctionCountdownProps {
  status: AuctionStatus;
  startsAt: string;
  endsAt: string;
  serverTime?: string;
  onExpire?: () => void;
}

export const AuctionCountdown: React.FC<AuctionCountdownProps> = ({
  status,
  startsAt,
  endsAt,
  serverTime,
  onExpire,
}) => {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // 1. Authoritative server offset: computed when serverTime snapshot arrives
  const serverOffsetMs = useMemo(() => {
    if (!serverTime) return 0;
    const parsedServer = parseServerDateTime(serverTime);
    return parsedServer > 0 ? parsedServer - Date.now() : 0;
  }, [serverTime]);

  // 2. Local ticking clock state: primitive timestamp updated every 1000ms
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // 3. Ticking interval effect
  useEffect(() => {
    if (status !== 'ACTIVE' && status !== 'SCHEDULED') return;

    // Immediately update on mount / status change
    setNowMs(Date.now());

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [status, startsAt, endsAt]);

  // 4. Tab visibility change: refresh immediately when user focuses tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setNowMs(Date.now());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 5. Derive effective server time and remaining duration
  const effectiveServerNow = nowMs + serverOffsetMs;
  const targetTimeMs =
    status === 'SCHEDULED'
      ? parseServerDateTime(startsAt)
      : parseServerDateTime(endsAt);

  const remainingMs = Math.max(0, targetTimeMs - effectiveServerNow);
  const isExpired = remainingMs <= 0;

  // 6. Safeguarded onExpire callback (fires exactly once per expiration)
  const hasExpiredRef = useRef<boolean>(false);

  useEffect(() => {
    hasExpiredRef.current = false;
  }, [endsAt, startsAt, status]);

  useEffect(() => {
    if (isExpired && (status === 'ACTIVE' || status === 'SCHEDULED') && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpireRef.current?.();
    }
  }, [isExpired, status]);

  // 7. Time breakdown calculations
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 8. Static / terminal states
  if (status === 'ENDED') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        Phiên đấu giá đã kết thúc
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Phiên đấu giá đã bị hủy
      </div>
    );
  }

  // When active but countdown expired, show transition banner while refetching
  if (isExpired && status === 'ACTIVE') {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
        Đang chốt kết quả phiên đấu giá...
      </div>
    );
  }

  const label = status === 'SCHEDULED' ? 'Bắt đầu sau:' : 'Thời gian còn lại:';

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-xs font-medium text-gray-500 flex items-center gap-1.5"
        style={{ color: '#4B5563', WebkitTextFillColor: '#4B5563' }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        {label}
      </span>
      <div className="flex items-center gap-2">
        {days > 0 && (
          <div
            className="flex flex-col items-center bg-gray-900 text-white rounded-lg px-2.5 py-1 min-w-[42px]"
            style={{ backgroundColor: '#0F172A', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
          >
            <span
              className="text-base font-bold leading-none"
              style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
            >
              {days}
            </span>
            <span
              className="text-[10px] text-gray-400 mt-0.5"
              style={{ color: '#94A3B8', WebkitTextFillColor: '#94A3B8' }}
            >
              ngày
            </span>
          </div>
        )}
        <div
          className="flex flex-col items-center bg-gray-900 text-white rounded-lg px-2.5 py-1 min-w-[42px]"
          style={{ backgroundColor: '#0F172A', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
        >
          <span
            className="text-base font-bold leading-none"
            style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
          >
            {String(hours).padStart(2, '0')}
          </span>
          <span
            className="text-[10px] text-gray-400 mt-0.5"
            style={{ color: '#94A3B8', WebkitTextFillColor: '#94A3B8' }}
          >
            giờ
          </span>
        </div>
        <span
          className="text-gray-400 font-bold"
          style={{ color: '#94A3B8', WebkitTextFillColor: '#94A3B8' }}
        >
          :
        </span>
        <div
          className="flex flex-col items-center bg-gray-900 text-white rounded-lg px-2.5 py-1 min-w-[42px]"
          style={{ backgroundColor: '#0F172A', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
        >
          <span
            className="text-base font-bold leading-none"
            style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
          >
            {String(minutes).padStart(2, '0')}
          </span>
          <span
            className="text-[10px] text-gray-400 mt-0.5"
            style={{ color: '#94A3B8', WebkitTextFillColor: '#94A3B8' }}
          >
            phút
          </span>
        </div>
        <span
          className="text-gray-400 font-bold"
          style={{ color: '#94A3B8', WebkitTextFillColor: '#94A3B8' }}
        >
          :
        </span>
        <div
          className="flex flex-col items-center bg-emerald-600 text-white rounded-lg px-2.5 py-1 min-w-[42px]"
          style={{ backgroundColor: '#059669', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
        >
          <span
            className="text-base font-bold leading-none"
            style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
          >
            {String(seconds).padStart(2, '0')}
          </span>
          <span
            className="text-[10px] text-emerald-200 mt-0.5"
            style={{ color: '#A7F3D0', WebkitTextFillColor: '#A7F3D0' }}
          >
            giây
          </span>
        </div>
      </div>
    </div>
  );
};
