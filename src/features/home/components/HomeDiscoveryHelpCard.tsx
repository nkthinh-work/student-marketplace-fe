import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, BookOpen, Users, Loader2, AlertCircle } from 'lucide-react';
import { useTutorial } from '@/features/tutorials/context/TutorialContext';
import { useJoinOfficialSupportGroup } from '@/features/conversations/hooks';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface HomeDiscoveryHelpCardProps {
  className?: string;
}

export const HomeDiscoveryHelpCard: React.FC<HomeDiscoveryHelpCardProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const { openTutorial } = useTutorial();
  const { firebaseUser } = useAuth();
  const joinSupportGroupMutation = useJoinOfficialSupportGroup();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenTutorial = () => {
    openTutorial();
  };

  const handleEnterCommunity = async () => {
    setErrorMessage(null);

    if (!firebaseUser) {
      navigate('/login', { state: { returnTo: '/messages' } });
      return;
    }

    try {
      const res = await joinSupportGroupMutation.mutateAsync();
      navigate(`/messages?c=${res.conversation_id}`);
    } catch {
      setErrorMessage('Hiện chưa thể mở Cộng đồng Chợ PTITers. Vui lòng thử lại sau.');
    }
  };

  return (
    <section
      data-ui-role="home-discovery-help-card"
      className={`rounded-2xl bg-gradient-to-r from-rose-50/60 via-brand-warm-white to-amber-50/50 p-3.5 sm:p-4 border border-brand-border/60 shadow-2xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center shrink-0 mt-0.5">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-brand-text leading-snug">
              Khám phá Chợ PTITers
            </h3>
            <p className="text-[11px] sm:text-xs text-brand-text-muted mt-0.5 leading-relaxed">
              Mới đến? Xem hướng dẫn nhanh hoặc vào cộng đồng để được hỗ trợ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 w-full sm:w-auto">
          <button
            type="button"
            data-testid="tutorial-cta"
            onClick={handleOpenTutorial}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-brand-border/80 hover:bg-stone-50 text-brand-text text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-burgundy" />
            <span>Hướng dẫn</span>
          </button>

          <button
            type="button"
            data-testid="community-cta"
            onClick={handleEnterCommunity}
            disabled={joinSupportGroupMutation.isPending}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-burgundy text-white hover:bg-rose-900 text-xs font-semibold shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {joinSupportGroupMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Users className="w-3.5 h-3.5 text-rose-200" />
            )}
            <span>Cộng đồng</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </section>
  );
};
