import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Search, Loader2, UserPlus, Check } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { useCreateGroupConversation, useUserSearch } from '../hooks';
import { UserSearchItem } from '../types';

interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupCreateModal: React.FC<GroupCreateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserSearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const createGroupMutation = useCreateGroupConversation();
  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(
    userQuery
  );

  if (!isOpen) return null;

  const handleAddUser = (user: UserSearchItem) => {
    if (selectedUsers.some((u) => u.user_id === user.user_id)) return;
    if (selectedUsers.length >= 49) {
      setError('Nhóm tối đa 50 thành viên (gồm cả bạn).');
      return;
    }
    setSelectedUsers((prev) => [...prev, user]);
    setUserQuery('');
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 80) {
      setError('Tên nhóm phải từ 3 đến 80 ký tự.');
      return;
    }

    try {
      const res = await createGroupMutation.mutateAsync({
        title: trimmedTitle,
        description: description.trim() || undefined,
        initial_invitee_ids: selectedUsers.map((u) => u.user_id),
      });

      onClose();
      navigate(`/messages/${res.conversation_id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Không thể tạo nhóm trò chuyện.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Tạo nhóm trò chuyện
              </h3>
              <p className="text-[11px] text-stone-500">
                Kết nối trao đổi học tập & mua bán nhóm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tên nhóm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Nhóm sinh viên D21 Mua Bán Giáo Trình"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              maxLength={80}
              className="w-full px-3 py-2 text-base md:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy text-stone-900 placeholder:text-stone-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Mô tả nhóm (tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Mô tả mục đích nhóm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 text-base md:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy text-stone-900 placeholder:text-stone-400 resize-none"
            />
          </div>

          {/* User Search & Invite */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Mời thành viên ({selectedUsers.length}/49)
            </label>

            {/* Selected user chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-stone-50 rounded-xl border border-stone-200">
                {selectedUsers.map((u) => (
                  <span
                    key={u.user_id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs text-stone-800 shadow-xs"
                  >
                    <span>{u.full_name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(u.user_id)}
                      className="text-stone-400 hover:text-rose-600 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm bạn bè theo tên..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-base md:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy text-stone-900 placeholder:text-stone-400"
              />
            </div>

            {/* Search autocomplete dropdown */}
            {userQuery.trim().length >= 2 && (
              <div className="mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-40 overflow-y-auto p-1 divide-y divide-stone-100">
                {isSearching ? (
                  <div className="p-3 text-center text-xs text-stone-400 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-burgundy" />
                    <span>Đang tìm kiếm...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-stone-400">
                    Không tìm thấy sinh viên phù hợp
                  </div>
                ) : (
                  searchResults.map((usr) => {
                    const isSelected = selectedUsers.some(
                      (s) => s.user_id === usr.user_id
                    );
                    return (
                      <div
                        key={usr.user_id}
                        onClick={() => !isSelected && handleAddUser(usr)}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-rose-50/60 text-stone-400 cursor-not-allowed'
                            : 'hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={usr.avatar_url}
                            name={usr.full_name}
                            size="xs"
                            className="w-6 h-6 text-[9px]"
                          />
                          <span className="font-medium">{usr.full_name}</span>
                        </div>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <UserPlus className="w-4 h-4 text-brand-burgundy" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createGroupMutation.isPending || title.trim().length < 3}
              className="px-5 py-2 bg-brand-burgundy hover:bg-brand-burgundy/90 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
            >
              {createGroupMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              <span>Tạo nhóm</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
