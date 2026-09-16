import React, { useState } from 'react';
import { X, Search, Loader2, UserPlus, Check } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { useInviteCandidates, useInviteGroupMembers } from '../hooks';
import { InviteCandidateItem } from '../types';

interface InviteMemberModalProps {
  conversationId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  conversationId,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading } = useInviteCandidates(conversationId, searchQuery);
  const inviteMutation = useInviteGroupMembers(conversationId);

  const candidates = data?.items || [];

  if (!isOpen) return null;

  const handleInvite = async (candidate: InviteCandidateItem) => {
    setErrorMsg(null);
    setInvitingId(candidate.user_id);
    try {
      await inviteMutation.mutateAsync([candidate.user_id]);
      setInvitedIds((prev) => new Set(prev).add(candidate.user_id));
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || err?.message || 'Không thể gửi lời mời.'
      );
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/70 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Mời thành viên</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tìm trong những người bạn đã trò chuyện
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-stone-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-burgundy focus:bg-white text-stone-900 transition-colors"
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-3 mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[220px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-brand-burgundy" />
              <span>Đang tải danh sách người liên hệ...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-2">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-stone-700 mb-1">
                Chưa có người phù hợp để mời.
              </p>
              <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto">
                Bạn có thể mời những người mình đã từng trò chuyện trực tiếp.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1 pb-1">
                Gần đây
              </p>
              <div className="space-y-1">
                {candidates.map((c) => {
                  const isInvited = invitedIds.has(c.user_id);
                  const isInvitingThis = invitingId === c.user_id;

                  return (
                    <div
                      key={c.user_id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-100 hover:border-stone-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Avatar
                          src={c.avatar_url}
                          name={c.full_name}
                          size="sm"
                          className="w-8 h-8 border border-stone-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-stone-900 truncate">
                            {c.full_name}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            Đã trò chuyện gần đây
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInvite(c)}
                        disabled={isInvited || isInvitingThis}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ml-2 inline-flex items-center gap-1 ${
                          isInvited
                            ? 'bg-stone-100 text-stone-400 cursor-default'
                            : 'bg-brand-burgundy text-white hover:bg-brand-burgundy/90 active:scale-95 shadow-2xs'
                        }`}
                      >
                        {isInvitingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isInvited ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã mời</span>
                          </>
                        ) : (
                          <span>Mời</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
