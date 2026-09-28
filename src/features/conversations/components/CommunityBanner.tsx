import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2, Sparkles } from 'lucide-react';
import { useJoinOfficialSupportGroup } from '../hooks';
import { useCurrentUser } from '@/features/users/hooks';
import { getCommunityPromoSeen } from '../utils/promo';

export const CommunityBanner: React.FC = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const joinMutation = useJoinOfficialSupportGroup();

  // If user has already visited/opened the official community chat, hide discovery promo card
  const isSeen = getCommunityPromoSeen(user?.user_id);
  if (isSeen) return null;

  const handleClick = async () => {
    try {
      const res = await joinMutation.mutateAsync();
      navigate(`/messages/${res.conversation_id}`);
    } catch (err: any) {
      alert(
        err.response?.data?.detail ||
          err.message ||
          'Không thể tham gia cộng đồng.'
      );
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-burgundy to-rose-900 text-white p-4 sm:p-5 shadow-sm border border-rose-800/40 mb-3">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0 text-white shadow-inner">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white leading-tight">
                Cộng đồng Chợ PTITers
              </h3>
              <span className="inline-flex items-center justify-center text-center whitespace-nowrap text-[10px] px-2.5 py-0.5 rounded-full bg-white/20 font-semibold text-rose-100 uppercase tracking-wider leading-none">
                Chính thức
              </span>
            </div>
            <p className="text-xs text-rose-100/90 mt-1 max-w-md leading-relaxed">
              Kênh giao lưu, thông báo sinh hoạt, hỗ trợ và trao đổi mua bán chung toàn trường PTIT.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={joinMutation.isPending}
          className="self-start sm:self-center px-4 py-2 rounded-xl bg-white text-brand-burgundy hover:bg-rose-50 text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
        >
          {joinMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-burgundy" />
          ) : (
            <>
              <Users className="w-3.5 h-3.5" />
              <span>Tham gia ngay</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
