import React, { useEffect, useState } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  isWebPushSupported,
  getPushPermissionState,
  isPushSubscribed,
  isPushBannerDismissed,
  dismissPushBanner,
  requestPushPermissionAndSubscribe,
} from '../pushNotification';

export const WebPushPermissionBanner: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Only evaluate display when authenticated
    if (!firebaseUser) {
      setVisible(false);
      return;
    }

    const checkVisibility = () => {
      if (!isWebPushSupported()) {
        setVisible(false);
        return;
      }

      const permState = getPushPermissionState();
      const subscribed = isPushSubscribed();
      const dismissed = isPushBannerDismissed();

      // Only show if user hasn't granted yet, hasn't subscribed, and hasn't temporarily dismissed
      if (permState === 'default' && !subscribed && !dismissed) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    checkVisibility();

    window.addEventListener('ptit_push_status_changed', checkVisibility);
    return () => {
      window.removeEventListener('ptit_push_status_changed', checkVisibility);
    };
  }, [firebaseUser]);

  if (!visible) return null;

  const handleAccept = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await requestPushPermissionAndSubscribe();
      if (result.success) {
        setVisible(false);
      } else {
        setErrorMsg(result.error || 'Không thể bật thông báo.');
        // If user denied in prompt, dismiss banner so it does not harass
        if (getPushPermissionState() === 'denied') {
          dismissPushBanner(30 * 24 * 60 * 60 * 1000); // 30 days
          setVisible(false);
        }
      }
    } catch {
      setErrorMsg('Đã xảy ra lỗi khi đăng ký thông báo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    dismissPushBanner(); // Dismiss for 7 days
    setVisible(false);
  };

  return (
    <div className="w-full bg-brand-burgundy/5 border-b border-brand-burgundy/15 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-burgundy/10 flex items-center justify-center shrink-0 text-brand-burgundy">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-brand-text">
              Bật thông báo để không bỏ lỡ tin nhắn và đơn hàng
            </p>
            <p className="text-[11px] text-brand-text-secondary leading-tight">
              Nhận thông báo tức thì ngay cả khi tab đã đóng trên trình duyệt được hỗ trợ.
            </p>
            {errorMsg && (
              <p className="text-[11px] text-brand-price mt-0.5">{errorMsg}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-burgundy text-white hover:bg-brand-burgundy/90 transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang bật...</span>
              </>
            ) : (
              <span>Bật thông báo</span>
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Đóng lời mời"
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
