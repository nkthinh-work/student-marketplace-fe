import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Users,
  Shield,
  Crown,
  UserMinus,
  UserPlus,
  LogOut,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Mic,
  FileText,
  Trash2,
  MoreVertical,
  Download,
  Eye,
  Play,
  Check,
  UserCheck,
  Pencil,
  User as UserIcon,
} from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import {
  useDeleteGroup,
  useGroupMembers,
  useGroupPendingApprovals,
  useLeaveGroup,
  useProcessGroupPendingApproval,
  useRemoveGroupMember,
  useSharedAttachments,
  useSharedAttachmentsSummary,
  useTransferGroupOwnership,
  useUpdateGroupMetadata,
  useUpdateMemberRole,
} from '../hooks';
import { ConversationDetailResponse, ConversationMemberItem } from '../types';
import { useCurrentUser } from '@/features/users/hooks';
import { requestAttachmentDownload } from '../download';
import { InviteMemberModal } from './InviteMemberModal';
import { GroupNicknameModal } from './GroupNicknameModal';
import { AudioBubble } from './AudioBubble';
import { FileTypeIcon } from './FileTypeIcon';

interface GroupInfoDrawerProps {
  conversation: ConversationDetailResponse;
  isOpen: boolean;
  onClose: () => void;
  onBeforeNavigateAway?: () => void;
}

