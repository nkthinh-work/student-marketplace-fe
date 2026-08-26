import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCurrentUser, useUpdateProfile } from '@/features/users/hooks';
import { userUpdateSchema, type UserUpdateForm } from '@/features/users/schemas';
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
  Camera,
  LogOut,
  Link2,
  Facebook,
  Github,
  Linkedin,
  Globe2,
  X,
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
  const { firebaseUser, signOut } = useAuth();
  const { data: user, isLoading, isError } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const navigate = useNavigate();

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // UI foundation cho social links (chưa có API backend)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialType, setSocialType] =
    useState<SocialLinkType>('facebook');
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
      avatar_url: '',
      bio: '',
      default_meetup_area: '',
    },
  });

  useEffect(() => {
    if (!user) return;

    reset({
      full_name: user.full_name || '',
      phone: user.phone || '',
      avatar_url: user.avatar_url || '',
      bio: user.bio || '',
      default_meetup_area: user.default_meetup_area || '',
    });
  }, [user, reset]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const onSubmit = (formData: UserUpdateForm) => {
    setSuccessMessage(null);

    updateProfileMutation.mutate(
      {
        full_name: formData.full_name?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        avatar_url: formData.avatar_url?.trim() || undefined,
        bio: formData.bio?.trim() || undefined,
        default_meetup_area:
          formData.default_meetup_area?.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSuccessMessage('Cập nhật hồ sơ thành công!');

          window.setTimeout(() => {
            setSuccessMessage(null);
          }, 4000);
        },
      },
    );
  };

  const handleAvatarSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
      event.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert('Ảnh đại diện không được vượt quá 5 MB.');
      event.target.value = '';
      return;
    }

    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // TODO: Upload ảnh đại diện lên Cloudinary khi backend hỗ trợ
  };

  const handleAddSocialLink = () => {
    const normalizedUrl = socialUrl.trim();

    if (!normalizedUrl) return;

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      alert('Link mạng xã hội không hợp lệ.');
      return;
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      alert('Link phải bắt đầu bằng http:// hoặc https://');
      return;
    }

    const option = SOCIAL_OPTIONS.find(
      (item) => item.type === socialType,
    );

    setSocialLinks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: socialType,
        label: option?.label ?? 'Liên kết',
        url: parsedUrl.toString(),
      },
    ]);

    setSocialUrl('');
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-border border-t-brand-burgundy" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-12 w-12 text-brand-price" />

        <h2 className="text-lg font-bold text-brand-text">
          Không thể tải thông tin hồ sơ
        </h2>

        <p className="mt-1 text-sm text-brand-text-secondary">
          Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  const effectiveAvatar =
    avatarPreview ||
    user.avatar_url ||
    firebaseUser?.photoURL ||
    '';

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-3 py-5 sm:px-4 sm:py-8">
      <section className="overflow-hidden rounded-2xl border border-brand-border bg-brand-warm-white p-5 shadow-card card-interactive sm:p-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            {effectiveAvatar ? (
              <img
                src={effectiveAvatar}
                alt={user.full_name || 'Ảnh đại diện'}
                className="h-20 w-20 rounded-full border-2 border-brand-burgundy/20 object-cover shadow-sm sm:h-24 sm:w-24"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft-pink text-brand-burgundy sm:h-24 sm:w-24">
                <User className="h-10 w-10" />
              </div>
            )}

            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white ring-2 ring-white">
              ✓
            </span>
          </div>

          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="btn-interactive mt-3 flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-burgundy transition-colors hover:bg-brand-soft-pink"
          >
            <Camera className="h-3.5 w-3.5" />
            Đổi ảnh đại diện
          </button>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarSelect}
          />

          <div className="mt-4 w-full min-w-0 text-center">
            <div className="flex min-w-0 flex-wrap items-start justify-center gap-2">
              <h1
                title={user.full_name}
                className="max-w-full break-words text-center text-[19px] font-bold leading-snug text-brand-text sm:text-xl"
              >
                {user.full_name}
              </h1>

              <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-md bg-brand-soft-pink px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-burgundy">
                <Shield className="h-3 w-3" />
                {user.role}
              </span>
            </div>

            <p className="mt-1.5 flex min-w-0 items-center justify-center gap-1 text-xs text-brand-text-secondary sm:text-sm">
              <Mail className="h-3.5 w-3.5 shrink-0 text-brand-text-muted" />

              <span className="max-w-full break-all">
                {user.email}
              </span>
            </p>

            <p className="mt-1 text-xs text-brand-text-muted">
              Gia nhập từ:{' '}
              {new Date(user.created_at).toLocaleDateString(
                'vi-VN',
              )}
            </p>

            {socialLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    title={link.label}
                    className="icon-btn-interactive flex h-9 w-9 items-center justify-center rounded-full border border-brand-border bg-white text-brand-burgundy transition-colors hover:bg-brand-soft-pink"
                  >
                    <SocialIcon type={link.type} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-border bg-brand-warm-white p-5 shadow-card sm:p-6">
        <h2 className="mb-4 text-base font-bold text-brand-text">
          Chỉnh sửa thông tin cá nhân
        </h2>

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 sm:text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {updateProfileMutation.isError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800 sm:text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại thông tin.
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-brand-text-secondary">
              <User className="h-3.5 w-3.5" />
              Họ và tên *
            </label>

            <input
              type="text"
              {...register('full_name')}
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
              placeholder="Nguyễn Văn A"
            />

            {errors.full_name && (
              <p className="mt-1 text-xs text-brand-price">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-brand-text-secondary">
              <Phone className="h-3.5 w-3.5" />
              Số điện thoại / Zalo
            </label>

            <input
              type="text"
              {...register('phone')}
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
              placeholder="0987654321"
            />

            {errors.phone && (
              <p className="mt-1 text-xs text-brand-price">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-brand-text-secondary">
              <MapPin className="h-3.5 w-3.5" />
              Địa điểm giao dịch thuận tiện
            </label>

            <input
              type="text"
              {...register('default_meetup_area')}
              className="w-full rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
              placeholder="KTX PTIT / Cổng trường Km10 Nguyễn Trãi"
            />

            {errors.default_meetup_area && (
              <p className="mt-1 text-xs text-brand-price">
                {errors.default_meetup_area.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-brand-text-secondary">
              <FileText className="h-3.5 w-3.5" />
              Giới thiệu ngắn
            </label>

            <textarea
              rows={3}
              {...register('bio')}
              className="w-full resize-none rounded-xl border border-brand-border bg-white px-3.5 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
              placeholder="Sinh viên D21 ngành CNTT..."
            />

            {errors.bio && (
              <p className="mt-1 text-xs text-brand-price">
                {errors.bio.message}
              </p>
            )}
          </div>

          <div className="border-t border-brand-border pt-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Link2 className="h-4 w-4 text-brand-burgundy" />

              <h3 className="text-sm font-semibold text-brand-text">
                Liên kết mạng xã hội
              </h3>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-brand-text-muted">
              Ghim các trang cá nhân để người mua dễ liên hệ với bạn.
            </p>

            {socialLinks.length > 0 && (
              <div className="mb-3 space-y-2">
                {socialLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2"
                  >
                    <SocialIcon
                      type={link.type}
                      className="h-4 w-4 shrink-0 text-brand-burgundy"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-brand-text">
                        {link.label}
                      </div>

                      <div
                        title={link.url}
                        className="truncate text-[11px] text-brand-text-muted"
                      >
                        {link.url}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveSocialLink(link.id)
                      }
                      className="icon-btn-interactive flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-text-muted hover:bg-red-50 hover:text-red-600"
                      aria-label={`Xóa ${link.label}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
              <select
                value={socialType}
                onChange={(event) =>
                  setSocialType(
                    event.target.value as SocialLinkType,
                  )
                }
                className="min-w-0 rounded-xl border border-brand-border bg-white px-2.5 py-2.5 text-xs text-brand-text outline-none focus:border-brand-burgundy"
              >
                {SOCIAL_OPTIONS.map((item) => (
                  <option
                    key={item.type}
                    value={item.type}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                type="url"
                value={socialUrl}
                onChange={(event) =>
                  setSocialUrl(event.target.value)
                }
                placeholder="https://..."
                className="min-w-0 rounded-xl border border-brand-border bg-white px-3 py-2.5 text-xs text-brand-text outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy"
              />
            </div>

            <button
              type="button"
              onClick={handleAddSocialLink}
              disabled={!socialUrl.trim()}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-burgundy/25 px-3 py-2.5 text-xs font-semibold text-brand-burgundy transition-colors hover:bg-brand-soft-pink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Link2 className="h-3.5 w-3.5" />
              Thêm liên kết
            </button>

            <p className="mt-2 text-[10px] leading-relaxed text-brand-text-muted">
              Liên kết mạng xã hội hiện mới ở UI. Cần bổ sung field/API backend
              trước khi lưu vĩnh viễn.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={
                updateProfileMutation.isPending || !isDirty
              }
              className="btn-interactive flex w-full items-center justify-center gap-2 rounded-xl bg-brand-burgundy px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-burgundy-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 border-t border-brand-border pt-4">
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
    </div>
  );
}