import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCurrentUser,
  useUpdateProfile,
  useMyBankAccount,
  useSupportedBanks,
  useUpdateMyBankAccount,
  useDeleteMyBankAccount,
} from '@/features/users/hooks';
import {
  userUpdateSchema,
  bankAccountSchema,
  type UserUpdateForm,
  type BankAccountFormValues,
} from '@/features/users/schemas';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
  Link2,
  Facebook,
  Github,
  Linkedin,
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
} from 'lucide-react';

type SocialLinkType = 'facebook' | 'github' | 'linkedin' | 'website';

interface SocialLink {
  id: string;
  type: SocialLinkType;
  label: string;
  url: string;
}

const SOCIAL_OPTIONS: Array<{
  type: SocialLinkType;
  label: string;
}> = [
  { type: 'facebook', label: 'Facebook' },
  { type: 'github', label: 'GitHub' },
  { type: 'linkedin', label: 'LinkedIn' },
  { type: 'website', label: 'Website' },
];

function SocialIcon({
  type,
  className = 'h-4 w-4',
}: {
  type: SocialLinkType;
  className?: string;
}) {
  switch (type) {
    case 'facebook':
      return <Facebook className={className} />;
    case 'github':
      return <Github className={className} />;
    case 'linkedin':
      return <Linkedin className={className} />;
    default:
      return <Globe2 className={className} />;
  }
}

