import React, { useState } from 'react';
import {
  ClipboardCheck,
  Clock,
  Check,
  X,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  Loader2,
  RefreshCw,
  Eye,
  Send,
  User as UserIcon,
} from 'lucide-react';
import {
  useAdminProductApprovals,
  useAdminProductApprovalDetail,
  useDecideAdminProductApproval,
} from '../hooks';
import type {
  AdminProductApprovalSummary,
  AdminProductApprovalDetailResponse,
  ProductApprovalStatus,
} from '../types';
import { formatVND, formatDate } from '@/lib/formatters';

const REJECTION_PRESETS = [
  'Thông tin sản phẩm chưa rõ ràng.',
  'Hình ảnh chưa phù hợp với nội dung tin đăng.',
  'Tin đăng có dấu hiệu trùng lặp hoặc spam.',
  'Nội dung tin đăng chưa phù hợp với quy định cộng đồng.',
  'Cần làm rõ tính xác thực của sản phẩm.',
];

export const AdminProductApprovalsPage: React.FC = () => {
  const [selectedState, setSelectedState] = useState<ProductApprovalStatus>('PENDING');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminProductApprovals({
    state: selectedState,
    limit: 20,
    cursor,
  });

  const { data: detailData, isLoading: isDetailLoading } = useAdminProductApprovalDetail(
    selectedProductId || undefined
  );

  const decideMutation = useDecideAdminProductApproval();

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleOpenDetail = (productId: number) => {
    setSelectedProductId(productId);
    setActiveImageIndex(0);
    setRejectionNote('');
    setRejectionError(null);
  };

  const handleCloseDetail = () => {
    setSelectedProductId(null);
    setIsRejectModalOpen(false);
    setRejectionNote('');
    setRejectionError(null);
  };

  const handleApprove = (product: AdminProductApprovalDetailResponse) => {
    if (!window.confirm(`Xác nhận DUYỆT tin đăng "${product.title}"?`)) return;

    decideMutation.mutate(
      {
        productId: product.product_id,
        data: { decision: 'APPROVE' },
      },
      {
        onSuccess: () => {
          handleCloseDetail();
          refetch();
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          alert(typeof detail === 'string' ? detail : 'Thao tác duyệt thất bại hoặc tin đăng đã thay đổi trạng thái.');
          refetch();
        },
      }
    );
  };

  const handleRejectSubmit = () => {
    if (!selectedProductId) return;
    const trimmed = rejectionNote.trim();
    if (!trimmed) {
      setRejectionError('Vui lòng nhập lý do từ chối (1..500 ký tự).');
      return;
    }
    if (trimmed.length > 500) {
      setRejectionError('Lý do từ chối không được vượt quá 500 ký tự.');
      return;
    }

    decideMutation.mutate(
      {
        productId: selectedProductId,
        data: {
          decision: 'REJECT',
          note: trimmed,
        },
      },
      {
        onSuccess: () => {
          handleCloseDetail();
          refetch();
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          setRejectionError(
            typeof detail === 'string'
              ? detail
              : 'Thao tác từ chối thất bại hoặc tin đăng đã thay đổi trạng thái.'
          );
          refetch();
        },
      }
    );
  };

  const items = data?.items || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:py-6">
      {/* Page Header */}
      <div className="space-y-1 mb-5">
        <h1 className="text-xl sm:text-2xl font-black text-brand-text flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-brand-burgundy" />
          Kiểm duyệt tin đăng
        </h1>
        <p className="text-xs sm:text-sm text-brand-text-secondary">
          Kiểm tra nội dung và hình ảnh tin đăng của sinh viên trước khi công khai trên Chợ PTITers.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-brand-border/70 pb-2 mb-4 gap-2 flex-wrap">
        <div className="flex gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedState('PENDING');
              setCursor(undefined);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              selectedState === 'PENDING'
                ? 'bg-brand-burgundy text-white'
                : 'bg-white text-brand-text-secondary border border-brand-border hover:bg-brand-soft-pink'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Chờ duyệt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedState('APPROVED');
              setCursor(undefined);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              selectedState === 'APPROVED'
                ? 'bg-brand-burgundy text-white'
                : 'bg-white text-brand-text-secondary border border-brand-border hover:bg-brand-soft-pink'
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            <span>Đã duyệt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedState('REJECTED');
              setCursor(undefined);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              selectedState === 'REJECTED'
                ? 'bg-brand-burgundy text-white'
                : 'bg-white text-brand-text-secondary border border-brand-border hover:bg-brand-soft-pink'
            }`}
          >
            <X className="h-3.5 w-3.5" />
            <span>Đã từ chối</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-brand-text-secondary hover:text-brand-burgundy rounded-lg border border-brand-border/60 hover:bg-white cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">Làm mới</span>
        </button>
      </div>

      {/* Main Queue Content */}
      {isLoading ? (
        <div className="flex min-h-[30dvh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-burgundy" />
        </div>
      ) : isError ? (
        <div className="p-8 rounded-2xl border border-red-200 bg-red-50 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <p className="text-sm font-bold text-red-800">Không thể tải hàng đợi kiểm duyệt</p>
          <p className="text-xs text-red-700">
            {(error as any)?.response?.data?.detail || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-border p-12 text-center bg-brand-warm-white/60 space-y-2">
          <Tag className="h-10 w-10 text-brand-text-muted stroke-1" />
          <p className="text-sm font-bold text-brand-text">
            {selectedState === 'PENDING'
              ? 'Không có tin đăng nào đang chờ duyệt'
              : `Không có tin đăng nào ở trạng thái ${selectedState}`}
          </p>
          <p className="text-xs text-brand-text-secondary">
            {selectedState === 'PENDING'
              ? 'Tuyệt vời! Tất cả tin đăng gửi lên đã được xử lý xong.'
              : 'Danh sách sẽ cập nhật khi có tin đăng mới.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: AdminProductApprovalSummary) => (
            <div
              key={item.product_id}
              className="p-3 sm:p-4 rounded-2xl bg-brand-warm-white border border-brand-border shadow-xs flex gap-3 sm:gap-4 items-center justify-between"
            >
              {/* Thumbnail & Basic Info */}
              <div className="flex gap-3 sm:gap-3.5 items-center min-w-0 flex-1">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-brand-soft-pink shrink-0 border border-brand-border/60">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-brand-text-muted">
                      <ImageIcon className="h-6 w-6 stroke-1" />
                    </div>
                  )}
                  {item.image_count > 0 && (
                    <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1 py-0.2 text-[9px] font-bold text-white">
                      {item.image_count} ảnh
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-brand-text-muted">
                    <span className="font-semibold text-brand-burgundy">{item.category.name}</span>
                    <span>·</span>
                    <span className="truncate">Người bán: {item.seller.full_name}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-brand-text line-clamp-1 break-words">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-extrabold text-brand-price">{formatVND(item.price)}</span>
                    {item.listing_type === 'AUCTION' && (
                      <span className="rounded-md px-1.5 py-0.2 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Đấu giá
                      </span>
                    )}
                    <span className="text-[11px] text-brand-text-muted ml-auto hidden sm:inline">
                      Gửi: {item.submitted_for_review_at ? formatDate(item.submitted_for_review_at) : formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleOpenDetail(item.product_id)}
                className="btn-interactive shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-brand-burgundy px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-burgundy-dark cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Xem & duyệt</span>
              </button>
            </div>
          ))}

          {/* Keyset Cursor Pagination Next Button */}
          {data?.has_more && data.next_cursor && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => setCursor(data.next_cursor || undefined)}
                className="btn-interactive inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-xs font-semibold text-brand-burgundy border border-brand-border shadow-xs hover:bg-brand-soft-pink cursor-pointer"
              >
                <span>Xem thêm danh sách tiếp theo</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail / Review Modal */}
      {selectedProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-3xl bg-brand-warm-white border border-brand-border shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border/70 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-brand-burgundy" />
                <h2 className="text-sm sm:text-base font-bold text-brand-text">
                  Chi tiết tin đăng kiểm duyệt
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-1 rounded-full text-brand-text-muted hover:bg-stone-100 hover:text-brand-text transition-colors"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {isDetailLoading || !detailData ? (
                <div className="flex min-h-[30dvh] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-burgundy" />
                </div>
              ) : (
                <>
                  {/* Image Gallery */}
                  {detailData.images && detailData.images.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black/5 border border-brand-border/60">
                        <img
                          src={detailData.images[activeImageIndex]?.image_url}
                          alt={detailData.title}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      {detailData.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                          {detailData.images.map((img, idx) => (
                            <button
                              key={img.image_id}
                              type="button"
                              onClick={() => setActiveImageIndex(idx)}
                              className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                idx === activeImageIndex
                                  ? 'border-brand-burgundy ring-2 ring-brand-burgundy/20'
                                  : 'border-transparent opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center flex items-center justify-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      <span>Tin đăng này không có ảnh.</span>
                    </div>
                  )}

                  {/* Title & Price & Attributes */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="rounded-md px-2 py-0.5 font-bold bg-brand-soft-pink text-brand-burgundy">
                        {detailData.category.name}
                      </span>
                      <span className="rounded-md px-2 py-0.5 font-bold bg-stone-100 text-stone-700">
                        {detailData.listing_type === 'AUCTION' ? 'Đấu giá' : 'Giá cố định'}
                      </span>
                      <span className="text-brand-text-muted ml-auto text-[11px]">
                        Gửi lúc: {detailData.submitted_for_review_at ? formatDate(detailData.submitted_for_review_at) : formatDate(detailData.created_at)}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-brand-text break-words">
                      {detailData.title}
                    </h3>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-lg font-black text-brand-price">
                        {formatVND(detailData.price)}
                      </span>
                      <span className="text-xs text-brand-text-secondary">
                        Tồn kho: <strong>{detailData.stock}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1 pt-2 border-t border-brand-border/60">
                    <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
                      Mô tả sản phẩm
                    </h4>
                    <p className="text-xs sm:text-sm text-brand-text whitespace-pre-line break-words leading-relaxed bg-white p-3.5 rounded-2xl border border-brand-border/60">
                      {detailData.description || 'Không có mô tả chi tiết.'}
                    </p>
                  </div>

                  {/* Seller Safe Summary */}
                  <div className="space-y-1.5 pt-2 border-t border-brand-border/60">
                    <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">
                      Thông tin người bán
                    </h4>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-brand-border/60 text-xs">
                      {detailData.seller.avatar_url ? (
                        <img
                          src={detailData.seller.avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="font-bold text-brand-text block truncate">
                          {detailData.seller.full_name}
                        </span>
                        <span className="text-stone-500 block truncate">
                          Khu vực: {detailData.seller.delivery_area || detailData.seller.default_meetup_area || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Previous Decision Notes if any */}
                  {detailData.review_note && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                      <span className="font-bold block">Ghi chú từ chối trước đó:</span>
                      <p className="text-xs text-rose-700">{detailData.review_note}</p>
                    </div>
                  )}

                  {/* Rejection Form Inside Modal (if expanded) */}
                  {isRejectModalOpen && (
                    <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-800 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Chọn hoặc nhập lý do từ chối (bắt buộc)
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsRejectModalOpen(false)}
                          className="text-xs text-stone-500 hover:text-stone-700"
                        >
                          Hủy
                        </button>
                      </div>

                      {/* Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {REJECTION_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setRejectionNote(preset);
                              setRejectionError(null);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 transition-colors text-left"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={3}
                        maxLength={500}
                        value={rejectionNote}
                        onChange={(e) => {
                          setRejectionNote(e.target.value);
                          setRejectionError(null);
                        }}
                        placeholder="Nhập lý do từ chối gửi tới người bán (1..500 ký tự)..."
                        className="w-full rounded-xl bg-white border border-red-300 p-2.5 text-xs text-brand-text focus:outline-brand-burgundy"
                      />

                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>{rejectionError && <span className="text-red-600 font-bold">{rejectionError}</span>}</span>
                        <span>{rejectionNote.length}/500</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRejectSubmit}
                        disabled={decideMutation.isPending}
                        className="btn-interactive w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{decideMutation.isPending ? 'Đang gửi quyết định...' : 'Xác nhận từ chối tin đăng'}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Sticky Actions Footer */}
            {detailData && !isRejectModalOpen && detailData.approval_status === 'PENDING' && (
              <div className="flex items-center justify-end gap-3 p-4 border-t border-brand-border/70 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={decideMutation.isPending}
                  className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  <span>Từ chối</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(detailData)}
                  disabled={decideMutation.isPending}
                  className="btn-interactive inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Duyệt tin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
