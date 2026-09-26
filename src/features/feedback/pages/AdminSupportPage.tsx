import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HeartHandshake,
  Inbox,
  Loader2,
  Lock,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/common/AdminPageHeader';
import { Avatar } from '@/components/common/Avatar';
import { searchAdminSupporters } from '../api';
import { formatVND } from '@/lib/formatters';
import {
  useAdminSupportClaims,
  useAdminSupportContributions,
  useCreateAdminSupportContribution,
  useDeleteAdminSupportContribution,
  useRejectAdminSupportClaim,
  useUpdateAdminSupportContributionVisibility,
  useVerifyAdminSupportClaim,
} from '../hooks';
import type {
  AdminSupportClaimItem,
  AdminSupportContributionItem,
  SupporterSearchResult,
} from '../types';

type TabType = 'PENDING_CLAIMS' | 'VERIFIED_LEDGER' | 'MANUAL_ENTRY';

function formatLedgerTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} • ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export const AdminSupportPage: React.FC = () => {
  // Tabs State
  const [activeTab, setActiveTab] = useState<TabType>('PENDING_CLAIMS');

  // Queries & Mutations
  const {
    data: pendingClaimsData,
    isLoading: isClaimsLoading,
    refetch: refetchClaims,
    isFetching: isClaimsFetching,
  } = useAdminSupportClaims({ status: 'PENDING', limit: 50 });

  const {
    data: contributionsData,
    isLoading: isContribsLoading,
    refetch: refetchContribs,
    isFetching: isContribsFetching,
  } = useAdminSupportContributions({ limit: 50 });

  const verifyClaimMutation = useVerifyAdminSupportClaim();
  const rejectClaimMutation = useRejectAdminSupportClaim();
  const createContributionMutation = useCreateAdminSupportContribution();
  const visibilityMutation = useUpdateAdminSupportContributionVisibility();
  const deleteMutation = useDeleteAdminSupportContribution();

  // Verification Dialog State
  const [verifyingClaim, setVerifyingClaim] = useState<AdminSupportClaimItem | null>(null);
  const [verifiedAmount, setVerifiedAmount] = useState<string>('50000');
  const [verifiedReceivedAt, setVerifiedReceivedAt] = useState<string>('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Rejection Dialog State
  const [rejectingClaim, setRejectingClaim] = useState<AdminSupportClaimItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Manual Form State
  const [supporterSearchQuery, setSupporterSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SupporterSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSupporter, setSelectedSupporter] = useState<SupporterSearchResult | null>(null);
  const [amountVnd, setAmountVnd] = useState<string>('50000');
  const [receivedAt, setReceivedAt] = useState<string>(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  });
  const [isPublic, setIsPublic] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Handlers for Verification
  const handleOpenVerifyModal = (claim: AdminSupportClaimItem) => {
    setVerifyingClaim(claim);
    setVerifiedAmount(String(claim.claimed_amount_vnd));
    try {
      const d = new Date(claim.claimed_transferred_at);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      setVerifiedReceivedAt(local.toISOString().slice(0, 16));
    } catch {
      setVerifiedReceivedAt('');
    }
    setVerifyError(null);
  };

  const handleConfirmVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingClaim) return;
    setVerifyError(null);

    const amountNum = parseInt(verifiedAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setVerifyError('Số tiền thực nhận phải lớn hơn 0.');
      return;
    }

    if (!verifiedReceivedAt) {
      setVerifyError('Vui lòng chọn thời gian nhận tiền.');
      return;
    }

    try {
      await verifyClaimMutation.mutateAsync({
        claimId: verifyingClaim.claim_id,
        payload: {
          amount_vnd: amountNum,
          received_at: new Date(verifiedReceivedAt).toISOString(),
        },
      });
      setVerifyingClaim(null);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setVerifyError(detail || 'Có lỗi xảy ra khi xác nhận.');
    }
  };

  // Handlers for Rejection
  const handleOpenRejectModal = (claim: AdminSupportClaimItem) => {
    setRejectingClaim(claim);
    setRejectionReason('');
    setRejectError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingClaim) return;
    setRejectError(null);

    try {
      await rejectClaimMutation.mutateAsync({
        claimId: rejectingClaim.claim_id,
        payload: {
          rejection_reason: rejectionReason.trim() || null,
        },
      });
      setRejectingClaim(null);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setRejectError(detail || 'Có lỗi xảy ra khi từ chối.');
    }
  };

  // Search supporter for manual entry
  const handleSearchSupporters = async () => {
    const trimmed = supporterSearchQuery.trim();
    if (!trimmed) {
      setSearchError('Vui lòng nhập tên người dùng để tìm kiếm.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchAdminSupporters(trimmed);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(`Không tìm thấy người dùng nào phù hợp với "${trimmed}".`);
      }
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSearchError(detail || 'Có lỗi xảy ra khi tìm kiếm người dùng.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSupporter = (supporter: SupporterSearchResult) => {
    setSelectedSupporter(supporter);
    setSearchResults([]);
    setSearchError(null);
  };

  const handleClearSelectedSupporter = () => {
    setSelectedSupporter(null);
    setSearchResults([]);
    setSearchError(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);

    if (!selectedSupporter) {
      setFormError('Vui lòng tìm và chọn người ủng hộ trước khi ghi nhận.');
      return;
    }

    const amountNum = parseInt(amountVnd, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Số tiền ủng hộ phải lớn hơn 0.');
      return;
    }

    if (!receivedAt) {
      setFormError('Vui lòng chọn thời gian nhận tiền.');
      return;
    }

    try {
      await createContributionMutation.mutateAsync({
        supporter_id: selectedSupporter.user_id,
        amount_vnd: amountNum,
        received_at: new Date(receivedAt).toISOString(),
        is_public: isPublic,
        transaction_ref: transactionRef.trim() || null,
        admin_note: adminNote.trim() || null,
      });

      setFormSuccess(
        `Đã ghi nhận thành công ${formatVND(amountNum)} cho ${selectedSupporter.full_name}!`
      );
      setSelectedSupporter(null);
      setSupporterSearchQuery('');
      setAmountVnd('50000');
      setIsPublic(false);
      setTransactionRef('');
      setAdminNote('');
      setTimeout(() => setFormSuccess(null), 5000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFormError(detail || 'Có lỗi xảy ra khi ghi nhận đóng góp.');
    }
  };

  const handleToggleVisibility = async (item: AdminSupportContributionItem) => {
    try {
      await visibilityMutation.mutateAsync({
        contributionId: item.contribution_id,
        payload: { is_public: !item.is_public },
      });
    } catch {
      alert('Không thể cập nhật trạng thái hiển thị.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
    } catch {
      alert('Không thể xóa bản ghi đóng góp.');
    }
  };

  const pendingClaims = pendingClaimsData?.items || [];
  const contributions = contributionsData?.items || [];

  return (
    <div className="mx-auto max-w-4xl px-3.5 py-5 sm:px-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        icon={<HeartHandshake className="h-5 w-5 text-brand-burgundy" />}
        title="Quản lý ủng hộ dự án"
        subtitle="Hàng đợi đối soát xác nhận và sổ cái các khoản ủng hộ thực tế cho Chợ PTITers"
        action={
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'PENDING_CLAIMS') refetchClaims();
              else refetchContribs();
            }}
            disabled={isClaimsFetching || isContribsFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-brand-text-secondary ${
                isClaimsFetching || isContribsFetching ? 'animate-spin' : ''
              }`}
            />
            <span>Làm mới</span>
          </button>
        }
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100/80 rounded-2xl border border-brand-border/60">
        <button
          type="button"
          onClick={() => setActiveTab('PENDING_CLAIMS')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'PENDING_CLAIMS'
              ? 'bg-white text-brand-burgundy shadow-xs'
              : 'text-brand-text-secondary hover:text-brand-text'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Chờ xác nhận</span>
          {pendingClaims.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-brand-burgundy text-white">
              {pendingClaims.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VERIFIED_LEDGER')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'VERIFIED_LEDGER'
              ? 'bg-white text-brand-burgundy shadow-xs'
              : 'text-brand-text-secondary hover:text-brand-text'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Đã xác nhận</span>
          {contributions.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-stone-200 text-stone-700">
              {contributions.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MANUAL_ENTRY')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'MANUAL_ENTRY'
              ? 'bg-white text-brand-burgundy shadow-xs'
              : 'text-brand-text-secondary hover:text-brand-text'
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Ghi nhận thủ công</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: CHỜ XÁC NHẬN (PENDING CLAIMS QUEUE) */}
      {/* ============================================================== */}
      {activeTab === 'PENDING_CLAIMS' && (
        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-brand-text flex items-center gap-2">
                <span>Hàng đợi đối soát</span>
                <span className="text-xs font-normal text-brand-text-muted">
                  ({pendingClaims.length} yêu cầu đang chờ)
                </span>
              </h2>
              <p className="text-xs text-brand-text-muted mt-0.5">
                Kiểm tra sao kê ngân hàng thực tế, bấm Xác nhận để tạo sổ cái hoặc từ chối nếu không khớp.
              </p>
            </div>
          </div>

          {isClaimsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-brand-text-muted text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-brand-burgundy" />
              <span>Đang tải hàng đợi đối soát...</span>
            </div>
          ) : pendingClaims.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-brand-text-muted">
              <Inbox className="h-10 w-10 text-stone-300" />
              <p className="text-sm font-semibold text-brand-text">Không có yêu cầu nào đang chờ đối soát</p>
              <p className="text-xs text-brand-text-muted max-w-sm">
                Khi sinh viên chuyển khoản và bấm "Tôi đã chuyển khoản", yêu cầu xác nhận sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingClaims.map((claim) => (
                <div
                  key={claim.claim_id}
                  className="rounded-xl border border-brand-border/80 bg-stone-50/40 p-4 sm:p-5 transition-all hover:bg-stone-50 hover:border-brand-border space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Supporter Identity */}
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={claim.supporter.avatar_url}
                        name={claim.supporter.full_name}
                        size="md"
                        className="border border-stone-200"
                      />
                      <div>
                        <div className="text-sm font-bold text-brand-text flex items-center gap-2">
                          <span>{claim.supporter.full_name}</span>
                        </div>
                        <div className="text-xs text-brand-text-muted flex items-center gap-2 mt-0.5">
                          <Link
                            to={claim.supporter.profile_path}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-brand-burgundy hover:underline font-medium"
                          >
                            <span>Xem hồ sơ</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <span>•</span>
                          <span>Gửi lúc: {formatLedgerTime(claim.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Claimed Amount Badge */}
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-bold text-brand-burgundy">
                        {formatVND(claim.claimed_amount_vnd)}
                      </div>
                      <div className="text-[11px] text-brand-text-muted">Số tiền khai báo</div>
                    </div>
                  </div>

                  {/* Reconciliation Context Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-white border border-stone-200 text-xs">
                    <div>
                      <span className="text-brand-text-muted block text-[11px]">Thời gian chuyển:</span>
                      <span className="font-semibold text-brand-text">
                        {formatLedgerTime(claim.claimed_transferred_at)}
                      </span>
                    </div>

                    <div>
                      <span className="text-brand-text-muted block text-[11px]">Người chuyển (Khai báo):</span>
                      <span className="font-semibold text-brand-text">
                        {claim.sender_account_name || '(Không cung cấp)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-brand-text-muted block text-[11px]">Công khai Bảng tri ân:</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          claim.wants_public ? 'text-emerald-700' : 'text-stone-600'
                        }`}
                      >
                        {claim.wants_public ? (
                          <>
                            <Globe className="h-3 w-3" /> Có
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Không (Riêng tư)
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(claim)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Không tìm thấy giao dịch</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenVerifyModal(claim)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Xác nhận đã nhận tiền</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ĐÃ XÁC NHẬN (VERIFIED CONTRIBUTIONS LEDGER) */}
      {/* ============================================================== */}
      {activeTab === 'VERIFIED_LEDGER' && (
        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-brand-text flex items-center gap-2">
                <span>Sổ cái đóng góp đã xác nhận</span>
                <span className="text-xs font-normal text-brand-text-muted">
                  ({contributions.length} bản ghi)
                </span>
              </h2>
              <p className="text-xs text-brand-text-muted mt-0.5">
                Các khoản đóng góp có thực tế đã vào tài khoản ngân hàng và được Admin xác nhận.
              </p>
            </div>
          </div>

          {isContribsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-brand-text-muted text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-brand-burgundy" />
              <span>Đang tải sổ cái...</span>
            </div>
          ) : contributions.length === 0 ? (
            <div className="py-12 text-center text-brand-text-muted text-xs">
              Chưa có khoản đóng góp nào được xác nhận.
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((item) => (
                <div
                  key={item.contribution_id}
                  className="rounded-xl border border-brand-border/80 bg-stone-50/30 p-4 transition-all hover:bg-stone-50 hover:border-brand-border space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Supporter Identity */}
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={item.supporter.avatar_url}
                        name={item.supporter.full_name}
                        size="md"
                        className="border border-stone-200"
                      />
                      <div>
                        <div className="text-sm font-bold text-brand-text flex items-center gap-2">
                          <span>{item.supporter.full_name}</span>
                          <span className="text-xs font-semibold text-brand-burgundy bg-brand-soft-pink px-2 py-0.5 rounded-full">
                            #{item.supporter.user_id}
                          </span>
                        </div>
                        <div className="text-xs text-brand-text-muted flex items-center gap-2 mt-0.5">
                          <Link
                            to={`/users/${item.supporter.user_id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-brand-burgundy hover:underline font-medium"
                          >
                            <span>Xem hồ sơ</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <span>•</span>
                          <span>Nhận: {formatLedgerTime(item.received_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount & Visibility Status */}
                    <div className="flex items-center gap-4 self-start sm:self-auto">
                      <div className="text-right">
                        <div className="text-base font-bold text-brand-burgundy">
                          {formatVND(item.amount_vnd)}
                        </div>
                        <div className="text-[11px] text-brand-text-muted flex items-center gap-1 justify-end">
                          {item.is_public ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <Globe className="h-3 w-3" /> Công khai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                              <Lock className="h-3 w-3" /> Riêng tư
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reference & Note */}
                  {(item.transaction_ref || item.admin_note) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-stone-200/80">
                      {item.transaction_ref && (
                        <div>
                          <span className="text-brand-text-muted">Mã GD / Ref: </span>
                          <span className="font-mono font-bold text-brand-text select-all">
                            {item.transaction_ref}
                          </span>
                        </div>
                      )}
                      {item.admin_note && (
                        <div>
                          <span className="text-brand-text-muted">Ghi chú: </span>
                          <span className="text-brand-text">{item.admin_note}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recorder & Action Buttons */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/60">
                    <span className="text-brand-text-muted text-[11px]">
                      Ghi nhận bởi: <span className="font-medium text-brand-text">{item.recorded_by.full_name}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(item)}
                        disabled={visibilityMutation.isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          item.is_public
                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                        title={item.is_public ? 'Chuyển sang riêng tư' : 'Bật hiển thị công khai'}
                      >
                        {item.is_public ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Ẩn</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            <span>Công khai</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(item.contribution_id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                        title="Xóa bản ghi sai sót"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GHI NHẬN THỦ CÔNG (FALLBACK WORKFLOW) */}
      {/* ============================================================== */}
      {activeTab === 'MANUAL_ENTRY' && (
        <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div className="pb-2 border-b border-brand-border/60">
            <h2 className="text-sm sm:text-base font-bold text-brand-text flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-brand-burgundy" />
              <span>Ghi nhận khoản ủng hộ thủ công</span>
            </h2>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Dùng làm phương án dự phòng khi người dùng chuyển khoản nhưng không gửi yêu cầu xác nhận.
            </p>
          </div>

          {formSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            {/* Supporter Search */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-brand-text">
                Người ủng hộ <span className="text-brand-burgundy">*</span>
              </label>

              {selectedSupporter ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      src={selectedSupporter.avatar_url}
                      name={selectedSupporter.full_name}
                      size="sm"
                      className="border border-emerald-200"
                    />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-brand-text truncate">
                        {selectedSupporter.full_name}
                      </div>
                      <Link
                        to={selectedSupporter.profile_path}
                        target="_blank"
                        className="text-[11px] text-brand-burgundy hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>Xem hồ sơ</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedSupporter}
                    className="px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  >
                    Đổi người dùng
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="supporter-search-input"
                      type="text"
                      placeholder="Tìm theo tên người dùng..."
                      value={supporterSearchQuery}
                      onChange={(e) => {
                        setSupporterSearchQuery(e.target.value);
                        if (searchError) setSearchError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchSupporters();
                        }
                      }}
                      className="flex-1 rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm text-brand-text placeholder:text-brand-text-muted focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy"
                    />
                    <button
                      type="button"
                      onClick={handleSearchSupporters}
                      disabled={isSearching || !supporterSearchQuery.trim()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-burgundy text-white text-xs font-semibold hover:bg-brand-burgundy-dark transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSearching ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                      <span>Tìm kiếm</span>
                    </button>
                  </div>

                  {searchError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {searchError}
                    </p>
                  )}

                  {searchResults.length > 0 && (
                    <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100 max-h-56 overflow-y-auto shadow-xs">
                      {searchResults.map((supporter) => (
                        <div
                          key={supporter.user_id}
                          className="flex items-center justify-between p-2.5 hover:bg-stone-50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              src={supporter.avatar_url}
                              name={supporter.full_name}
                              size="sm"
                              className="border border-stone-200"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-brand-text truncate block">
                                {supporter.full_name}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectSupporter(supporter)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Chọn
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label htmlFor="manual-amount-input" className="block text-xs font-semibold text-brand-text">
                Số tiền ủng hộ (VND) <span className="text-brand-burgundy">*</span>
              </label>
              <div className="relative">
                <input
                  id="manual-amount-input"
                  type="number"
                  min="1000"
                  step="1000"
                  value={amountVnd}
                  onChange={(e) => setAmountVnd(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm font-semibold text-brand-text focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy pr-24"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-burgundy">
                  {formatVND(parseInt(amountVnd, 10) || 0)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountVnd(String(amt))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      amountVnd === String(amt)
                        ? 'border-brand-burgundy bg-brand-soft-pink text-brand-burgundy font-bold'
                        : 'border-brand-border/70 bg-stone-50 text-brand-text-secondary hover:bg-stone-100'
                    }`}
                  >
                    {formatVND(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Received At */}
            <div className="space-y-1.5">
              <label htmlFor="manual-received-at" className="block text-xs font-semibold text-brand-text">
                Thời gian nhận tiền <span className="text-brand-burgundy">*</span>
              </label>
              <input
                id="manual-received-at"
                type="datetime-local"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm text-brand-text focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy"
              />
            </div>

            {/* Public Toggle */}
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-brand-text flex items-center gap-1.5">
                  {isPublic ? (
                    <Globe className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-amber-600" />
                  )}
                  <span>Công khai lên Bảng tri ân</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isPublic ? 'bg-emerald-600' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isPublic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                ⚠️ Chỉ bật công khai khi người ủng hộ đã xác nhận đồng ý xuất hiện trên Bảng tri ân.
              </p>
            </div>

            {/* Optional Ref and Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="manual-tx-ref" className="block text-xs font-semibold text-brand-text">
                  Mã giao dịch / Ref (tùy chọn)
                </label>
                <input
                  id="manual-tx-ref"
                  type="text"
                  maxLength={100}
                  placeholder="VD: FT240924987654"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm text-brand-text placeholder:text-brand-text-muted focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="manual-admin-note" className="block text-xs font-semibold text-brand-text">
                  Ghi chú nội bộ (tùy chọn)
                </label>
                <input
                  id="manual-admin-note"
                  type="text"
                  maxLength={255}
                  placeholder="VD: Chuyển qua Vietcombank lúc 14h"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm text-brand-text placeholder:text-brand-text-muted focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={createContributionMutation.isPending || !selectedSupporter}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-burgundy text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-brand-burgundy-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {createContributionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Ghi nhận vào sổ cái</span>
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* VERIFICATION DIALOG MODAL */}
      {/* ============================================================== */}
      {verifyingClaim &&
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
              onClick={() => setVerifyingClaim(null)}
              aria-label="Đóng"
            />

            <div className="relative z-10 max-w-md w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-brand-text">
                      Xác nhận đã nhận tiền ủng hộ
                    </h3>
                    <p className="text-[11px] text-brand-text-muted">
                      Đối soát cho {verifyingClaim.supporter.full_name} (#{verifyingClaim.supporter.user_id})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifyingClaim(null)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {verifyError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{verifyError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmVerify} className="space-y-3.5">
                {/* Amount */}
                <div className="space-y-1">
                  <label htmlFor="verify-amount-input" className="block text-xs font-semibold text-brand-text">
                    Số tiền thực nhận (VND) <span className="text-brand-burgundy">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="verify-amount-input"
                      type="number"
                      min="1000"
                      step="1000"
                      value={verifiedAmount}
                      onChange={(e) => setVerifiedAmount(e.target.value)}
                      className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm font-semibold text-brand-text focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy pr-24"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-burgundy">
                      {formatVND(parseInt(verifiedAmount, 10) || 0)}
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-text-muted">
                    Khai báo: {formatVND(verifyingClaim.claimed_amount_vnd)}
                  </p>
                </div>

                {/* Received At */}
                <div className="space-y-1">
                  <label htmlFor="verify-received-at" className="block text-xs font-semibold text-brand-text">
                    Thời gian nhận tiền <span className="text-brand-burgundy">*</span>
                  </label>
                  <input
                    id="verify-received-at"
                    type="datetime-local"
                    value={verifiedReceivedAt}
                    onChange={(e) => setVerifiedReceivedAt(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm text-brand-text focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy"
                    required
                  />
                </div>



                {/* Info about is_public */}
                <div className="p-2.5 rounded-xl bg-stone-100 text-xs text-brand-text-secondary flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-brand-text-secondary" />
                  <span>
                    Quyền riêng tư Bảng tri ân: <strong>{verifyingClaim.wants_public ? 'Công khai' : 'Riêng tư'}</strong> (tuân thủ lựa chọn của người ủng hộ).
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setVerifyingClaim(null)}
                    className="px-4 py-2 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={verifyClaimMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {verifyClaimMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>Xác nhận đã nhận tiền</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ============================================================== */}
      {/* REJECTION DIALOG MODAL */}
      {/* ============================================================== */}
      {rejectingClaim &&
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
              onClick={() => setRejectingClaim(null)}
              aria-label="Đóng"
            />

            <div className="relative z-10 max-w-md w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-red-100 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-brand-text">
                      Không tìm thấy giao dịch chuyển tiền
                    </h3>
                    <p className="text-[11px] text-brand-text-muted">
                      Từ chối yêu cầu của {rejectingClaim.supporter.full_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectingClaim(null)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {rejectError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{rejectError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmReject} className="space-y-3.5">
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Bạn có chắc chắn muốn đánh dấu yêu cầu này là không tìm thấy giao dịch? Bản ghi sẽ chuyển sang trạng thái <strong>REJECTED</strong> và không tạo đóng góp trong sổ cái.
                </p>

                <div className="space-y-1">
                  <label htmlFor="rejection-reason" className="block text-xs font-semibold text-brand-text">
                    Lý do từ chối (tùy chọn)
                  </label>
                  <input
                    id="rejection-reason"
                    type="text"
                    maxLength={255}
                    placeholder="VD: Không tìm thấy giao dịch khớp trên sao kê ngân hàng"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-xl border border-brand-border bg-stone-50/50 px-3 py-2 text-xs sm:text-sm text-brand-text placeholder:text-brand-text-muted focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setRejectingClaim(null)}
                    className="px-4 py-2 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={rejectClaimMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {rejectClaimMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5" />
                    )}
                    <span>Xác nhận từ chối</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal for Ledger */}
      {deletingId &&
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
              onClick={() => setDeletingId(null)}
              aria-label="Đóng"
            />

            <div className="relative z-10 max-w-sm w-full bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-sm font-bold text-brand-text">Xóa bản ghi sai sót</h3>
              </div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Bạn có chắc chắn muốn xóa bản ghi đóng góp này khỏi sổ cái? Hành động này sẽ loại bỏ khoản đóng góp và cập nhật lại Bảng tri ân.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-text hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
                >
                  {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa bản ghi'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
