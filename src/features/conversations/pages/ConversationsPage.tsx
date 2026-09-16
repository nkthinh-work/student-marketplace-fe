import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  MessageSquare,
  Users,
  Mail,
  Plus,
  Loader2,
  MessagesSquare,
  RotateCcw,
  AlertCircle,
  X,
} from 'lucide-react';
import { useConversations, useGroupInvites, useOwnedGroupCount } from '../hooks';
import { ConversationCard } from '../components/ConversationCard';
import { CommunityBanner } from '../components/CommunityBanner';
import { GroupCreateModal } from '../components/GroupCreateModal';
import { GroupInvitesList } from '../components/GroupInvitesList';
import { useCurrentUser } from '@/features/users/hooks';
import { ConversationSummary } from '../types';

export function reconcileConversationOrder(
  serverList: ConversationSummary[],
  savedOrder: number[],
  activeTab: 'DIRECT' | 'GROUP' | 'INVITES'
): ConversationSummary[] {
  if (serverList.length === 0) return [];
  if (activeTab === 'INVITES') return serverList;

  const serverMap = new Map<number, ConversationSummary>();
  serverList.forEach((c) => serverMap.set(c.conversation_id, c));

  if (activeTab === 'GROUP') {
    const community = serverList.find((c) => c.type === 'COMMUNITY');
    const others = serverList.filter((c) => c.type !== 'COMMUNITY');
    const othersMap = new Map<number, ConversationSummary>();
    others.forEach((c) => othersMap.set(c.conversation_id, c));

    // Filter valid saved others
    const validSavedOthersIds = savedOrder.filter((id) => othersMap.has(id));
    const orderedOthers = validSavedOthersIds.map((id) => othersMap.get(id)!);

    // Append new groups from server
    const savedSet = new Set(validSavedOthersIds);
    const newOthers = others.filter((c) => !savedSet.has(c.conversation_id));
    const reconciledOthers = [...orderedOthers, ...newOthers];

    // Community ALWAYS forced to index 0
    return community ? [community, ...reconciledOthers] : reconciledOthers;
  }

  // DIRECT Tab
  const validSavedIds = savedOrder.filter((id) => serverMap.has(id));
  const orderedDirect = validSavedIds.map((id) => serverMap.get(id)!);
  const savedSet = new Set(validSavedIds);
  const newDirect = serverList.filter((c) => !savedSet.has(c.conversation_id));

  return [...orderedDirect, ...newDirect];
}

