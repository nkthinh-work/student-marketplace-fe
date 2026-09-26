import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { feedbackKeys, useSupportInfo } from '../hooks';
import { FeedbackForm } from '../components/FeedbackForm';
import { PublicFeedbackList } from '../components/PublicFeedbackList';
import { MyFeedbackSection } from '../components/MyFeedbackSection';
import { CreatorProfileCard } from '../components/CreatorProfileCard';
import { VietQRSupportCard } from '../components/VietQRSupportCard';
import { SupporterLeaderboard } from '../components/SupporterLeaderboard';

export const FeedbackPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: support, isLoading: isSupportLoading } = useSupportInfo();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmitted = () => {
    queryClient.invalidateQueries({ queryKey: feedbackKeys.public() });
    queryClient.invalidateQueries({ queryKey: feedbackKeys.me() });
  };

  const handleShowToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="mx-auto max-w-2xl px-3.5 py-5 sm:px-6 sm:py-8 space-y-6 min-w-0">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Creator Profile Card Section */}
      <section>
        <CreatorProfileCard support={support} isLoading={isSupportLoading} />
      </section>

      {/* 2. Fixed VietQR Support Card Section */}
      <section>
        <VietQRSupportCard support={support} isLoading={isSupportLoading} />
      </section>

      {/* 3. Bảng tri ân (Supporter Leaderboard) Section */}
      <section>
        <SupporterLeaderboard />
      </section>

      {/* 4. Feedback Headline Copy */}
      <header className="text-center space-y-2 px-2 pt-3 sm:pt-4 border-t border-brand-border/60">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text leading-snug tracking-tight">
          Bọn mình nhận gạch đá để xây chợ vững chắc hơn
        </h1>
        <p className="text-xs sm:text-sm text-brand-text-muted max-w-md mx-auto leading-relaxed">
          Gặp lỗi hay có điều gì chưa ổn? Gửi Feedback để bọn mình cải thiện Chợ PTITers nhé.
        </p>
      </header>

      {/* 5. Compact Feedback Form */}
      <section>
        <FeedbackForm
          onSubmitted={handleSubmitted}
          onSuccessToast={handleShowToast}
        />
      </section>

      {/* 6. My Feedback Section (Owner History & Hard Delete) */}
      <section>
        <MyFeedbackSection />
      </section>

      {/* 7. Public Community Feed */}
      <section>
        <PublicFeedbackList />
      </section>
    </div>
  );
};
