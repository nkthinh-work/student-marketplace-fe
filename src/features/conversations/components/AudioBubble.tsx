import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { formatAudioDuration } from '../utils/audioDuration';
import { threadAudioCoordinator } from '../utils/audioCoordinator';

interface AudioBubbleProps {
  url: string;
  isMine?: boolean;
  attachmentId?: number;
  durationMs?: number | null;
}

export const AudioBubble: React.FC<AudioBubbleProps> = ({
  url,
  isMine = false,
  attachmentId,
  durationMs,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [browserDuration, setBrowserDuration] = useState<number | null>(null);

  // Unique identifier for thread playback coordination
  const bubbleIdRef = useRef<string>(
    attachmentId ? `audio-att-${attachmentId}` : `audio-${Math.random()}`
  );
  const bubbleId = bubbleIdRef.current;

  // Subscribe to thread-level audio coordinator
  useEffect(() => {
    const unsubscribe = threadAudioCoordinator.subscribe((playingId) => {
      if (playingId !== bubbleId) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    });

    return () => {
      unsubscribe();
      threadAudioCoordinator.clearActive(bubbleId);
    };
  }, [bubbleId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      threadAudioCoordinator.clearActive(bubbleId);
    };
  }, [bubbleId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setBrowserDuration(audio.duration);
      }
    };

    const onDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setBrowserDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      if (Number.isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      threadAudioCoordinator.clearActive(bubbleId);
    };

    const onError = () => {
      setIsPlaying(false);
      threadAudioCoordinator.clearActive(bubbleId);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [bubbleId]);

  // Duration precedence:
  // 1. attachment.duration_ms (converted to seconds)
  // 2. browser-extracted audio.duration (finite and positive)
  // 3. null (renders "--:--")
  const serverDurationSec =
    durationMs !== undefined &&
      durationMs !== null &&
      Number.isFinite(durationMs) &&
      durationMs > 0
      ? durationMs / 1000
      : null;

  const effectiveDuration =
    serverDurationSec ??
    (browserDuration !== null &&
      Number.isFinite(browserDuration) &&
      browserDuration > 0
      ? browserDuration
      : null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      threadAudioCoordinator.clearActive(bubbleId);
    } else {
      threadAudioCoordinator.setActive(bubbleId);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          threadAudioCoordinator.clearActive(bubbleId);
        });
    }
  }, [isPlaying, bubbleId]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const targetValue = Number(e.target.value);
    if (!Number.isFinite(targetValue)) return;

    const maxLimit = effectiveDuration ?? audio.duration ?? 0;
    const clampedTime = Math.max(0, Math.min(targetValue, maxLimit));

    audio.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const maxSeek = effectiveDuration && effectiveDuration > 0 ? effectiveDuration : 100;
  const clampedCurrent = Math.max(0, Math.min(currentTime, maxSeek));

  return (
    <div
      className={`rounded-2xl p-2 sm:p-2.5 w-full max-w-[260px] min-w-0 mb-2 transition-all box-border overflow-hidden ${isMine
          ? 'bg-rose-950/40 border border-rose-800/60 text-white'
          : 'bg-stone-50 border border-stone-200 text-stone-900'
        }`}
    >
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 w-full">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-2xs ${isMine
              ? 'bg-white text-brand-burgundy hover:bg-rose-50'
              : 'bg-brand-burgundy text-white hover:bg-brand-burgundy/90'
            }`}
          aria-label={isPlaying ? 'Tạm dừng tin nhắn thoại' : 'Phát tin nhắn thoại'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          ) : (
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform / Progress Slider */}
        <div className="flex-1 min-w-0">
          <div className="relative flex items-center h-5">
            <input
              type="range"
              min={0}
              max={maxSeek}
              step={0.1}
              value={clampedCurrent}
              onChange={handleSeek}
              disabled={!effectiveDuration || effectiveDuration <= 0}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all ${isMine
                  ? 'accent-white bg-rose-900/60'
                  : 'accent-brand-burgundy bg-stone-200'
                }`}
            />
          </div>

          <div
            className={`flex items-center justify-between text-[10px] font-medium mt-0.5 ${isMine ? 'text-rose-200' : 'text-stone-500'
              }`}
          >
            <span>{formatAudioDuration(currentTime)}</span>
            <div className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 opacity-60" />
              <span>{formatAudioDuration(effectiveDuration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
