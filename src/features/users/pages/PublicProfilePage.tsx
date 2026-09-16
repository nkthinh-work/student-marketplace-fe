import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { usePublicUserProfile, useCurrentUser, useUserSoldProducts } from '@/features/users/hooks';
import { useProducts } from '@/features/products/hooks';
import { useCreateDirectConversation } from '@/features/conversations/hooks';
import { ProductCard } from '@/features/products/components/ProductCard';
import { formatSocialDisplay } from '@/features/users/socialUtils';
import { getSafeBackAction } from '@/lib/navigation';
import { StarRating, RecentReviewsMarquee } from '@/features/reviews';
import { ReportModal } from '@/features/reports';
import { Avatar } from '@/components/common/Avatar';
import type { SocialPlatform } from '@/features/users/types';

import {
  ArrowLeft,
  Shield,
  Calendar,
  MapPin,
  FileText,
  Edit2,
  AlertCircle,
  Phone,
  Package,
  ShoppingBag,
  Star,
  Facebook,
  Instagram,
  Linkedin,
  Share2,
  MessageCircle,
  Globe2,
  ExternalLink,
  CheckCircle2,
  CheckCircle,
  ImageIcon,
  Loader2,
  Flag,
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

function SoldReviewComment({ comment }: { comment: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = comment.length > 120;

  return (
    <div className="space-y-1">
      <p
        className={`text-sm sm:text-base text-brand-text-secondary leading-relaxed break-words [overflow-wrap:anywhere] min-w-0 ${!isExpanded && isLong ? 'line-clamp-2' : ''
          }`}
      >
        "{comment}"
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-brand-burgundy hover:underline cursor-pointer"
        >
          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}

export const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const idNum = Number(userId);

  const { data: user, isLoading, isError } = usePublicUserProfile(idNum);
  const { data: currentUser } = useCurrentUser();

  const { label: backLabel, handleBack } = getSafeBackAction(location.state);

  const searchParams = new URLSearchParams(location.search);
  const rawTab = searchParams.get('tab');
  const initialTab = rawTab === 'sold' || rawTab === 'reviews' ? 'sold' : 'active';

  const [activeTab, setActiveTab] = useState<'active' | 'sold'>(initialTab);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // URL normalization: if ?tab=reviews was requested, replace with ?tab=sold
  React.useEffect(() => {
    if (searchParams.get('tab') === 'reviews') {
      const newParams = new URLSearchParams(location.search);
      newParams.set('tab', 'sold');
      const searchStr = newParams.toString();
      navigate(
        {
          pathname: location.pathname,
          search: searchStr ? `?${searchStr}` : '',
        },
        { replace: true, state: location.state }
      );
    }
  }, [location.search, location.pathname, location.state, navigate]);

  const handleTabChange = (tab: 'active' | 'sold') => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(location.search);
    if (tab === 'active') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    const searchStr = newParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: searchStr ? `?${searchStr}` : '',
      },
      { replace: true, state: location.state }
    );
  };

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

  const createDirectConversation = useCreateDirectConversation();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleStartDirectChat = async () => {
    if (!currentUser) {
      navigate('/?auth=login');
      return;
    }
    if (isOwnProfile || isStartingChat) return;

    try {
      setIsStartingChat(true);
      setChatError(null);
      const conv = await createDirectConversation.mutateAsync({
        recipient_user_id: idNum,
      });
      navigate(`/messages/${conv.conversation_id}`, {
        state: {
          fromApp: true,
          returnTo: location.pathname + location.search,
        },
      });
    } catch (err: any) {
      console.error('Failed to start direct conversation:', err);
      const message =
        err?.response?.data?.detail || 'Không thể mở cuộc trò chuyện. Vui lòng thử lại sau.';
      setChatError(typeof message === 'string' ? message : 'Lỗi kết nối.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const renderBackButton = () => (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => handleBack(navigate)}
        className="btn-interactive inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-text-secondary hover:text-brand-burgundy transition-colors"
        aria-label={backLabel}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span>{backLabel}</span>
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
        {renderBackButton()}
        <div className="animate-pulse space-y-6">
          <div className="h-44 rounded-3xl bg-stone-200" />
          <div className="h-32 rounded-3xl bg-stone-200" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto max-w-3xl px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
        {renderBackButton()}
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
    <div className="mx-auto max-w-3xl px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Contextual Safe In-App Back Action */}
      {renderBackButton()}

      {/* 1. Header Overview Card */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-border bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-3.5 shrink-0">
            <Avatar
              src={user.avatar_url}
              name={user.full_name}
              size="xl"
              className="border-2 border-brand-burgundy/20 shadow-sm"
            />
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
            <div className="space-y-2 pt-2">
              {/* Row 1: Rating / Review status (centered) */}
              <div className="flex items-center justify-center">
                {user.review_count && user.review_count > 0 && user.rating_average !== null && user.rating_average !== undefined ? (
                  <button
                    type="button"
                    onClick={() => handleTabChange('sold')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{user.rating_average.toFixed(1)}</span>
                    <span className="text-amber-700/70 font-normal">· {user.review_count} đánh giá</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-border bg-stone-50/80 px-3 py-1.5 text-xs font-semibold text-brand-text-muted">
                    <Star className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>Chưa có đánh giá</span>
                  </span>
                )}
              </div>

              {/* Row 2: Selling & Sold stats (paired together on the same row, centered) */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-border bg-stone-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-brand-text whitespace-nowrap">
                  <Package className="h-3.5 w-3.5 text-brand-burgundy shrink-0" />
                  <span>{user.active_listing_count} đang bán</span>
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-800 whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{user.completed_sold_count} đã bán</span>
                </span>

              </div>
            </div>


            {isOwnProfile ? (
              <div className="pt-2">
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-border bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-brand-text hover:border-brand-burgundy hover:text-brand-burgundy transition-colors shadow-2xs"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa thông tin cá nhân</span>
                </Link>
              </div>
            ) : (
              <div className="pt-2 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleStartDirectChat}
                  disabled={isStartingChat}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-burgundy/30 bg-brand-soft-pink/70 px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-brand-burgundy hover:bg-brand-soft-pink hover:border-brand-burgundy active:scale-98 transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Nhắn tin với ${user.full_name}`}
                >
                  {isStartingChat ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-brand-burgundy" />
                      <span>Đang mở cuộc trò chuyện...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-burgundy" />
                      <span>Nhắn tin</span>
                    </>
                  )}
                </button>
                {chatError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium text-center">
                    {chatError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/?auth=login');
                      return;
                    }
                    setIsReportModalOpen(true);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs text-brand-text-muted hover:text-rose-600 transition-colors cursor-pointer"
                  title="Báo cáo người dùng"
                >
                  <Flag className="h-3 w-3" />
                  <span>Báo cáo người dùng</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 2. Recent Public Reviews Conveyor (Quick Reputation Preview) */}
      <RecentReviewsMarquee userId={idNum} reviewCount={user.review_count} />

      {/* 3. Public Marketplace Information */}
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
        <div className="flex border-b border-brand-border overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleTabChange('active')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'active'
                ? 'border-brand-burgundy text-brand-burgundy'
                : 'border-transparent text-brand-text-muted hover:text-brand-text'
              }`}
          >
            <Package className="h-4 w-4" />
            <span>Đang bán ({user.active_listing_count})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('sold')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'sold'
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

        {/* Tab 2: Đã bán (Product-level History with Contextual Transaction Reviews) */}
        {activeTab === 'sold' && (
          <div>
            {isSoldLoading ? (
              <div className="space-y-3 py-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-stone-200" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {soldItems.map((item) => {
                  const hasReviews = Boolean(
                    item.review_count && item.review_count > 0 && item.recent_reviews?.length
                  );

                  return (
                    <div
                      key={item.product_id}
                      className="flex flex-col justify-between rounded-2xl border border-brand-border bg-white p-4 shadow-2xs space-y-3 min-w-0"
                    >
                      {/* Top: Product thumbnail & Sold info */}
                      <div className="flex items-center gap-3">
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

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-brand-text truncate break-words [overflow-wrap:anywhere]">
                            {item.product_title}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-xs flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Đã bán {item.total_sold_quantity}
                            </span>
                            {item.last_sold_at && (
                              <span className="text-[11px] text-brand-text-muted">
                                {new Date(item.last_sold_at).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contextual Transaction Reviews Section */}
                      {hasReviews && item.recent_reviews && item.recent_reviews.length > 0 && (
                        <div className="pt-2.5 border-t border-brand-border/60 space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                              Đánh giá giao dịch
                            </span>
                            {item.review_count && item.review_count > 1 && item.rating_average !== null && item.rating_average !== undefined && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50/80 text-amber-800 text-[11px] font-bold border border-amber-200/60">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {item.rating_average.toFixed(1)}
                                <span className="font-normal text-amber-700/70">· {item.review_count} đánh giá</span>
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {item.recent_reviews.map((rev, rIdx) => (
                              <div
                                key={`${rev.created_at}-${rIdx}`}
                                className="p-3 rounded-xl bg-stone-50/80 border border-brand-border/50 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <StarRating rating={rev.rating} size="md" readOnly />
                                  </div>
                                  <span className="text-xs text-brand-text-muted whitespace-nowrap">
                                    {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>

                                {rev.comment ? (
                                  <SoldReviewComment comment={rev.comment} />
                                ) : (
                                  <p className="text-xs italic text-brand-text-muted">
                                    (Người mua không để lại nhận xét chi tiết)
                                  </p>
                                )}

                                <div className="pt-0.5">
                                  <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700/80">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600/80 shrink-0" />
                                    <span>Người mua đã xác minh</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Report Modal */}
      {user && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="USER"
          targetId={user.user_id}
          targetTitle={`Người dùng: ${user.full_name}`}
          onSuccess={() => {
            setSuccessToast('Đã gửi báo cáo. Ban quản trị sẽ xem xét.');
            setTimeout(() => setSuccessToast(null), 4000);
          }}
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
};