export function ProfilePage() {
  const { signOut } = useAuth();
  const { data: user, isLoading, isError } = useCurrentUser();
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

  // UI foundation cho social links (chưa có API backend)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialType, setSocialType] = useState<SocialLinkType>('facebook');
  const [socialUrl, setSocialUrl] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserUpdateForm>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      bio: '',
      default_meetup_area: '',
    },
  });

  // Bank Form
  const {
    register: registerBank,
    handleSubmit: handleSubmitBank,
    reset: resetBank,
    formState: { errors: bankErrors, isSubmitting: isBankSubmitting },
  } = useForm<BankAccountFormValues>({
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
      bio: user.bio || '',
      default_meetup_area: user.default_meetup_area || '',
    });
  }, [user, reset]);

  const handleOpenBankModal = () => {
    if (bankAccount) {
      resetBank({
        bank_bin: bankAccount.bank_bin,
        account_number: bankAccount.account_number,
        account_name: bankAccount.account_name,
      });
    } else {
      resetBank({
        bank_bin: supportedBanks[0]?.bin || '',
        account_number: '',
        account_name: user?.full_name?.toUpperCase() || '',
      });
    }
    setIsBankModalOpen(true);
  };

  const handleSaveBankAccount = async (values: BankAccountFormValues) => {
    try {
      await updateBankMutation.mutateAsync({
        bank_bin: values.bank_bin.trim(),
        account_number: values.account_number.trim(),
        account_name: values.account_name.trim().toUpperCase(),
      });
      setIsBankModalOpen(false);
      setBankSuccessMessage('Đã lưu thông tin tài khoản nhận tiền thành công.');
      setTimeout(() => setBankSuccessMessage(null), 4000);
    } catch (err: unknown) {
      // Error handled by react-query / form
    }
  };

  const handleDeleteBankAccount = async () => {
    try {
      await deleteBankMutation.mutateAsync();
      setIsDeleteConfirmOpen(false);
      setBankSuccessMessage('Đã xóa tài khoản nhận tiền.');
      setTimeout(() => setBankSuccessMessage(null), 4000);
    } catch (err: unknown) {
      // Error handled by react-query
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const onSubmit = async (values: UserUpdateForm) => {
    setSuccessMessage(null);
    try {
      await updateProfileMutation.mutateAsync(values);
      setSuccessMessage('Cập nhật hồ sơ thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ:', error);
    }
  };

  const handleAddSocialLink = () => {
    const trimmed = socialUrl.trim();
    if (!trimmed) return;

    const matchedOption = SOCIAL_OPTIONS.find((item) => item.type === socialType);
    const label = matchedOption ? matchedOption.label : 'Website';

    const newLink: SocialLink = {
      id: `${socialType}-${Date.now()}`,
      type: socialType,
      label,
      url: trimmed,
    };

    setSocialLinks((prev) => [...prev, newLink]);
    setSocialUrl('');
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((item) => item.id !== id));
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
      {/* 1. Card tổng quan hồ sơ sinh viên */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="h-24 w-24 rounded-full border-2 border-brand-burgundy/20 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-burgundy/20 bg-brand-soft-pink text-brand-burgundy shadow-sm">
                <User className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-xl font-bold text-brand-text sm:text-2xl">
                {user.full_name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <Shield className="h-3.5 w-3.5" />
                {user.role === 'ADMIN' ? 'Quản trị viên' : 'Sinh viên PTIT'}
              </span>
            </div>

            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-brand-text-muted sm:justify-start">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>

            <p className="mt-2 text-xs text-brand-text-muted">
              Đồng bộ từ tài khoản Google sinh viên. Ảnh đại diện và email được quản lý qua tài khoản Google.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Card Tài khoản nhận tiền (VietQR) */}
      <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-brand-border pb-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft-pink text-brand-burgundy">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-brand-text">Tài khoản nhận tiền</h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  <QrCode className="h-3 w-3" />
                  VietQR
                </span>
              </div>
              <p className="text-xs text-brand-text-muted">
                Tài khoản ngân hàng dùng để tạo mã VietQR tự động khi người mua chọn thanh toán chuyển khoản.
              </p>
            </div>
          </div>

          {bankAccount && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenBankModal}
                className="flex items-center gap-1.5 rounded-xl border border-brand-border bg-white px-3.5 py-2 text-xs font-semibold text-brand-text hover:border-brand-burgundy hover:text-brand-burgundy"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            </div>
          )}
        </div>

        {bankSuccessMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {bankSuccessMessage}
          </div>
        )}

        <div className="mt-5">
          {isBankLoading ? (
            <div className="flex items-center justify-center py-6 text-xs text-brand-text-muted">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-brand-burgundy border-t-transparent" />
              Đang kiểm tra tài khoản ngân hàng...
            </div>
          ) : bankAccount ? (
            <div className="rounded-2xl border border-brand-border/80 bg-gradient-to-br from-stone-50 to-amber-50/30 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-[11px] font-medium text-brand-text-muted">Ngân hàng</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-brand-burgundy/10 px-2 py-0.5 font-mono text-xs font-bold text-brand-burgundy">
                      {bankAccount.bank_short_name || bankAccount.bank_code}
                    </span>
                    <span className="text-sm font-semibold text-brand-text">
                      {bankAccount.bank_name || bankAccount.bank_code}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-brand-text-muted">
                    Mã BIN: {bankAccount.bank_bin}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-brand-text-muted">Tên chủ tài khoản</span>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold uppercase tracking-wide text-brand-text">
                      {bankAccount.account_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAccount.account_name, 'name')}
                      className="rounded-lg p-1 text-brand-text-muted hover:bg-black/5"
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

                <div className="sm:col-span-2 sm:border-t sm:border-brand-border/40 sm:pt-3">
                  <span className="text-[11px] font-medium text-brand-text-muted">Số tài khoản thụ hưởng</span>
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-brand-border bg-white px-4 py-2.5 shadow-xs">
                    <span className="font-mono text-base font-bold tracking-wider text-brand-text">
                      {bankAccount.account_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAccount.account_number, 'stk')}
                      className="flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-brand-text hover:bg-stone-200"
                    >
                      {copiedField === 'stk' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/70 p-3 text-[11px] leading-relaxed text-brand-text-muted">
                <Info className="h-4 w-4 shrink-0 text-brand-burgundy" />
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
              Họ và tên
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('full_name')}
                placeholder="Nhập họ và tên"
                className="input-focus-brand w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-burgundy"
              />
              <User className="absolute right-3.5 top-3.5 h-4 w-4 text-brand-text-muted" />
            </div>
            {errors.full_name && (
              <p className="mt-1.5 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
              Số điện thoại
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('phone')}
                placeholder="VD: 0912345678"
                className="input-focus-brand w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-burgundy"
              />
              <Phone className="absolute right-3.5 top-3.5 h-4 w-4 text-brand-text-muted" />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
              Khu vực hẹn gặp mặc định
            </label>
            <div className="relative">
              <input
                type="text"
                {...register('default_meetup_area')}
                placeholder="VD: Canteen A2, Sân bóng PTIT, KTX..."
                className="input-focus-brand w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-burgundy"
              />
              <MapPin className="absolute right-3.5 top-3.5 h-4 w-4 text-brand-text-muted" />
            </div>
            {errors.default_meetup_area && (
              <p className="mt-1.5 text-xs text-red-500">{errors.default_meetup_area.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
              Tiểu sử / Giới thiệu bản thân
            </label>
            <div className="relative">
              <textarea
                rows={3}
                {...register('bio')}
                placeholder="Giới thiệu đôi nét về bản thân..."
                className="input-focus-brand w-full rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-text outline-none focus:border-brand-burgundy"
              />
              <FileText className="absolute right-3.5 top-3.5 h-4 w-4 text-brand-text-muted" />
            </div>
            {errors.bio && (
              <p className="mt-1.5 text-xs text-red-500">{errors.bio.message}</p>
            )}
          </div>

          {/* Social Links UI */}
          <div className="rounded-2xl border border-brand-border/70 bg-stone-50/50 p-4 sm:p-5">
            <div className="mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                Liên kết mạng xã hội
              </h3>
              <p className="mt-0.5 text-[11px] text-brand-text-muted">
                Thêm liên kết để bạn bè và người mua dễ dàng kết nối.
              </p>
            </div>

            {socialLinks.length > 0 && (
              <div className="mb-3 space-y-2">
                {socialLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <SocialIcon type={link.type} className="h-4 w-4 text-brand-burgundy" />
                      <div className="truncate font-semibold text-brand-text">{link.label}:</div>
                      <div className="truncate text-brand-text-muted">{link.url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialLink(link.id)}
                      className="rounded p-1 text-brand-text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
              <select
                value={socialType}
                onChange={(e) => setSocialType(e.target.value as SocialLinkType)}
                className="rounded-xl border border-brand-border bg-white px-2.5 py-2 text-xs text-brand-text outline-none focus:border-brand-burgundy"
              >
                {SOCIAL_OPTIONS.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                type="url"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-xl border border-brand-border bg-white px-3 py-2 text-xs text-brand-text outline-none focus:border-brand-burgundy"
              />
            </div>

            <button
              type="button"
              onClick={handleAddSocialLink}
              disabled={!socialUrl.trim()}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-burgundy/25 px-3 py-2 text-xs font-semibold text-brand-burgundy transition-colors hover:bg-brand-soft-pink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Link2 className="h-3.5 w-3.5" />
              Thêm liên kết
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending || !isDirty}
              className="btn-interactive flex w-full items-center justify-center gap-2 rounded-xl bg-brand-burgundy px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-burgundy-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi hồ sơ
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-brand-border pt-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-interactive flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
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
                  {...registerBank('account_number')}
                  placeholder="Nhập số tài khoản ngân hàng"
                  className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 font-mono text-sm text-brand-text outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
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
                  className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 font-mono text-sm uppercase text-brand-text outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
                />
                {bankErrors.account_name && (
                  <p className="mt-1 text-[11px] text-red-500">{bankErrors.account_name.message}</p>
                )}
              </div>

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
                  disabled={isBankSubmitting || updateBankMutation.isPending}
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