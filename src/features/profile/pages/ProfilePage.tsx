import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCurrentUser,
  usePublicUserProfile,
  useUpdateProfile,
  useMyBankAccount,
  useSupportedBanks,
  useUpdateMyBankAccount,
  useDeleteMyBankAccount,
} from '@/features/users/hooks';
import {
  userUpdateSchema,
  bankAccountSchema,
  normalizeVietnamPhone,
  type UserUpdateForm,
  type BankAccountFormValues,
} from '@/features/users/schemas';
import type { SocialPlatform } from '@/features/users/types';
import { SOCIAL_OPTIONS, formatSocialDisplay } from '@/features/users/socialUtils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Avatar } from '@/components/common/Avatar';
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Facebook,
  Instagram,
  Linkedin,
  Share2,
  MessageCircle,
  Globe2,
  X,
  Landmark,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  QrCode,
  Info,
  Eye,
  Star,
  Package,
  Calendar,
} from 'lucide-react';

interface LocalSocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

function SocialIcon({
  platform,
  className = 'h-4 w-4',
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case 'FACEBOOK':
      return <Facebook className={className} />;
    case 'INSTAGRAM':
      return <Instagram className={className} />;
    case 'LINKEDIN':
      return <Linkedin className={className} />;
    case 'TIKTOK':
      return <Share2 className={className} />;
    case 'ZALO':
      return <MessageCircle className={className} />;
    default:
      return <Globe2 className={className} />;
  }
}

function formatMemberSince(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `Thành viên từ ${month}/${d.getFullYear()}`;
  } catch {
    return '';
  }
}

