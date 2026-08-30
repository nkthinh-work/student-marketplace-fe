import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicUserProfile, useCurrentUser, useUserSoldProducts } from '@/features/users/hooks';
import { useProducts } from '@/features/products/hooks';
import { ProductCard } from '@/features/products/components/ProductCard';
import { formatSocialDisplay } from '@/features/users/socialUtils';
import type { SocialPlatform } from '@/features/users/types';
import {
  User,
  Shield,
  Calendar,
  MapPin,
  FileText,
  Edit2,
  AlertCircle,
  Phone,
  Package,
  ShoppingBag,
  Facebook,
  Instagram,
  Linkedin,
  Share2,
  MessageCircle,
  Globe2,
  ExternalLink,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
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

function getPlatformLabel(platform: SocialPlatform): string {
  switch (platform) {
    case 'FACEBOOK':
      return 'Facebook';
    case 'INSTAGRAM':
      return 'Instagram';
    case 'TIKTOK':
      return 'TikTok';
    case 'ZALO':
      return 'Zalo';
    case 'LINKEDIN':
      return 'LinkedIn';
    default:
      return platform;
  }
}

export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const idNum = Number(userId);
  const { data: user, isLoading, isError } = usePublicUserProfile(idNum);
  const { data: currentUser } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');

  // Active products query
  const { data: productsData, isLoading: isProductsLoading } = useProducts({
    seller_id: idNum,
  });

  // Sold products query (lazy loaded when sold tab active or user is loaded)
  const { data: soldData, isLoading: isSoldLoading } = useUserSoldProducts(
    idNum,
    activeTab === 'sold',
  );

  const isOwnProfile = currentUser?.user_id === idNum;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 animate-pulse space-y-6">
        <div className="h-44 rounded-3xl bg-stone-200" />
        <div className="h-32 rounded-3xl bg-stone-200" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Không tìm thấy người dùng</p>
            <p className="text-xs text-red-600 mt-0.5">
              Tài khoản không tồn tại hoặc đã ngừng hoạt động.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeProducts = productsData?.pages.flatMap((page) => page.items) || [];
  const soldItems = soldData?.items || [];

  return (
    <div className="mx-auto max-w-3xl px-3.5 sm:px-6 py-5 sm:py-8 space-y-5">
      {/* 1. Header Overview Card */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-border bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-3.5 shrink-0">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-brand-burgundy/20 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-2 border-brand-burgundy/20 bg-brand-soft-pink text-brand-burgundy shadow-sm">
                <User className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
            )}
          </div>

          {/* User Name with safe mobile wrapping */}
          <div className="w-full max-w-full min-w-0 px-2 space-y-2">
            <h1 className="text-lg sm:text-2xl font-bold text-brand-text break-words [overflow-wrap:anywhere] leading-tight">
              {user.full_name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Shield className="h-3.5 w-3.5" />
                {user.role === 'ADMIN' ? 'Quản trị viên' : 'Sinh viên PTIT'}
              </span>

              <span className="inline-flex items-center gap-1 text-xs text-brand-text-muted">
                <Calendar className="h-3.5 w-3.5" />
                <span>Thành viên từ {formatDate(user.created_at)}</span>
              </span>
            </div>

            {/* Quick stats badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-border bg-stone-50/80 px-3 py-1.5 text-xs font-semibold text-brand-text">
                <Package className="h-3.5 w-3.5 text-brand-burgundy" />
                <span>{user.active_listing_count} đang bán</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Đã bán {user.completed_sold_count} sản phẩm</span>
              </span>
            </div>

            {isOwnProfile && (
              <div className="pt-2">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-border bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-brand-text hover:border-brand-burgundy hover:text-brand-burgundy transition-colors shadow-2xs"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa thông tin cá nhân</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Public Marketplace Information */}
      <div className="grid grid-cols-1 gap-4">
        {/* Bio */}
        {user.bio && (
          <section className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5 shadow-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
              <FileText className="h-4 w-4 text-brand-burgundy" />
              <span>Giới thiệu bản thân</span>
            </div>
            <p className="text-xs sm:text-sm text-brand-text whitespace-pre-line leading-relaxed break-words [overflow-wrap:anywhere]">
              {user.bio}
            </p>
          </section>
        )}

        {/* Coverage & Phone Info */}
        {(user.delivery_area || user.phone) && (
          <section className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5 shadow-xs space-y-3">
            {user.delivery_area && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
                  <MapPin className="h-4 w-4 text-brand-burgundy" />
                  <span>Phạm vi giao / nhận hàng</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-brand-text leading-relaxed break-words [overflow-wrap:anywhere]">
                  {user.delivery_area}
                </p>
              </div>
            )}

            {user.phone && (
              <div className="space-y-1 pt-1 border-t border-brand-border/40">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
                  <Phone className="h-4 w-4 text-brand-burgundy" />
                  <span>Số điện thoại liên hệ</span>
                </div>
                <a
                  href={`tel:${user.phone}`}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-burgundy hover:underline font-mono"
                >
                  {user.phone}
                </a>
              </div>
            )}
          </section>
        )}

        {/* Social Links */}
        {user.social_links && user.social_links.length > 0 && (
          <section className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5 shadow-xs space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
              <Share2 className="h-4 w-4 text-brand-burgundy" />
              <span>Mạng xã hội & Liên kết</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {user.social_links.map((link, idx) => (
                <a
                  key={`${link.platform}-${idx}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-xl border border-brand-border bg-stone-50/80 px-3 py-2 text-xs font-semibold text-brand-text hover:border-brand-burgundy hover:bg-brand-soft-pink/50 hover:text-brand-burgundy transition-all shadow-2xs max-w-full min-w-0"
                >
                  <SocialIcon
                    platform={link.platform}
                    className="h-4 w-4 text-brand-burgundy shrink-0"
                  />
                  <span className="truncate">{getPlatformLabel(link.platform)}</span>
                  <span className="text-[11px] text-brand-text-muted truncate font-mono hidden sm:inline max-w-[140px]">
                    {formatSocialDisplay(link.url)}
                  </span>
                  <ExternalLink className="h-3 w-3 text-brand-text-muted group-hover:text-brand-burgundy shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 3. Marketplace Storefront Tabs */}
      <section className="space-y-4 pt-2">
        <div className="flex border-b border-brand-border">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-brand-burgundy text-brand-burgundy'
                : 'border-transparent text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Đang bán ({user.active_listing_count})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sold')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'sold'
                ? 'border-brand-burgundy text-brand-burgundy'
                : 'border-transparent text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Đã bán ({user.completed_sold_count})</span>
          </button>
        </div>

        {/* Tab 1: Đang bán */}
        {activeTab === 'active' && (
          <div>
            {isProductsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 py-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[4/3] rounded-2xl bg-stone-200" />
                ))}
              </div>
            ) : activeProducts.length === 0 ? (
              <div className="rounded-2xl border border-brand-border/60 bg-white py-12 px-4 text-center">
                <Package className="mx-auto h-8 w-8 text-brand-text-muted/60 mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-brand-text">
                  Hiện chưa có sản phẩm đang bán.
                </p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Người bán chưa đăng tin mới hoặc các sản phẩm đã được giao dịch.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {activeProducts.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Đã bán (Sanitized Product-level History) */}
        {activeTab === 'sold' && (
          <div>
            {isSoldLoading ? (
              <div className="space-y-3 py-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-stone-200" />
                ))}
              </div>
            ) : soldItems.length === 0 ? (
              <div className="rounded-2xl border border-brand-border/60 bg-white py-12 px-4 text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-brand-text-muted/60 mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-brand-text">
                  Chưa có lịch sử bán hoàn tất.
                </p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  Lịch sử bán sẽ tự động ghi nhận khi các đơn hàng hoàn tất thành công.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {soldItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-3.5 shadow-2xs"
                  >
                    {/* Thumbnail */}
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-soft-pink border border-brand-border/60">
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-text-muted">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-brand-text truncate">
                        {item.product_title}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã bán {item.total_sold_quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