export const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({
  conversation,
  isOpen,
  onClose,
  onBeforeNavigateAway,
}) => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const [downloadingItemId, setDownloadingItemId] = useState<number | null>(null);

  const handleDownloadFile = async (attachmentId: number, originalName: string) => {
    if (downloadingItemId) return;
    try {
      setDownloadingItemId(attachmentId);
      await requestAttachmentDownload(
        conversation.conversation_id,
        attachmentId,
        originalName
      );
    } catch {
      // Handled in requestAttachmentDownload
    } finally {
      setDownloadingItemId(null);
    }
  };
  const convId = conversation.conversation_id;

  const { data: members = [], isLoading: isMembersLoading } = useGroupMembers(convId);
  const { data: attachmentsSummary } = useSharedAttachmentsSummary(convId);

  const updateRoleMutation = useUpdateMemberRole(convId);
  const transferOwnershipMutation = useTransferGroupOwnership(convId);
  const removeMemberMutation = useRemoveGroupMember(convId);
  const leaveGroupMutation = useLeaveGroup(convId);
  const deleteGroupMutation = useDeleteGroup(convId);

  // Tab state: 'members' vs 'media'
  const [activeMainTab, setActiveMainTab] = useState<'members' | 'media'>('members');
  // Inner media category: 'media' | 'audio' | 'file'
  const [activeMediaCategory, setActiveMediaCategory] = useState<'media' | 'audio' | 'file'>('media');

  // Active member menu (user_id of member whose ⋯ menu is open)
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<ConversationMemberItem | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    kind: 'IMAGE' | 'VIDEO';
    attachment_id?: number;
    original_name?: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Shared attachments query for 'media' tab
  const apiCategory =
    activeMediaCategory === 'media'
      ? 'media'
      : activeMediaCategory === 'audio'
      ? 'audio'
      : 'file';

  const {
    data: attachmentsData,
    isLoading: isAttachmentsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSharedAttachments(convId, apiCategory, 30);

  const attachmentItems = useMemo(() => {
    if (!attachmentsData?.pages) return [];
    return attachmentsData.pages.flatMap((p) => p.items);
  }, [attachmentsData]);

  const myMember = members.find((m) => m.user_id === user?.user_id);
  const myRole = conversation.my_role || myMember?.role;
  const isOwner = myRole === 'OWNER';
  const isAdmin = myRole === 'ADMIN';

  // Regular GROUP: all active members (OWNER, ADMIN, MEMBER) can invite
  const canInvite = Boolean(myRole);

  const updateGroupMetadataMutation = useUpdateGroupMetadata(convId);
  const { data: pendingApprovalsData } = useGroupPendingApprovals(
    convId,
    Boolean(isOwner && isOpen)
  );
  const processPendingApprovalMutation = useProcessGroupPendingApproval();
  const [processingInviteId, setProcessingInviteId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleToggleApproval = async () => {
    if (!isOwner) return;
    setActionError(null);
    try {
      await updateGroupMetadataMutation.mutateAsync({
        requires_approval: !conversation.requires_approval,
      });
    } catch (err: any) {
      setActionError(
        err.response?.data?.detail || err.message || 'Không thể cập nhật cài đặt phê duyệt.'
      );
    }
  };

  const handleProcessApproval = async (inviteId: number, action: 'APPROVE' | 'REJECT') => {
    if (!isOwner) return;
    setActionError(null);
    setProcessingInviteId(inviteId);
    try {
      await processPendingApprovalMutation.mutateAsync({
        conversationId: convId,
        inviteId,
        action,
      });
    } catch (err: any) {
      setActionError(
        err.response?.data?.detail ||
          err.message ||
          `Không thể ${action === 'APPROVE' ? 'duyệt' : 'từ chối'} thành viên.`
      );
    } finally {
      setProcessingInviteId(null);
    }
  };

  const navigateToProfile = (targetUserId: number) => {
    onBeforeNavigateAway?.();
    onClose();
    navigate(`/users/${targetUserId}`, {
      state: {
        fromApp: true,
        returnTo: `/messages/${convId}`,
        returnLabel: 'Quay lại nhóm',
        source: 'conversation-member',
      },
    });
  };

  const handlePromoteAdmin = async (member: ConversationMemberItem) => {
    setOpenMenuUserId(null);
    if (!isOwner) return;
    if (!window.confirm(`Bổ nhiệm "${member.full_name}" làm Phó nhóm?`)) return;

    setActionError(null);
    try {
      await updateRoleMutation.mutateAsync({
        userId: member.user_id,
        role: 'ADMIN',
      });
    } catch (err: any) {
      setActionError(
        err.response?.data?.detail || err.message || 'Không thể bổ nhiệm Phó nhóm.'
      );
    }
  };

  const handleDemoteAdmin = async (member: ConversationMemberItem) => {
    setOpenMenuUserId(null);
    if (!isOwner) return;
    if (!window.confirm(`Gỡ quyền Phó nhóm của "${member.full_name}"?`)) return;

    setActionError(null);
    try {
      await updateRoleMutation.mutateAsync({
        userId: member.user_id,
        role: 'MEMBER',
      });
    } catch (err: any) {
      setActionError(
        err.response?.data?.detail || err.message || 'Không thể gỡ quyền Phó nhóm.'
      );
    }
  };

  const handleTransferOwnership = async (member: ConversationMemberItem) => {
    setOpenMenuUserId(null);
    if (!isOwner) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn chuyển quyền Trưởng nhóm cho "${member.full_name}"? Bạn sẽ trở thành Thành viên thông thường.`
      )
    ) {
      return;
    }
    setActionError(null);
    try {
      await transferOwnershipMutation.mutateAsync(member.user_id);
    } catch (err: any) {
      setActionError(
        err.response?.data?.detail || err.message || 'Không thể chuyển quyền trưởng nhóm.'
      );
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setActionError(null);
    try {
      await removeMemberMutation.mutateAsync(memberToRemove.user_id);
      setMemberToRemove(null);
    } catch (err: any) {
      setActionError(
        err.response?.data?.detail || err.message || 'Không thể xóa thành viên.'
      );
      setMemberToRemove(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (isOwner && members.length > 1) {
      alert('Bạn cần chuyển quyền Trưởng nhóm trước khi rời nhóm.');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn rời nhóm này?')) {
      return;
    }
    setActionError(null);
    try {
      await leaveGroupMutation.mutateAsync();
      onClose();
      navigate('/messages?tab=group');
    } catch (err: any) {
      setActionError(
        err.response?.data?.detail || err.message || 'Không thể rời nhóm.'
      );
    }
  };

  const handleDeleteGroup = async () => {
    if (!isOwner) return;
    setActionError(null);
    try {
      await deleteGroupMutation.mutateAsync();
      setShowDeleteConfirm(false);
      onClose();
      navigate('/messages?tab=group');
    } catch (err: any) {
      setActionError(
        err.response?.data?.detail || err.message || 'Không thể xóa nhóm.'
      );
      setShowDeleteConfirm(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuUserId(null);
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/60 shrink-0">
            <h3 className="text-sm font-bold text-stone-900">
              Thông tin Nhóm
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {actionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{actionError}</span>
              </div>
            )}

            {/* 1. Group Identity Card */}
            <div className="flex flex-col items-center text-center p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div className="w-16 h-16 rounded-2xl bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center mb-3">
                <Users className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-stone-900">
                {conversation.title || 'Nhóm trò chuyện'}
              </h4>
              {conversation.description && (
                <p className="text-xs text-stone-600 mt-1 max-w-xs leading-relaxed">
                  {conversation.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600 font-medium">
                  {members.length > 0 ? members.length : conversation.member_count || 0} thành viên
                </span>
                {myRole && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-burgundy/10 text-brand-burgundy font-semibold">
                    {myRole === 'OWNER'
                      ? 'Trưởng nhóm'
                      : myRole === 'ADMIN'
                      ? 'Phó nhóm'
                      : 'Thành viên'}
                  </span>
                )}
              </div>
            </div>

            {/* 2. Compact TWO-TAB Navigation on ONE ROW */}
            <div className="flex p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveMainTab('members')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all text-center ${
                  activeMainTab === 'members'
                    ? 'bg-white text-brand-burgundy shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Thành viên ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab('media')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all text-center ${
                  activeMainTab === 'media'
                    ? 'bg-white text-brand-burgundy shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                File & phương tiện
              </button>
            </div>

            {/* TAB 1: THÀNH VIÊN */}
            {activeMainTab === 'members' && (
              <div className="space-y-3">
                {/* OWNER-only: Approval Settings & Pending Approvals */}
                {isOwner && (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-stone-900">
                          Phê duyệt thành viên mới
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                          Yêu cầu Trưởng nhóm duyệt trước khi thành viên tham gia nhóm.
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(conversation.requires_approval)}
                        onClick={handleToggleApproval}
                        disabled={updateGroupMetadataMutation.isPending}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          conversation.requires_approval ? 'bg-brand-burgundy' : 'bg-stone-300'
                        } ${updateGroupMetadataMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            conversation.requires_approval ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Pending Approvals List (Visible when there are pending requests) */}
                    {pendingApprovalsData && pendingApprovalsData.items.length > 0 && (
                      <div className="pt-2.5 border-t border-stone-200/60">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                            <UserCheck className="w-3.5 h-3.5 text-brand-burgundy" />
                            <span>Yêu cầu tham gia chờ duyệt</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-brand-burgundy/10 text-brand-burgundy text-[10px] font-bold">
                              {pendingApprovalsData.items.length}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                          {pendingApprovalsData.items.map((item) => {
                            const isProcessing = processingInviteId === item.invite_id;
                            return (
                              <div
                                key={item.invite_id}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-stone-200/80 shadow-2xs"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Avatar
                                    src={item.invitee_avatar}
                                    name={item.invitee_name}
                                    size="xs"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold text-stone-900 truncate">
                                      {item.invitee_name}
                                    </div>
                                    <div className="text-[10px] text-stone-500 truncate">
                                      Người mời: {item.inviter_name}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleProcessApproval(item.invite_id, 'APPROVE')}
                                    disabled={isProcessing}
                                    className="py-1 px-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                                    title="Duyệt tham gia"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    <span>Duyệt</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleProcessApproval(item.invite_id, 'REJECT')}
                                    disabled={isProcessing}
                                    className="py-1 px-2 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                                    title="Từ chối"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Từ chối</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Invite Action Button (Only for regular group, available to all active members) */}
                {canInvite && (
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-stone-300 hover:border-brand-burgundy text-stone-700 hover:text-brand-burgundy text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors bg-stone-50/50 hover:bg-rose-50/30"
                  >
                    <UserPlus className="w-4 h-4 text-brand-burgundy" />
                    <span>Mời thành viên</span>
                  </button>
                )}

                {/* Member List */}
                {isMembersLoading ? (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    Đang tải danh sách thành viên...
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {members.map((member) => {
                      const isThisMemberOwner = member.role === 'OWNER';
                      const isThisMemberAdmin = member.role === 'ADMIN';
                      const isMe = member.user_id === user?.user_id;

                      // Permission to see 3-dots management menu:
                      // Owner can manage everyone except self
                      // Admin can manage normal members only
                      const canManageThis =
                        !isMe &&
                        (isOwner || (isAdmin && !isThisMemberOwner && !isThisMemberAdmin));

                      return (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-100 hover:border-stone-200 transition-colors relative"
                        >
                          {/* Member Identity: Avatar + Name -> Navigate to Profile */}
                          <div
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                            onClick={() => navigateToProfile(member.user_id)}
                            title={`Xem trang cá nhân của ${member.full_name}`}
                          >
                            <div className="relative shrink-0">
                              <Avatar
                                src={member.avatar_url}
                                name={member.full_name}
                                size="sm"
                              />
                              {member.is_online && (
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"
                                  title="Đang hoạt động"
                                />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              {member.nickname && member.nickname.trim() ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-stone-900 group-hover:text-brand-burgundy transition-colors truncate">
                                      {member.nickname.trim()}
                                    </span>
                                    {isMe && (
                                      <span className="text-[10px] text-stone-400 shrink-0">
                                        (Bạn)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-stone-500 truncate">
                                    {member.full_name}
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-stone-900 group-hover:text-brand-burgundy transition-colors truncate">
                                    {member.full_name}
                                  </span>
                                  {isMe && (
                                    <span className="text-[10px] text-stone-400 shrink-0">
                                      (Bạn)
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isThisMemberOwner ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-bold">
                                    <Crown className="w-3 h-3" />
                                    <span>Trưởng nhóm</span>
                                  </span>
                                ) : isThisMemberAdmin ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold">
                                    <Shield className="w-3 h-3" />
                                    <span>Phó nhóm</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-stone-400">
                                    Thành viên
                                  </span>
                                )}

                                {member.is_online && (
                                  <span className="text-[10px] text-emerald-600 font-medium">
                                    · Đang hoạt động
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Edit Own Nickname Button */}
                          {isMe && (
                            <div className="relative shrink-0 ml-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsNicknameModalOpen(true);
                                }}
                                className="p-1.5 text-stone-400 hover:text-brand-burgundy hover:bg-rose-50 rounded-lg transition-colors"
                                title="Đặt/đổi biệt danh của bạn"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* 3-Dots Management Button */}
                          {canManageThis && (
                            <div className="relative shrink-0 ml-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuUserId(
                                    openMenuUserId === member.user_id ? null : member.user_id
                                  );
                                }}
                                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                                title="Tùy chọn quản lý"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* ⋯ Dropdown Menu */}
                              {openMenuUserId === member.user_id && (
                                <div
                                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-1 z-30 divide-y divide-stone-100 animate-in fade-in zoom-in-95 duration-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={() => navigateToProfile(member.user_id)}
                                      className="w-full px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 text-left"
                                    >
                                      <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                                      <span>Xem trang cá nhân</span>
                                    </button>
                                  </div>

                                  {/* Owner Actions */}
                                  {isOwner && (
                                    <div className="py-0.5">
                                      {/* Promote / Demote Admin */}
                                      {member.role === 'MEMBER' ? (
                                        <button
                                          type="button"
                                          onClick={() => handlePromoteAdmin(member)}
                                          className="w-full px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-2 text-left font-medium"
                                        >
                                          <Shield className="w-3.5 h-3.5 text-blue-500" />
                                          <span>Bổ nhiệm Phó nhóm</span>
                                        </button>
                                      ) : member.role === 'ADMIN' ? (
                                        <button
                                          type="button"
                                          onClick={() => handleDemoteAdmin(member)}
                                          className="w-full px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 flex items-center gap-2 text-left"
                                        >
                                          <Shield className="w-3.5 h-3.5 text-stone-400" />
                                          <span>Gỡ quyền Phó nhóm</span>
                                        </button>
                                      ) : null}

                                      {/* Transfer Ownership */}
                                      <button
                                        type="button"
                                        onClick={() => handleTransferOwnership(member)}
                                        className="w-full px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 text-left font-medium"
                                      >
                                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Chuyển quyền Trưởng nhóm</span>
                                      </button>
                                    </div>
                                  )}

                                  {/* Remove Member Action (Owner or Admin) */}
                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuUserId(null);
                                        setMemberToRemove(member);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 text-left font-semibold"
                                    >
                                      <UserMinus className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Xóa khỏi nhóm</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: FILE & PHƯƠNG TIỆN */}
            {activeMainTab === 'media' && (
              <div className="space-y-3">
                {/* 3 Inner Categories */}
                <div className="flex gap-1 p-1 bg-stone-50 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setActiveMediaCategory('media')}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                      activeMediaCategory === 'media'
                        ? 'bg-white text-brand-burgundy shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Ảnh & video</span>
                    {attachmentsSummary?.media_count !== undefined && (
                      <span className="text-[10px] opacity-75">({attachmentsSummary.media_count})</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMediaCategory('audio')}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                      activeMediaCategory === 'audio'
                        ? 'bg-white text-brand-burgundy shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>Âm thanh</span>
                    {attachmentsSummary?.audio_count !== undefined && (
                      <span className="text-[10px] opacity-75">({attachmentsSummary.audio_count})</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMediaCategory('file')}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                      activeMediaCategory === 'file'
                        ? 'bg-white text-brand-burgundy shadow-xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Tệp</span>
                    {attachmentsSummary?.file_count !== undefined && (
                      <span className="text-[10px] opacity-75">({attachmentsSummary.file_count})</span>
                    )}
                  </button>
                </div>

                {/* Content List/Grid */}
                {isAttachmentsLoading ? (
                  <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-burgundy" />
                    <span>Đang tải nội dung...</span>
                  </div>
                ) : attachmentItems.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    Chưa có {activeMediaCategory === 'media' ? 'ảnh hoặc video' : activeMediaCategory === 'audio' ? 'tin nhắn thoại' : 'tệp tin'} nào.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Media Grid */}
                    {activeMediaCategory === 'media' && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {attachmentItems.map((item) => (
                          <div
                            key={item.attachment_id}
                            className="relative group rounded-xl overflow-hidden bg-stone-100 aspect-square border border-stone-200"
                          >
                            {item.kind === 'VIDEO' ? (
                              <div
                                className="w-full h-full flex items-center justify-center bg-black/80 cursor-pointer relative group/vid"
                                onClick={() =>
                                  setPreviewMedia({
                                    url: item.url,
                                    kind: 'VIDEO',
                                    attachment_id: item.attachment_id,
                                    original_name: item.original_name,
                                  })
                                }
                              >
                                <video
                                  src={item.url}
                                  className="w-full h-full object-cover opacity-85 group-hover/vid:opacity-100 transition-opacity"
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover/vid:bg-black/15 flex flex-col items-center justify-center transition-colors">
                                  <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-xs flex items-center justify-center text-white mb-0.5 group-hover/vid:scale-110 transition-transform shadow-md">
                                    <Play className="w-4 h-4 fill-white ml-0.5" />
                                  </div>
                                  <span className="text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                                    Video
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="w-full h-full cursor-pointer relative"
                                onClick={() =>
                                  setPreviewMedia({
                                    url: item.url,
                                    kind: 'IMAGE',
                                    attachment_id: item.attachment_id,
                                    original_name: item.original_name,
                                  })
                                }
                              >
                                <img
                                  src={item.url}
                                  alt={item.original_name}
                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-4 h-4 drop-shadow-sm" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Audio List */}
                    {activeMediaCategory === 'audio' && (
                      <div className="space-y-2">
                        {attachmentItems.map((item) => (
                          <div
                            key={item.attachment_id}
                            className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between text-[10px] text-stone-500">
                              <span className="font-semibold text-stone-700">
                                {item.sender_name || 'Người dùng'}
                              </span>
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                            <AudioBubble
                              url={item.url}
                              attachmentId={item.attachment_id}
                              durationMs={item.duration_ms}
                              isMine={false}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Files List */}
                    {activeMediaCategory === 'file' && (
                      <div className="space-y-1.5">
                        {attachmentItems.map((item) => {
                          return (
                            <div
                              key={item.attachment_id}
                              className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2.5 hover:border-stone-300 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileTypeIcon
                                  filename={item.original_name}
                                  mimeType={item.mime_type}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-stone-900 truncate">
                                    {item.original_name}
                                  </p>
                                  <p className="text-[10px] text-stone-500 mt-0.5 truncate">
                                    <span>{formatFileSize(item.size_bytes)}</span>
                                    <span className="mx-1">·</span>
                                    <span>{formatDate(item.created_at)}</span>
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDownloadFile(item.attachment_id, item.original_name)}
                                disabled={downloadingItemId === item.attachment_id}
                                className="p-1.5 text-stone-500 hover:text-brand-burgundy hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                                title="Tải về"
                              >
                                {downloadingItemId === item.attachment_id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Load More Button */}
                    {hasNextPage && (
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          className="py-1 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                        >
                          {isFetchingNextPage ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Đang tải...</span>
                            </>
                          ) : (
                            <span>Tải thêm</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-stone-200 bg-stone-50/50 space-y-2 shrink-0">
            {/* Leave Group Button */}
            <button
              type="button"
              onClick={handleLeaveGroup}
              disabled={leaveGroupMutation.isPending}
              className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Rời khỏi nhóm</span>
            </button>

            {/* Delete Group Button (OWNER only) */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteGroupMutation.isPending}
                className="w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa nhóm trò chuyện</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        conversationId={convId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Group Self-Nickname Modal */}
      <GroupNicknameModal
        conversationId={convId}
        currentNickname={myMember?.nickname}
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
      />

      {/* Remove Member Confirmation Dialog */}
      {memberToRemove && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setMemberToRemove(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-stone-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <UserMinus className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-stone-900 mb-1">
              Xóa {memberToRemove.full_name} khỏi nhóm?
            </h4>
            <p className="text-xs text-stone-600 mb-5 leading-relaxed">
              Thành viên này sẽ không thể tiếp tục truy cập hoặc gửi tin nhắn mới trong nhóm.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={removeMemberMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1 shadow-xs"
              >
                {removeMemberMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Xóa khỏi nhóm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-stone-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-stone-900 mb-1">
              Xác nhận xóa nhóm
            </h4>
            <p className="text-xs text-stone-600 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa nhóm này? Toàn bộ thành viên sẽ không thể gửi hay xem tin nhắn mới. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={deleteGroupMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1 shadow-xs"
              >
                {deleteGroupMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Xóa nhóm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Media Preview (Image & Video) */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (downloadingItemId) return;
                if (previewMedia.attachment_id) {
                  try {
                    setDownloadingItemId(previewMedia.attachment_id);
                    await requestAttachmentDownload(
                      conversation.conversation_id,
                      previewMedia.attachment_id,
                      previewMedia.original_name
                    );
                  } catch {
                    // Handled in requestAttachmentDownload
                  } finally {
                    setDownloadingItemId(null);
                  }
                } else {
                  window.open(previewMedia.url, '_blank');
                }
              }}
              disabled={Boolean(downloadingItemId)}
              className="h-10 px-3.5 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center gap-1.5 transition-colors text-xs font-medium backdrop-blur-xs cursor-pointer disabled:opacity-50"
              title="Tải tệp xuống thiết bị"
            >
              {downloadingItemId === previewMedia.attachment_id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Tải xuống</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDownloadingItemId(null);
                setPreviewMedia(null);
              }}
              className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {previewMedia.kind === 'VIDEO' ? (
            <video
              src={previewMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewMedia.url}
              alt="Xem ảnh đính kèm"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
};
