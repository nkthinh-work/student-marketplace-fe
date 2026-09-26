import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Heart,
  Loader2,
  LogIn,
  QrCode,
  Send,
  X,
  ZoomIn,
} from 'lucide-react';
import { useCurrentUser } from '@/features/users/hooks';
import { formatVND } from '@/lib/formatters';
import { useCreateSupportClaim, useMySupportClaims } from '../hooks';
import type { SupportResponse } from '../types';

interface VietQRSupportCardProps {
  support?: SupportResponse | null;
  isLoading?: boolean;
}

const DEFAULT_FIXED_QR_URL = '/support/nguyen-khac-thinh-vietqr.png';
const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

export const VietQRSupportCard: React.FC<VietQRSupportCardProps> = ({
  support,
  isLoading = false,
}) => {
  const { data: user } = useCurrentUser();
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Claim declaration state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState('50000');
  const [claimedTransferredAt, setClaimedTransferredAt] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [senderAccountName, setSenderAccountName] = useState('');
  const [wantsPublic, setWantsPublic] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const createClaimMutation = useCreateSupportClaim();
  const { data: myClaimsData } = useMySupportClaims(!!user?.user_id);

  const handleLoginPrompt = () => {
    const authCard = document.getElementById('auth-card');
    if (authCard) {
      authCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      const headerBtn = document.getElementById('header-profile-btn');
      headerBtn?.click();
    }
  };

  const handleOpenClaimModal = () => {
    if (!user?.user_id) {
      handleLoginPrompt();
      return;
    }
    setClaimError(null);
    setClaimSuccess(null);
    setIsClaimModalOpen(true);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimSuccess(null);

    const amountNum = parseInt(claimedAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setClaimError('Số tiền ủng hộ phải lớn hơn 0.');
      return;
    }

    if (!claimedTransferredAt) {
      setClaimError('Vui lòng chọn thời gian chuyển tiền.');
      return;
    }

    const trimmedSenderName = senderAccountName.trim();
    if (!trimmedSenderName) {
      setClaimError('Vui lòng nhập tên chủ tài khoản chuyển tiền.');
      return;
    }

    try {
      await createClaimMutation.mutateAsync({
        claimed_amount_vnd: amountNum,
        claimed_transferred_at: new Date(claimedTransferredAt).toISOString(),
        sender_account_name: trimmedSenderName,
        wants_public: wantsPublic,
      });

      setClaimSuccess('Đã gửi thông tin xác nhận thành công! Admin sẽ đối soát và cập nhật.');
      setTimeout(() => {
        setIsClaimModalOpen(false);
        setClaimSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setClaimError(detail || 'Có lỗi xảy ra khi gửi xác nhận. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs animate-pulse space-y-3">
        <div className="h-4 bg-stone-200 rounded w-1/3" />
        <div className="h-48 bg-stone-100 rounded-xl" />
      </div>
    );
  }

  const qrUrl = support?.fixed_qr_url || DEFAULT_FIXED_QR_URL;
  const supportMessage = support?.support_message || 'Quan trọng là tấm lòng 💛';
  const recentClaims = myClaimsData?.items || [];

  return (
    <>
      <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-burgundy">
            <Heart className="h-4 w-4 fill-brand-burgundy text-brand-burgundy" />
            <span>Ủng hộ dự án</span>
          </div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full">
            {supportMessage}
          </span>
        </div>

        {/* Support Description */}
        <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
          Chợ PTITers là dự án cộng đồng phục vụ sinh viên Học viện. Nếu bạn thấy nền tảng hữu ích và muốn gửi chút tấm lòng để hỗ trợ duy trì máy chủ, bạn có thể quét mã VietQR bên dưới.
        </p>

        {/* QR Section */}
        <div className="flex flex-col items-center justify-center p-4 bg-brand-cream/30 rounded-2xl border border-brand-border/60">
          <div
            onClick={() => setIsZoomOpen(true)}
            className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white p-3 shadow-card border border-stone-200/80 transition-all hover:shadow-md hover:scale-[1.01]"
            title="Nhấn để phóng to mã QR"
          >
            {!imgError ? (
              <img
                src={qrUrl}
                alt="Mã VietQR ủng hộ"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl filter-none"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center">
                <QrCode className="h-10 w-10 text-brand-burgundy/40 mb-2" />
                <span className="text-xs font-semibold text-brand-text">Mã VietQR</span>
                <span className="text-[11px] text-brand-text-muted mt-1">{supportMessage}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-xs font-semibold text-brand-burgundy shadow-md">
                <ZoomIn className="h-3.5 w-3.5" /> Phóng to
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-text-muted">
            <QrCode className="h-4 w-4" />
            <span>Quét bằng bất kỳ ứng dụng ngân hàng hoặc ví điện tử</span>
          </div>

          {/* Action Area */}
          {user?.user_id ? (
            <div className="mt-4 w-full">
              <button
                type="button"
                onClick={handleOpenClaimModal}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-burgundy text-white font-bold text-sm shadow-md hover:bg-brand-burgundy-dark active:scale-[0.99] transition-all cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Tôi đã chuyển khoản</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 w-full rounded-xl bg-stone-50 border border-stone-200/80 p-3.5 text-center space-y-2">
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Đăng nhập để gửi xác nhận chuyển khoản và được ghi nhận trên Bảng tri ân nhé 💛
              </p>
              <button
                type="button"
                onClick={handleLoginPrompt}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Đăng nhập ngay</span>
              </button>
            </div>
          )}
        </div>

        {/* User's Recent Declarations Feed */}
        {user?.user_id && recentClaims.length > 0 && (
          <div className="pt-2 border-t border-brand-border/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-brand-text">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand-text-secondary" />
                <span>Xác nhận chuyển khoản gần đây của bạn</span>
              </span>
              <span className="text-[11px] font-normal text-brand-text-muted">
                {recentClaims.length} yêu cầu
              </span>
            </div>

            <div className="space-y-2">
              {recentClaims.slice(0, 3).map((claim) => (
                <div
                  key={claim.claim_id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/50 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-bold text-brand-text">
                      {formatVND(claim.claimed_amount_vnd)}
                    </div>
                    <div className="text-[11px] text-brand-text-muted truncate">
                      {new Date(claim.claimed_transferred_at).toLocaleString('vi-VN')}
                      {claim.sender_account_name && ` • ${claim.sender_account_name}`}
                    </div>
                  </div>

                  <div>
                    {claim.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200">
                        <Clock className="h-3 w-3 animate-pulse" />
                        <span>Đang chờ đối soát</span>
                      </span>
                    )}
                    {claim.status === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        <Check className="h-3 w-3" />
                        <span>Khoản ủng hộ đã được xác nhận</span>
                      </span>
                    )}
                    {claim.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 text-[11px] font-medium border border-stone-300">
                        <AlertCircle className="h-3 w-3" />
                        <span>Không tìm thấy giao dịch phù hợp</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Declaration Modal */}
      {isClaimModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="fixed inset-0 cursor-default"
              onClick={() => setIsClaimModalOpen(false)}
              aria-label="Đóng"
            />

            <div className="relative z-10 max-w-md w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-brand-burgundy/10 text-brand-burgundy">
                    <Heart className="h-4 w-4 fill-brand-burgundy" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-brand-text">
                      Xác nhận chuyển khoản ủng hộ
                    </h3>
                    <p className="text-[11px] text-brand-text-muted">
                      Admin sẽ đối soát sao kê tài khoản ngân hàng và xác nhận
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Alert */}
              {claimSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{claimSuccess}</span>
                </div>
              )}

              {claimError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{claimError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmitClaim} className="space-y-3.5">
                {/* 1. Số tiền đã chuyển */}
                <div className="space-y-1">
                  <label htmlFor="claim-amount-input" className="block text-xs font-semibold text-brand-text">
                    Số tiền đã chuyển (VND) <span className="text-brand-burgundy">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="claim-amount-input"
                      type="number"
                      min="1000"
                      step="1000"
                      value={claimedAmount}
                      onChange={(e) => setClaimedAmount(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm font-semibold text-brand-text focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy pr-24"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-burgundy">
                      {formatVND(parseInt(claimedAmount, 10) || 0)}
                    </span>
                  </div>
                  {/* Quick selection chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setClaimedAmount(String(amt))}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                          claimedAmount === String(amt)
                            ? 'border-brand-burgundy bg-brand-soft-pink text-brand-burgundy font-bold'
                            : 'border-brand-border/70 bg-stone-50 text-brand-text-secondary hover:bg-stone-100'
                        }`}
                      >
                        {formatVND(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Thời gian chuyển */}
                <div className="space-y-1">
                  <label htmlFor="claim-time-input" className="block text-xs font-semibold text-brand-text">
                    Thời gian chuyển <span className="text-brand-burgundy">*</span>
                  </label>
                  <input
                    id="claim-time-input"
                    type="datetime-local"
                    value={claimedTransferredAt}
                    onChange={(e) => setClaimedTransferredAt(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm text-brand-text focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy"
                    required
                  />
                </div>

                {/* 3. Tên người chuyển / Tên tài khoản */}
                <div className="space-y-1">
                  <label htmlFor="claim-sender-name-input" className="block text-xs font-semibold text-brand-text">
                    Tên chủ tài khoản chuyển tiền <span className="text-brand-burgundy">*</span>
                  </label>
                  <input
                    id="claim-sender-name-input"
                    type="text"
                    maxLength={120}
                    placeholder="VD: NGUYEN VAN A"
                    value={senderAccountName}
                    onChange={(e) => setSenderAccountName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm text-brand-text placeholder:text-brand-text-muted focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy"
                  />
                  <p className="text-[10px] text-brand-text-muted">
                    Nhập tên chính xác trên ứng dụng ngân hàng để Admin đối soát nhanh chóng
                  </p>
                </div>

                {/* 4. Consent for Leaderboard */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsPublic}
                      onChange={(e) => setWantsPublic(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-sm border-gray-300 text-brand-burgundy focus:ring-brand-burgundy"
                    />
                    <span className="text-xs text-brand-text leading-relaxed">
                      Tôi đồng ý hiển thị tên trên Bảng tri ân nếu khoản ủng hộ được xác nhận
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createClaimMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-burgundy text-white text-xs font-bold shadow-xs hover:bg-brand-burgundy-dark transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {createClaimMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Gửi xác nhận</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* QR Zoom Modal */}
      {isZoomOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="fixed inset-0 cursor-default"
              onClick={() => setIsZoomOpen(false)}
              aria-label="Đóng"
            />

            <div className="relative z-10 max-w-sm w-full bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 flex flex-col items-center animate-in zoom-in-95 duration-150">
              <div className="w-full flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-burgundy uppercase">
                  <Heart className="h-4 w-4 fill-brand-burgundy" />
                  <span>Ủng hộ Chợ PTITers</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!imgError ? (
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                  <img
                    src={qrUrl}
                    alt="Mã VietQR phóng to"
                    className="w-72 h-72 sm:w-80 sm:h-80 object-contain rounded-xl filter-none"
                  />
                </div>
              ) : (
                <div className="w-72 h-72 sm:w-80 sm:h-80 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 text-center">
                  <QrCode className="h-12 w-12 text-brand-burgundy/40 mb-2" />
                  <span className="text-sm font-semibold text-brand-text">Mã VietQR</span>
                  <span className="text-xs text-brand-text-muted mt-1">{supportMessage}</span>
                </div>
              )}

              <p className="mt-3 text-xs text-center font-medium text-brand-text-secondary">
                {supportMessage}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
