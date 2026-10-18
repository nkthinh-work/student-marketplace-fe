import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  isWebPushSupported,
  getPushPermissionState,
  isPushSubscribed,
  requestPushPermissionAndSubscribe,
  unsubscribePushNotification,
} from '../pushNotification';

interface WebPushToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const WebPushToggle: React.FC<WebPushToggleProps> = ({
  className = '',
  showLabel = true,
}) => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const syncState = () => {
    const isSupp = isWebPushSupported();
    setSupported(isSupp);
    if (isSupp) {
      setPermission(getPushPermissionState());
      setSubscribed(isPushSubscribed());
    }
  };

  useEffect(() => {
    syncState();
    window.addEventListener('ptit_push_status_changed', syncState);
    return () => {
      window.removeEventListener('ptit_push_status_changed', syncState);
    };
  }, []);

  if (!supported) {
    return null; // Gracefully hidden on unsupported browsers
  }

  const isDenied = permission === 'denied';

  const handleToggle = async () => {
    if (loading) return;

    if (subscribed) {
      setLoading(true);
      await unsubscribePushNotification();
      setLoading(false);
      syncState();
    } else {
      if (isDenied) {
        alert('Quyền thông báo đang bị chặn trong trình duyệt. Vui lòng cho phép thông báo trong phần Cài đặt trang web của trình duyệt.');
        return;
      }
      setLoading(true);
      const res = await requestPushPermissionAndSubscribe();
      setLoading(false);
      if (!res.success && res.error) {
        alert(res.error);
      }
      syncState();
    }
  };

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          {subscribed ? (
            <Bell className="w-4 h-4 text-brand-burgundy" />
          ) : (
            <BellOff className="w-4 h-4 text-stone-400 dark:text-stone-500" />
          )}
          <div>
            <span className="text-xs font-medium text-stone-700 dark:text-stone-300 select-none block">
              Thông báo đẩy (Web Push)
            </span>
            {isDenied && (
              <span className="text-[10px] text-brand-price block">
                Bị chặn bởi trình duyệt
              </span>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={subscribed}
        aria-label="Bật hoặc tắt thông báo đẩy trình duyệt"
        disabled={loading}
        onClick={handleToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-burgundy/30 focus:ring-offset-1 disabled:opacity-50 ${
          subscribed ? 'bg-brand-burgundy' : 'bg-stone-300 dark:bg-stone-600'
        }`}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center w-full">
            <Loader2 className="h-3 w-3 animate-spin text-white" />
          </span>
        ) : (
          <span
            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              subscribed ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        )}
      </button>
    </div>
  );
};
