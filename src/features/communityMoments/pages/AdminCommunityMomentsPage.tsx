import { useState } from 'react';
import { Camera, CheckCircle2, Clock, Eye, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { AdminPageHeader } from '@/components/common/AdminPageHeader';
import { AdminMomentDetailModal } from '../components/AdminMomentDetailModal';
import { useAdminCommunityMoments } from '../hooks';
import type { AdminCommunityMomentItem, CommunityMomentStatus } from '../types';

export function AdminCommunityMomentsPage() {
  const [activeTab, setActiveTab] = useState<CommunityMomentStatus>('PENDING');
  const [selectedMoment, setSelectedMoment] = useState<AdminCommunityMomentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminCommunityMoments(activeTab);

  const allItems = data?.pages.flatMap((page) => page.items) || [];

  const handleOpenDetail = (moment: AdminCommunityMomentItem) => {
    setSelectedMoment(moment);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedMoment(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
      {/* Title */}
      <AdminPageHeader
        icon={<Camera className="h-5 w-5 text-brand-burgundy" />}
        title="Ảnh cộng đồng"
        subtitle="Kiểm duyệt ảnh khoảnh khắc sinh viên trước khi hiển thị trên trang chủ"
        className="mb-4 sm:mb-6"
      />

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl bg-brand-soft-pink/50 p-1 border border-brand-border/60">
        <button
          type="button"
          onClick={() => setActiveTab('PENDING')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[40px] ${
            activeTab === 'PENDING'
              ? 'bg-white text-brand-burgundy shadow-xs'
              : 'text-brand-text-secondary hover:text-brand-text'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Chờ duyệt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('APPROVED')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all min-h-[40px] ${
            activeTab === 'APPROVED'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-brand-text-secondary hover:text-brand-text'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Đang hiển thị</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-brand-text-muted">
          <Loader2 className="h-7 w-7 animate-spin mb-2 text-brand-burgundy" />
          <p className="text-xs sm:text-sm">Đang tải danh sách ảnh...</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl bg-red-50 p-6 text-center text-red-700 text-xs sm:text-sm border border-red-200">
          Không thể tải dữ liệu kiểm duyệt. Vui lòng tải lại trang.
        </div>
      ) : allItems.length === 0 ? (
        <div className="rounded-2xl bg-brand-warm-white p-10 text-center border border-brand-border/60 shadow-card">
          <Camera className="mx-auto h-10 w-10 text-brand-text-muted/50 mb-2" />
          <p className="text-sm font-semibold text-brand-text">
            {activeTab === 'PENDING'
              ? 'Không có ảnh nào đang chờ duyệt'
              : 'Chưa có ảnh nào đang hiển thị'}
          </p>
          <p className="text-xs text-brand-text-muted mt-1">
            {activeTab === 'PENDING'
              ? 'Các ảnh mới do sinh viên gửi sẽ xuất hiện tại đây.'
              : 'Tối đa 5 ảnh mới nhất được duyệt sẽ xuất hiện trên Hero.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allItems.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.moment_id}
                  onClick={() => handleOpenDetail(item)}
                  className="cursor-pointer rounded-2xl bg-brand-warm-white p-3.5 border border-brand-border/80 shadow-card hover:shadow-md transition-all flex items-center gap-3.5 card-interactive"
                >
                  {/* Thumbnail */}
                  <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 rounded-xl overflow-hidden bg-black/5 border border-brand-border/60">
                    <img
                      src={item.thumbnail_url || item.image_url}
                      alt="Thumbnail ảnh cộng đồng"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={item.uploader.avatar_url || undefined}
                        name={item.uploader.full_name}
                        size="xs"
                      />
                      <span className="text-xs sm:text-sm font-bold text-brand-text truncate">
                        {item.uploader.full_name}
                      </span>
                    </div>

                    <div className="text-[11px] sm:text-xs text-brand-text-muted mt-1">
                      <span>{formattedDate}</span>
                    </div>

                    {item.note && (
                      <p className="text-xs text-brand-text font-medium truncate mt-0.5" title={item.note}>
                        {item.note}
                      </p>
                    )}

                    {/* Badge */}
                    <div className="mt-1.5 flex items-center justify-between">
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="h-3 w-3" /> Chờ duyệt
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Đang hiển thị
                        </span>
                      )}

                      <span className="text-xs text-brand-burgundy font-medium flex items-center gap-0.5 hover:underline">
                        <Eye className="h-3.5 w-3.5" /> Xem
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keyset Pagination Load More */}
          {hasNextPage && (
            <div className="pt-3 flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-5 py-2.5 rounded-xl border border-brand-border bg-white text-xs sm:text-sm font-semibold text-brand-text hover:bg-brand-soft-pink/40 active:scale-95 transition-all min-h-[44px] flex items-center gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tải thêm...</span>
                  </>
                ) : (
                  <span>Xem thêm</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AdminMomentDetailModal
        moment={selectedMoment}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
