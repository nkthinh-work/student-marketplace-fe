import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface NativeVideoPlayerProps {
  videoUrl: string;
  posterUrl?: string | null;
  title?: string;
  className?: string;
}

export const NativeVideoPlayer: React.FC<NativeVideoPlayerProps> = ({
  videoUrl,
  posterUrl,
  title,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [videoUrl]);

  const handleRetry = () => {
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <div className={`relative w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[340px] mx-auto ${className}`}>
      {/* 9:16 Phone-frame styled container */}
      <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black shadow-xl border border-white/10">
        {hasError ? (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white bg-stone-900">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
            <p className="text-sm font-semibold text-stone-200">
              Không thể phát video Tutorial này.
            </p>
            <p className="text-xs text-stone-400 mt-1 mb-4">
              Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            poster={posterUrl || undefined}
            onError={() => setHasError(true)}
            className="h-full w-full object-contain bg-black"
            aria-label={title || 'Video hướng dẫn'}
          >
            Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
          </video>
        )}
      </div>
    </div>
  );
};