export const ConversationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Consume notice from router state and clear it immediately to prevent stale history
  useEffect(() => {
    if (location.state?.notice) {
      setBannerNotice(location.state.notice);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  const rawTab = searchParams.get('tab')?.toUpperCase();
  const activeTab: 'DIRECT' | 'GROUP' | 'INVITES' =
    rawTab === 'GROUP' ? 'GROUP' : rawTab === 'INVITES' ? 'INVITES' : 'DIRECT';

  const handleTabChange = (tab: 'DIRECT' | 'GROUP' | 'INVITES') => {
    setSearchParams({ tab: tab.toLowerCase() }, { replace: true });
  };

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const { data: invites = [] } = useGroupInvites();
  const pendingInvitesCount = invites.length;
  const { data: groupSummary } = useOwnedGroupCount();

  const typeParam =
    activeTab === 'DIRECT'
      ? 'DIRECT'
      : activeTab === 'GROUP'
      ? 'GROUP'
      : undefined;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversations(typeParam, 20);

  const rawConversations = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  // Persistent custom reorder key per user and tab
  const storageKey = `conv_custom_order_${currentUser?.user_id || 0}_${activeTab}`;

  const [customOrder, setCustomOrder] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-read when activeTab or user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setCustomOrder(saved ? JSON.parse(saved) : []);
    } catch {
      setCustomOrder([]);
    }
  }, [storageKey]);

  // Reconciled conversations
  const orderedConversations = useMemo(() => {
    return reconcileConversationOrder(rawConversations, customOrder, activeTab);
  }, [rawConversations, customOrder, activeTab]);

  const saveOrder = (newOrder: number[]) => {
    setCustomOrder(newOrder);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
    } catch {
      // ignore
    }
  };

  const resetOrder = () => {
    setCustomOrder([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const hasCustomOrder = customOrder.length > 0;

  // DND-KIT Sensor Configuration:
  // Mouse: requires 5px movement
  // Touch: requires 250ms stationary hold with < 8px tolerance
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 8,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);
  const justDraggedRef = useRef<boolean>(false);

  const handleDragStart = () => {
    justDraggedRef.current = true;
  };

  const handleDragCancel = () => {
    justDraggedRef.current = true;
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 300);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    justDraggedRef.current = true;
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 300);

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = Number(active.id);
    const overId = Number(over.id);

    const list = [...orderedConversations];
    const oldIndex = list.findIndex((c) => c.conversation_id === activeId);
    const targetIndex = list.findIndex((c) => c.conversation_id === overId);

    if (oldIndex === -1 || targetIndex === -1) return;

    // Enforce Community invariant at index 0 in GROUP tab
    const minIndex =
      activeTab === 'GROUP' && list[0]?.type === 'COMMUNITY' ? 1 : 0;
    if (targetIndex < minIndex) return;

    const newList = arrayMove(list, oldIndex, targetIndex);
    const idsToSave =
      activeTab === 'GROUP'
        ? newList.filter((c) => c.type !== 'COMMUNITY').map((c) => c.conversation_id)
        : newList.map((c) => c.conversation_id);

    saveOrder(idsToSave);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-brand-warm-white pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-stone-200/80 sticky top-14 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-brand-burgundy flex items-center justify-center">
              <MessagesSquare className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-stone-900 tracking-tight">
              Tin nhắn
            </h1>
          </div>

          {activeTab === 'GROUP' && (groupSummary?.owned_group_count ?? 0) >= 1 && (
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(true)}
              className="px-3 py-1.5 bg-brand-burgundy hover:bg-brand-burgundy/90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo nhóm</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Revocation / Feedback Notice Banner */}
        {bannerNotice && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200/80 text-amber-900 rounded-2xl flex items-center justify-between text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">{bannerNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-amber-500 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 transition-colors"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60 mb-4 max-w-md mx-auto sm:mx-0">
          <button
            type="button"
            onClick={() => handleTabChange('DIRECT')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'DIRECT'
                ? 'bg-brand-burgundy text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Trực tiếp</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('GROUP')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'GROUP'
                ? 'bg-brand-burgundy text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Nhóm</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('INVITES')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'INVITES'
                ? 'bg-brand-burgundy text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Lời mời</span>
            {pendingInvitesCount > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'INVITES'
                    ? 'bg-white text-brand-burgundy'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {pendingInvitesCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab 3: Invites */}
        {activeTab === 'INVITES' && <GroupInvitesList />}

        {/* Tab 1 & 2: Direct / Group */}
        {activeTab !== 'INVITES' && (
          <>
            {/* If Group tab, show official community pinned banner if not yet seen */}
            {activeTab === 'GROUP' && <CommunityBanner />}

            {/* Reorder instructions & Reset button (shown if list has multiple items) */}
            {!isLoading && orderedConversations.length > 1 && (
              <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2 px-1">
                <span>Giữ và kéo để sắp xếp thứ tự cuộc trò chuyện</span>
                {hasCustomOrder && (
                  <button
                    type="button"
                    onClick={resetOrder}
                    className="inline-flex items-center gap-1 text-brand-burgundy hover:text-rose-700 font-semibold transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại thứ tự</span>
                  </button>
                )}
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-white border border-stone-200/60 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-4 rounded-2xl text-center">
                Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại sau.
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && orderedConversations.length === 0 && (
              <div className="bg-white border border-stone-200/80 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                  {activeTab === 'DIRECT' ? (
                    <MessageSquare className="w-7 h-7" />
                  ) : (
                    <Users className="w-7 h-7" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-1">
                  {activeTab === 'DIRECT'
                    ? 'Chưa có tin nhắn trực tiếp nào'
                    : 'Chưa tham gia nhóm nào'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                  {activeTab === 'DIRECT'
                    ? 'Khi bạn nhắn tin với người bán trên sản phẩm hoặc đơn hàng, cuộc trò chuyện sẽ hiển thị tại đây.'
                    : 'Bạn có thể tạo nhóm riêng hoặc tham gia khi nhận được lời mời.'}
                </p>
              </div>
            )}

            {/* Conversations List with Drag & Drop Reordering */}
            {!isLoading && orderedConversations.length > 0 && (
              <DndContext
                sensors={sensors}
                modifiers={[restrictToVerticalAxis]}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragCancel={handleDragCancel}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedConversations.map((c) => c.conversation_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2.5">
                    {orderedConversations.map((conv) => {
                      const isComm = conv.type === 'COMMUNITY';
                      return (
                        <ConversationCard
                          key={conv.conversation_id}
                          conversation={conv}
                          isReorderable={!isComm && orderedConversations.length > 1}
                          justDraggedRef={justDraggedRef}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

                {/* Create-Group Onboarding Promo (placed cleanly AFTER the pinned community card) */}
                {activeTab === 'GROUP' && (groupSummary?.owned_group_count ?? 0) === 0 && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-100 shadow-xs mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-brand-burgundy">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">
                          Tự tạo nhóm của bạn...
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5 max-w-md leading-relaxed">
                          Tạo không gian riêng để cùng bạn bè trao đổi tài liệu, ôn thi hoặc mua bán theo nhóm sinh viên PTIT.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCreateGroupOpen(true)}
                      className="self-start sm:self-center px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95"
                    >
                      Tạo nhóm ngay
                    </button>
                  </div>
                )}

                {/* Load More Button */}
                {hasNextPage && (
                  <div className="pt-3 text-center">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-4 py-2 text-xs font-semibold text-brand-burgundy bg-white border border-stone-200 hover:bg-stone-50 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tải...</span>
                        </>
                      ) : (
                        <span>Xem thêm</span>
                      )}
                    </button>
                  </div>
                )}
          </>
        )}

        {/* Group Create Modal */}
        <GroupCreateModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
        />
      </div>
    </div>
  );
};

export default ConversationsPage;
