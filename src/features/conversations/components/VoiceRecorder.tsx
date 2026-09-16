import {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { Square, Trash2, Send, Play, Pause, AlertCircle } from 'lucide-react';
import { formatAudioDuration } from '../utils/audioDuration';
import { threadAudioCoordinator } from '../utils/audioCoordinator';

export interface VoiceRecorderHandle {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
}

interface VoiceRecorderProps {
  onSendVoice: (audioFile: File, voiceDurationMs: number) => void;
  onCancel: () => void;
}

const MAX_RECORDING_SECONDS = 300; // 5 minutes cap

export const VoiceRecorder = forwardRef<VoiceRecorderHandle, VoiceRecorderProps>(
  ({ onSendVoice, onCancel }, ref) => {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Generation token to guard against race conditions with rapid start/cancel/start
    const recordingSessionRef = useRef<number>(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const activeStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recordingStartRef = useRef<number>(0);
    const recordedDurationMsRef = useRef<number>(0);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const previewUrlRef = useRef<string | null>(null);

    // Helper: Safely revoke current Object URL
    const revokePreviewUrl = useCallback(() => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setAudioBlob(null);
      setIsPlayingPreview(false);
    }, []);

    // Helper: Stop all active microphone tracks
    const stopStreamTracks = useCallback(() => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // Ignore track stop errors
          }
        });
        activeStreamRef.current = null;
      }
    }, []);

    // Helper: Clear active timer interval
    const clearTimer = useCallback(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    // Helper: Stop preview audio playback
    const stopPreviewAudio = useCallback(() => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      setIsPlayingPreview(false);
      threadAudioCoordinator.clearActive('voice-recorder-preview');
    }, []);

    // Stop active recording session
    const stopRecording = useCallback(() => {
      clearTimer();

      const elapsedMs = Math.max(
        0,
        Math.round(performance.now() - recordingStartRef.current)
      );
      recordedDurationMsRef.current = elapsedMs;

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore stop errors if already stopping
        }
      }
      stopStreamTracks();
      setIsRecording(false);
    }, [clearTimer, stopStreamTracks]);

    // Cancel recording session and clean up all resources
    const cancelRecording = useCallback(() => {
      recordingSessionRef.current += 1;
      clearTimer();
      stopPreviewAudio();
      stopStreamTracks();

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore
        }
      }
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      revokePreviewUrl();
      setIsRecording(false);
      setElapsedSeconds(0);
      setErrorMessage(null);
    }, [clearTimer, stopPreviewAudio, stopStreamTracks, revokePreviewUrl]);

    // Explicit user-driven recording entry point
    const startRecording = useCallback(async () => {
      // 1. Invalidate any pending async sessions and clean up prior recordings
      const currentSession = ++recordingSessionRef.current;
      clearTimer();
      stopPreviewAudio();
      stopStreamTracks();
      revokePreviewUrl();
      setErrorMessage(null);
      setElapsedSeconds(0);
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // 2. Generation token guard: if cancelled while awaiting permission, abort immediately
        if (recordingSessionRef.current !== currentSession) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStreamRef.current = stream;

        // 3. Resolve supported audio container MIME type
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            mimeType = 'audio/ogg;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else {
            mimeType = '';
          }
        }

        const options = mimeType ? { mimeType } : undefined;
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (recordingSessionRef.current !== currentSession) {
            return;
          }
          const actualMime = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: actualMime });
          setAudioBlob(blob);

          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          setPreviewUrl(url);
          setIsRecording(false);
        };

        mediaRecorder.onerror = () => {
          setErrorMessage('Đã xảy ra lỗi trong quá trình ghi âm.');
          cancelRecording();
        };

        // 4. Start recording and single wall-clock timer
        mediaRecorder.start(250); // Timeslice 250ms chunks
        recordingStartRef.current = performance.now();
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          const elapsed = Math.floor(
            (performance.now() - recordingStartRef.current) / 1000
          );
          setElapsedSeconds(elapsed);
          if (elapsed >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
        }, 200);
      } catch (err) {
        if (recordingSessionRef.current === currentSession) {
          setErrorMessage(
            'Không thể truy cập microphone. Vui lòng cấp quyền ghi âm.'
          );
          setIsRecording(false);
        }
      }
    }, [clearTimer, stopPreviewAudio, stopStreamTracks, revokePreviewUrl, cancelRecording, stopRecording]);

    // Expose control handles to parent MessageComposer
    useImperativeHandle(
      ref,
      () => ({
        startRecording,
        stopRecording,
        cancelRecording,
      }),
      [startRecording, stopRecording, cancelRecording]
    );

    // Thread audio coordinator subscription for local preview
    useEffect(() => {
      const unsubscribe = threadAudioCoordinator.subscribe((playingId) => {
        if (playingId !== 'voice-recorder-preview') {
          if (previewAudioRef.current && !previewAudioRef.current.paused) {
            previewAudioRef.current.pause();
            setIsPlayingPreview(false);
          }
        }
      });
      return () => unsubscribe();
    }, []);

    // Unmount cleanup: cancel any recording session, revoke object URLs, stop streams
    useEffect(() => {
      return () => {
        recordingSessionRef.current += 1;
        if (timerRef.current) clearInterval(timerRef.current);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach((t) => t.stop());
        }
      };
    }, []);

    const handleSend = () => {
      if (!audioBlob) return;
      stopPreviewAudio();

      const extension = audioBlob.type.includes('mp4')
        ? 'm4a'
        : audioBlob.type.includes('ogg')
        ? 'ogg'
        : 'webm';

      const file = new File(
        [audioBlob],
        `voice_note_${Date.now()}.${extension}`,
        {
          type: audioBlob.type || 'audio/webm',
        }
      );

      const durationMs =
        recordedDurationMsRef.current > 0
          ? recordedDurationMsRef.current
          : elapsedSeconds * 1000;

      revokePreviewUrl();
      onSendVoice(file, durationMs);
    };

    const togglePlayPreview = () => {
      const audio = previewAudioRef.current;
      if (!audio) return;

      if (isPlayingPreview) {
        audio.pause();
        setIsPlayingPreview(false);
        threadAudioCoordinator.clearActive('voice-recorder-preview');
      } else {
        threadAudioCoordinator.setActive('voice-recorder-preview');
        audio
          .play()
          .then(() => setIsPlayingPreview(true))
          .catch(() => setIsPlayingPreview(false));
      }
    };

    if (errorMessage) {
      return (
        <div className="flex items-center justify-between p-3 bg-rose-50 border-t border-rose-200">
          <div className="flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              cancelRecording();
              onCancel();
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 font-medium"
          >
            Đóng
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between px-2 py-2 sm:px-3 sm:py-2.5 bg-rose-50/50 border-t border-rose-200 animate-in fade-in duration-150">
        {isRecording ? (
          <>
            {/* Recording in progress */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping absolute" />
                <span className="w-3.5 h-3.5 rounded-full bg-rose-600 relative" />
              </div>
              <span className="text-xs font-bold text-rose-700 tracking-wider">
                {formatAudioDuration(elapsedSeconds)} / 5:00
              </span>
              <span className="text-xs text-stone-500 hidden sm:inline">
                Đang ghi âm tin nhắn thoại...
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  cancelRecording();
                  onCancel();
                }}
                className="p-2 text-stone-500 hover:text-stone-800 hover:bg-rose-100 rounded-full transition-colors"
                title="Hủy ghi âm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Dừng lại</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview recorded audio */}
            {previewUrl && (
              <audio
                ref={previewAudioRef}
                src={previewUrl}
                preload="auto"
                onEnded={() => {
                  setIsPlayingPreview(false);
                  threadAudioCoordinator.clearActive('voice-recorder-preview');
                }}
              />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayPreview}
                className="w-9 h-9 rounded-full bg-brand-burgundy text-white flex items-center justify-center hover:bg-brand-burgundy/90 transition-colors shadow-xs"
              >
                {isPlayingPreview ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-stone-900">
                  Tin nhắn thoại (
                  {formatAudioDuration(
                    recordedDurationMsRef.current > 0
                      ? recordedDurationMsRef.current / 1000
                      : elapsedSeconds
                  )}
                  )
                </span>
                <span className="text-[10px] text-stone-500">
                  Nhấn gửi để hoàn tất
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  cancelRecording();
                  onCancel();
                }}
                className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-100 rounded-full transition-colors"
                title="Xóa bản ghi"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy/90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
);
