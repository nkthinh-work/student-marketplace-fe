import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  getNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from '../sound';

interface NotificationSoundToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const NotificationSoundToggle: React.FC<NotificationSoundToggleProps> = ({
  className = '',
  showLabel = true,
}) => {
  const [enabled, setEnabled] = useState<boolean>(getNotificationSoundEnabled);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
        setEnabled(customEvent.detail.enabled);
      } else {
        setEnabled(getNotificationSoundEnabled());
      }
    };

    window.addEventListener('ptit_sound_preference_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ptit_sound_preference_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleToggle = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    setNotificationSoundEnabled(nextState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          {enabled ? (
            <Volume2 className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-stone-400 dark:text-stone-500" />
          )}
          <span className="text-xs font-medium text-stone-700 dark:text-stone-300 select-none">
            Âm thanh thông báo
          </span>
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Bật hoặc tắt âm thanh thông báo"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-burgundy/30 focus:ring-offset-1 ${
          enabled ? 'bg-brand-burgundy' : 'bg-stone-300 dark:bg-stone-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};