export function ProfilePage() {
  const { signOut } = useAuth();
  const { data: user, isLoading, isError } = useCurrentUser();
  const { data: publicProfile, isLoading: isPublicProfileLoading } = usePublicUserProfile(user?.user_id || 0);
  const updateProfileMutation = useUpdateProfile();
  const navigate = useNavigate();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bankSuccessMessage, setBankSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bank account hooks
  const { data: bankAccount, isLoading: isBankLoading } = useMyBankAccount();
  const { data: supportedBanks = [] } = useSupportedBanks();
  const updateBankMutation = useUpdateMyBankAccount();
  const deleteBankMutation = useDeleteMyBankAccount();

  // Bank Modal states
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Social Links state
  const [socialLinks, setSocialLinks] = useState<LocalSocialLink[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('FACEBOOK');
  const [socialUrlInput, setSocialUrlInput] = useState('');
  const [socialInputError, setSocialInputError] = useState<string | null>(null);
  const [socialDirty, setSocialDirty] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserUpdateForm>({
    mode: 'onBlur',
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      show_phone_publicly: false,
      bio: '',
      delivery_area: '',
    },
  });

  // Bank Form
  const [bankSubmitError, setBankSubmitError] = useState<string | null>(null);

  const {
    register: registerBank,
    handleSubmit: handleSubmitBank,
    reset: resetBank,
    formState: { errors: bankErrors, isSubmitting: isBankSubmitting },
  } = useForm<BankAccountFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_bin: '',
      account_number: '',
      account_name: '',
    },
  });

  useEffect(() => {
    if (!user) return;

    reset({
      full_name: user.full_name || '',
      phone: user.phone || '',
      show_phone_publicly: user.show_phone_publicly ?? false,
      bio: user.bio || '',
      delivery_area: user.delivery_area || '',
    });

    if (user.social_links && user.social_links.length > 0) {
      setSocialLinks(
        user.social_links.map((link, index) => ({
          id: `${link.platform}-${index}-${Date.now()}`,
          platform: link.platform,
          url: link.url,
        })),
      );
    } else {
      setSocialLinks([]);
    }
  }, [user, reset]);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenBankModal = () => {
    setBankSubmitError(null);
    if (bankAccount) {
      resetBank({
        bank_bin: bankAccount.bank_bin,
        account_number: bankAccount.account_number,
        account_name: bankAccount.account_name,
      });
    } else {
      resetBank({
        bank_bin: '',
        account_number: '',
        account_name: '',
      });
    }
    setIsBankModalOpen(true);
  };

  const handleSaveBankAccount = async (data: BankAccountFormValues) => {
    setBankSubmitError(null);
    try {
      await updateBankMutation.mutateAsync(data);
      setIsBankModalOpen(false);
      setBankSuccessMessage('Cập nhật tài khoản nhận tiền thành công!');
      setTimeout(() => setBankSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Lỗi lưu tài khoản ngân hàng:', err);
      const detail = err?.response?.data?.detail;
      let msg = 'Không thể lưu tài khoản ngân hàng. Vui lòng kiểm tra lại.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        msg = detail[0].msg;
      }
      setBankSubmitError(msg);
    }
  };

  const handleDeleteBankAccount = async () => {
    try {
      await deleteBankMutation.mutateAsync();
      setIsDeleteConfirmOpen(false);
      setBankSuccessMessage('Đã xóa thông tin tài khoản nhận tiền.');
      setTimeout(() => setBankSuccessMessage(null), 4000);
    } catch (err: unknown) {
      console.error('Lỗi xóa tài khoản ngân hàng:', err);
    }
  };

  const onSubmit = async (data: UserUpdateForm) => {
    try {
      setSuccessMessage(null);

      const normalizedPhone = data.phone?.trim() ? normalizeVietnamPhone(data.phone) : undefined;

      const payload = {
        ...data,
        phone: normalizedPhone || undefined,
        social_links: socialLinks.map((item) => ({
          platform: item.platform,
          url: item.url,
        })),
      };

      await updateProfileMutation.mutateAsync(payload);
      setSuccessMessage('Cập nhật thông tin thành công!');
      setSocialDirty(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ:', error);
    }
  };

  const handleAddSocialLink = () => {
    if (!socialUrlInput.trim()) return;

    if (socialLinks.some((l) => l.platform === selectedPlatform)) {
      setSocialInputError(`Bạn đã thêm liên kết ${selectedPlatform} rồi.`);
      return;
    }

    setSocialLinks((prev) => [
      ...prev,
      {
        id: `${selectedPlatform}-${Date.now()}`,
        platform: selectedPlatform,
        url: socialUrlInput.trim(),
      },
    ]);

    setSocialUrlInput('');
    setSocialDirty(true);
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((item) => item.id !== id));
    setSocialDirty(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-burgundy border-t-transparent" />
          <p className="text-sm text-brand-text-muted">Đang tải hồ sơ sinh viên...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 sm:py-8">
      {/* 1. Card tổng quan hồ sơ sinh viên & Marketplace Hub */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-border bg-white p-5 sm:p-7 shadow-xs text-center">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar
              src={user.avatar_url}
              name={user.full_name}
              size="xl"
              className="border-2 border-brand-burgundy/20 shadow-xs"
            />
          </div>
        </div>

        {/* Identity Details */}
        <div className="mt-3.5 space-y-1.5 min-w-0 max-w-full">
          {/* Row 1: Full Name on its own row */}
          <h1 className="text-lg sm:text-xl font-bold text-brand-text min-w-0 max-w-full break-words [overflow-wrap:anywhere] leading-snug">
            {user.full_name}
          </h1>

          {/* Row 2: Role / Student Badge on its own row below name */}
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <Shield className="h-3.5 w-3.5" />
              {user.role === 'ADMIN' ? 'Quản trị viên' : 'Sinh viên PTIT'}
            </span>
          </div>

          {/* Row 3: Email */}
          <p className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-brand-text-muted min-w-0 max-w-full break-all">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span>{user.email}</span>
          </p>

          {/* Row 4: Member since date */}
          {user.created_at && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-brand-text-muted">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-brand-text-muted" />
              <span>{formatMemberSince(user.created_at)}</span>
            </p>
          )}
        </div>

        {/* 3 Metrics: Reputation, Active Listings, Sold Count */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-brand-border/60 rounded-xl border border-brand-border/60 bg-stone-50/70 py-3 text-center">
          {/* Reputation */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1 font-bold text-sm sm:text-base text-brand-text">
              {isPublicProfileLoading ? (
                <div className="h-4 w-10 bg-stone-200 animate-pulse rounded" />
              ) : publicProfile?.review_count ? (
                <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                  <span>{(publicProfile.rating_average ?? 5).toFixed(1)}</span>
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 text-stone-300 shrink-0" />
                  <span>—</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-brand-text-secondary truncate">
              {isPublicProfileLoading ? (
                <span className="inline-block h-3 w-14 bg-stone-200 animate-pulse rounded" />
              ) : publicProfile?.review_count ? (
                `${publicProfile.review_count} đánh giá`
              ) : (
                'Chưa có đánh giá'
              )}
            </p>
          </div>

          {/* Active Listings */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1 font-bold text-sm sm:text-base text-brand-text">
              {isPublicProfileLoading ? (
                <div className="h-4 w-8 bg-stone-200 animate-pulse rounded" />
              ) : (
                <>
                  <Package className="h-4 w-4 text-brand-burgundy shrink-0" />
                  <span>{publicProfile?.active_listing_count ?? 0}</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-brand-text-secondary truncate">
              Đang bán
            </p>
          </div>

          {/* Sold Count */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1 font-bold text-sm sm:text-base text-brand-text">
              {isPublicProfileLoading ? (
                <div className="h-4 w-8 bg-stone-200 animate-pulse rounded" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{publicProfile?.completed_sold_count ?? 0}</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-brand-text-secondary truncate">
              Đã bán
            </p>
          </div>
        </div>

        {/* Action: Single prominent "Xem hồ sơ công khai" CTA */}
        <div className="mt-5">
          <Link
            to={`/users/${user.user_id}`}
            state={{
              fromApp: true,
              returnTo: '/profile',
              returnLabel: 'profile',
            }}
            className="btn-interactive flex w-full items-center justify-center gap-2 rounded-xl bg-brand-burgundy px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-brand-burgundy-dark no-underline"
          >
            <Eye className="h-4 w-4" />
            <span>Xem hồ sơ công khai</span>
          </Link>
        </div>

        <p className="mt-2.5 text-center text-[11px] text-brand-text-muted">
          Tên và ảnh đại diện được đồng bộ từ tài khoản Google.
        </p>
      </section>

      {/* 2. Card Tài khoản nhận tiền (VietQR) */}
      <section className="rounded-2xl border border-brand-border bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-3 pb-4 border-b border-brand-border/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft-pink text-brand-burgundy">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-brand-text">Tài khoản nhận tiền</h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200 flex-none">
                  <QrCode className="h-3 w-3" />
                  VietQR
                </span>
              </div>
              <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
                Tài khoản ngân hàng dùng để tạo mã VietQR tự động khi người mua chọn thanh toán chuyển khoản.
              </p>
            </div>
          </div>

          {bankAccount && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenBankModal}
                className="btn-interactive inline-flex items-center gap-1.5 rounded-xl border border-brand-border bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-text hover:border-brand-burgundy hover:text-brand-burgundy transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="btn-interactive inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa</span>
              </button>
            </div>
          )}
        </div>

        {bankSuccessMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{bankSuccessMessage}</span>
          </div>
        )}

        <div className="mt-4">
          {isBankLoading ? (
            <div className="flex items-center justify-center py-6 text-xs text-brand-text-muted">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-brand-burgundy border-t-transparent" />
              Đang kiểm tra tài khoản ngân hàng...
            </div>
          ) : bankAccount ? (
            <div className="rounded-2xl border border-brand-border/80 bg-stone-50/50 p-4 sm:p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Ngân hàng */}
                <div className="min-w-0">
                  <span className="text-xs font-medium text-brand-text-muted block mb-1">Ngân hàng</span>
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="rounded-md bg-brand-burgundy/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-brand-burgundy flex-none">
                      {bankAccount.bank_short_name || bankAccount.bank_code}
                    </span>
                    <span className="text-sm font-semibold text-brand-text min-w-0 break-words flex-1">
                      {bankAccount.bank_name || bankAccount.bank_code}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-brand-text-muted tabular-nums">
                    Mã BIN: {bankAccount.bank_bin}
                  </div>
                </div>

                {/* Tên chủ tài khoản */}
                <div className="min-w-0">
                  <span className="text-xs font-medium text-brand-text-muted block mb-1">Tên chủ tài khoản</span>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-sm font-semibold uppercase text-brand-text break-words min-w-0 flex-1">
                      {bankAccount.account_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAccount.account_name, 'name')}
                      className="rounded-lg p-1.5 text-brand-text-muted hover:bg-stone-200/60 hover:text-brand-text transition-colors flex-none"
                      title="Sao chép tên chủ tài khoản"
                    >
                      {copiedField === 'name' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Số tài khoản thụ hưởng */}
                <div className="sm:col-span-2 pt-2 border-t border-brand-border/50">
                  <span className="text-xs font-medium text-brand-text-muted block mb-1.5">Số tài khoản thụ hưởng</span>
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 rounded-xl border border-brand-border bg-white px-3.5 py-2.5 shadow-2xs">
                    <span className="font-bold tabular-nums text-base sm:text-lg text-brand-text whitespace-nowrap min-w-0 flex-1 select-all">
                      {bankAccount.account_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAccount.account_number, 'stk')}
                      className="btn-interactive inline-flex items-center gap-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 px-3 py-1.5 text-xs font-semibold text-brand-text transition-colors flex-none"
                    >
                      {copiedField === 'stk' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 whitespace-nowrap">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="whitespace-nowrap">Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informational note */}
              <div className="flex items-start gap-2 pt-2 border-t border-brand-border/40 text-xs leading-relaxed text-brand-text-muted">
                <Info className="h-4 w-4 shrink-0 text-brand-burgundy mt-0.5" />
                <span>
                  Thông tin này được dùng để tạo mã VietQR cho người mua khi bạn xác nhận đơn chuyển khoản. Thay đổi tại đây sẽ áp dụng cho các đơn hàng xác nhận sau này.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border bg-stone-50/60 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                <Landmark className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-brand-text">Chưa thiết lập tài khoản nhận tiền</h3>
              <p className="mt-1 max-w-md text-xs text-brand-text-muted">
                Khi bán hàng có thanh toán chuyển khoản, bạn cần có tài khoản ngân hàng để hệ thống tự động tạo mã VietQR cho người mua quét thanh toán.
              </p>
              <button
                type="button"
                onClick={handleOpenBankModal}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-brand-burgundy px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-burgundy-dark"
              >
                <Plus className="h-4 w-4" />
                Thêm tài khoản nhận tiền
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 3. Form chỉnh sửa thông tin cá nhân */}
      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-6 border-b border-brand-border pb-4 text-lg font-bold text-brand-text">
          Chỉnh sửa thông tin cá nhân
        </h2>

        {successMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs sm:text-[13px] font-semibold text-brand-text">
              Họ và tên
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('full_name')}
                placeholder="Nhập họ và tên"
                className="input-focus-brand w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-burgundy"
              />
              <User className="absolute right-3.5 top-3 h-4 w-4 text-brand-text-muted" />
            </div>
            {errors.full_name && (
              <p className="mt-1.5 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs sm:text-[13px] font-semibold text-brand-text">
              Số điện thoại
            </label>
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                {...register('phone')}
                placeholder="VD: 0912345678"
                className="input-focus-brand w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm tabular-nums text-brand-text outline-none focus:border-brand-burgundy"
              />
              <Phone className="absolute right-3.5 top-3 h-4 w-4 text-brand-text-muted" />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>
            )}

            <label className="mt-2.5 flex items-center gap-2 text-xs text-brand-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('show_phone_publicly')}
                className="h-4 w-4 rounded border-brand-border text-brand-burgundy focus:ring-brand-burgundy"
              />
              <span>Hiển thị số điện thoại trên hồ sơ công khai</span>
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-xs sm:text-[13px] font-semibold text-brand-text">
              Phạm vi giao / nhận hàng
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('delivery_area')}
                placeholder="VD: Hà Đông, Thanh Xuân, Cầu Giấy..."
                className="input-focus-brand w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-burgundy"
              />
              <MapPin className="absolute right-3.5 top-3 h-4 w-4 text-brand-text-muted" />
            </div>
            <p className="mt-1 text-xs text-brand-text-muted">
              Cho người khác biết khu vực bạn có thể giao dịch hoặc giao/nhận hàng.
            </p>
            {errors.delivery_area && (
              <p className="mt-1.5 text-xs text-red-500">{errors.delivery_area.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs sm:text-[13px] font-semibold text-brand-text">
              Tiểu sử / giới thiệu bản thân
            </label>
            <div className="relative">
              <textarea
                rows={3}
                {...register('bio')}
                placeholder="Giới thiệu đôi nét về bản thân..."
                className="input-focus-brand w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-text outline-none focus:border-brand-burgundy"
              />
              <FileText className="absolute right-3.5 top-3 h-4 w-4 text-brand-text-muted" />
            </div>
            {errors.bio && (
              <p className="mt-1.5 text-xs text-red-500">{errors.bio.message}</p>
            )}
          </div>

          {/* Social Links UI */}
          <div className="rounded-2xl border border-brand-border/70 bg-stone-50/50 p-4 sm:p-5">
            <div className="mb-3">
              <h3 className="text-xs sm:text-[13px] font-semibold text-brand-text">
                Liên kết mạng xã hội
              </h3>
              <p className="mt-0.5 text-xs text-brand-text-muted">
                Thêm liên kết để bạn bè và người mua dễ dàng kết nối.
              </p>
            </div>

            {socialLinks.length > 0 && (
              <div className="mb-3 space-y-2">
                {socialLinks.map((link) => {
                  const opt = SOCIAL_OPTIONS.find((o) => o.platform === link.platform);
                  const displayUrl = formatSocialDisplay(link.url);
                  return (
                    <div
                      key={link.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-white p-2.5 sm:p-3 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2.5 flex-1">
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-brand-soft-pink text-brand-burgundy shrink-0">
                          <SocialIcon platform={link.platform} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-brand-text truncate">
                            {opt?.label || link.platform}
                          </p>
                          <p className="text-xs text-brand-text-muted truncate">
                            {displayUrl}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialLink(link.id)}
                        className="rounded-lg p-1.5 text-brand-text-muted hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                        aria-label="Xóa liên kết"
                        title="Xóa liên kết"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="w-full sm:w-44 shrink-0">
                  <select
                    value={selectedPlatform}
                    onChange={(e) => {
                      setSelectedPlatform(e.target.value as SocialPlatform);
                      setSocialInputError(null);
                    }}
                    className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-text outline-none focus:border-brand-burgundy"
                  >
                    {SOCIAL_OPTIONS.map((item) => (
                      <option key={item.platform} value={item.platform}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={socialUrlInput}
                    onChange={(e) => {
                      setSocialUrlInput(e.target.value);
                      setSocialInputError(null);
                    }}
                    placeholder={
                      SOCIAL_OPTIONS.find((o) => o.platform === selectedPlatform)?.placeholder ||
                      'https://...'
                    }
                    className={`w-full rounded-xl border ${socialInputError ? 'border-red-500' : 'border-brand-border'
                      } bg-white px-3 py-2 text-xs text-brand-text outline-none focus:border-brand-burgundy`}
                  />
                </div>
              </div>

              {socialInputError && (
                <p className="text-xs text-red-500 font-medium">{socialInputError}</p>
              )}

              <button
                type="button"
                onClick={handleAddSocialLink}
                disabled={!socialUrlInput.trim()}
                className="btn-interactive flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-white px-3 py-2 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-soft-pink/40 hover:text-brand-burgundy hover:border-brand-burgundy/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm liên kết</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending || (!isDirty && !socialDirty)}
              className="btn-interactive flex w-full items-center justify-center gap-2 rounded-xl bg-brand-burgundy px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-brand-burgundy-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Lưu thay đổi hồ sơ</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-brand-border/60 pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-interactive flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </section>

      {/* MODAL: Thêm / Sửa Tài khoản nhận tiền */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-brand-burgundy" />
                <h3 className="text-base font-bold text-brand-text">
                  {bankAccount ? 'Chỉnh sửa tài khoản nhận tiền' : 'Thêm tài khoản nhận tiền'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="rounded-lg p-1 text-brand-text-muted hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBank(handleSaveBankAccount)} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-text">
                  Ngân hàng thụ hưởng <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerBank('bank_bin')}
                  className="w-full rounded-xl border border-brand-border bg-white px-3 py-2.5 text-xs text-brand-text outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {supportedBanks.map((b) => (
                    <option key={b.bin} value={b.bin}>
                      {b.short_name} ({b.code}) - {b.name}
                    </option>
                  ))}
                </select>
                {bankErrors.bank_bin && (
                  <p className="mt-1 text-[11px] text-red-500">{bankErrors.bank_bin.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-text">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  {...registerBank('account_number')}
                  placeholder="Nhập số tài khoản ngân hàng (chỉ chữ số)"
                  className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm tabular-nums text-brand-text outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
                />
                {bankErrors.account_number && (
                  <p className="mt-1 text-[11px] text-red-500">{bankErrors.account_number.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-brand-text">
                  Tên chủ tài khoản (In hoa không dấu) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...registerBank('account_name')}
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm uppercase text-brand-text outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
                />
                {bankErrors.account_name && (
                  <p className="mt-1 text-[11px] text-red-500">{bankErrors.account_name.message}</p>
                )}
              </div>

              {bankSubmitError && (
                <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                  {bankSubmitError}
                </div>
              )}

              <div className="rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
                <span className="font-semibold">Lưu ý:</span> Vui lòng nhập chính xác số tài khoản và tên chủ tài khoản thụ hưởng. Hệ thống sẽ tạo mã QR chuẩn VietQR (NAPAS) dựa trên các thông tin này.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 rounded-xl border border-brand-border py-2.5 text-xs font-semibold text-brand-text hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isBankSubmitting || updateBankMutation.isPending || Object.keys(bankErrors).length > 0}
                  className="flex-1 rounded-xl bg-brand-burgundy py-2.5 text-xs font-semibold text-white hover:bg-brand-burgundy-dark disabled:opacity-50"
                >
                  {updateBankMutation.isPending ? 'Đang lưu...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Xác nhận xóa tài khoản nhận tiền */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-brand-border bg-white p-6 shadow-xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-brand-text">Xóa tài khoản nhận tiền?</h3>
            <p className="mt-2 text-xs text-brand-text-muted leading-relaxed">
              Bạn có chắc chắn muốn xóa thông tin tài khoản này? Việc xóa sẽ không làm ảnh hưởng đến các đơn hàng đã xác nhận trước đó.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 rounded-xl border border-brand-border py-2.5 text-xs font-semibold text-brand-text hover:bg-stone-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteBankAccount}
                disabled={deleteBankMutation.isPending}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteBankMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}