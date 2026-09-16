import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Check, X, Loader2, MailOpen, Clock } from 'lucide-react';
import { useGroupInvites, useRespondGroupInvite } from '../hooks';

export const GroupInvitesList: React.FC = () => {
  const navigate = useNavigate();
  const { data: invites = [], isLoading } = useGroupInvites();
  const respondMutation = useRespondGroupInvite();

  const handleRespond = async (
    inviteId: number,
    conversationId: number,
    action: 'ACCEPT' | 'DECLINE'
  ) => {
    try {
      const res = await respondMutation.mutateAsync({ inviteId, action });
      if (action === 'ACCEPT') {
        if (res?.status === 'PENDING_APPROVAL' || res?.requires_approval) {
          alert(
            'Yêu cầu tham gia nhóm đã được gửi tới Trưởng nhóm để phê duyệt.'
          );
        } else {
          navigate(`/messages/${conversationId}`);
        }
      }
    } catch (err: any) {
      alert(
        err.response?.data?.detail ||
          err.message ||
          'Không thể xử lý lời mời tham gia nhóm.'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-burgundy mb-2" />
        <p className="text-xs">Đang tải danh sách lời mời...</p>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
          <MailOpen className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold text-stone-800">
          Không có lời mời nào
        </h3>
        <p className="text-xs text-stone-400 mt-1 max-w-xs">
          Khi có bạn bè mời bạn vào nhóm học tập hoặc trao đổi, lời mời sẽ xuất
          hiện tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-2.5">
      {invites.map((invite) => {
        const formattedDate = new Date(invite.created_at).toLocaleDateString(
          'vi-VN',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }
        );

        return (
          <div
            key={invite.invite_id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-stone-200/80 shadow-xs hover:border-brand-burgundy/30 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold text-stone-900 truncate">
                  {invite.conversation_title}
                </h4>
                <p className="text-xs text-stone-500 mt-0.5 truncate">
                  Được mời bởi{' '}
                  <span className="font-semibold text-stone-800">
                    {invite.inviter_name}
                  </span>{' '}
                  • {formattedDate}
                </p>
              </div>
            </div>

            {invite.status === 'PENDING_APPROVAL' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold self-end sm:self-center">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Chờ trưởng nhóm duyệt</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  disabled={respondMutation.isPending}
                  onClick={() =>
                    handleRespond(
                      invite.invite_id,
                      invite.conversation_id,
                      'DECLINE'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Từ chối</span>
                </button>
                <button
                  type="button"
                  disabled={respondMutation.isPending}
                  onClick={() =>
                    handleRespond(
                      invite.invite_id,
                      invite.conversation_id,
                      'ACCEPT'
                    )
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-brand-burgundy hover:bg-brand-burgundy/90 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Chấp nhận</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
