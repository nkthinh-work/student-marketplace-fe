import { Link } from 'react-router-dom';
import type { ProductSummaryResponse } from '../types';
import {
  formatVND,
  getListingTypeMeta,
  formatRelativeTime,
} from '@/lib/formatters';
import { Heart, User, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/hooks';

interface ProductCardProps {
  product: ProductSummaryResponse;
  staggerIndex?: number;
}

export function ProductCard({ product, staggerIndex = 1 }: ProductCardProps) {
  const listingMeta = getListingTypeMeta(product.listing_type);
  const { firebaseUser } = useAuth();
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const isFavorited = favoriteIds?.has(product.product_id) ?? false;

  const handleHeartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!firebaseUser) {
      const authCard = document.getElementById('auth-card');
      if (authCard) {
        authCard.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
      return;
    }

    toggleFavorite.mutate({
      productId: product.product_id,
      isFavorited,
    });
  };

  return (
    <Link
      to={`/products/${product.product_id}`}
      className={`stagger-${Math.min(staggerIndex, 6)} group card-interactive flex flex-col overflow-hidden rounded-2xl bg-brand-warm-white border border-brand-border elevation-1 no-underline transition-all`}
      aria-label={`Xem chi tiết ${product.title}`}
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-soft-pink">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-text-muted">
            <ImageIcon className="h-10 w-10 stroke-1" />
          </div>
        )}

        {/* Listing Type Badge */}
        {listingMeta.isAuction && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${listingMeta.badgeClass} backdrop-blur-sm`}
            >
              {listingMeta.label}
            </span>
          </div>
        )}

        {/* Favorite heart button */}
        <button
          type="button"
          onClick={handleHeartClick}
          disabled={toggleFavorite.isPending}
          className={`heart-btn absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm transition-all hover:scale-110 active:scale-90 shadow-xs ${isFavorited
              ? 'text-brand-price fill-brand-price'
              : 'text-brand-text-muted hover:text-brand-price'
            }`}
          aria-label={
            isFavorited
              ? `Bỏ lưu ${product.title}`
              : `Lưu tin ${product.title}`
          }
          title={isFavorited ? 'Bỏ lưu tin' : 'Lưu tin'}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${isFavorited ? 'fill-current text-brand-price' : ''
              }`}
          />
        </button>
      </div>

      {/* Content Info */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5">
        <div>
          {/* Category & Time */}
          <div className="flex items-center justify-between text-[11px] text-brand-text-muted mb-1">
            <span className="truncate max-w-[65%]">{product.category.name}</span>
            <span className="shrink-0">{formatRelativeTime(product.created_at)}</span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-brand-text group-hover:text-brand-burgundy transition-colors leading-snug break-words [overflow-wrap:anywhere]">
            {product.title}
          </h3>
        </div>

        {/* Price & Seller Info */}
        <div className="mt-3 pt-2 border-t border-brand-border/40">
          <div className="flex items-baseline justify-between gap-1">
            <div>
              {listingMeta.isAuction && (
                <span className="block text-[10px] text-purple-700 font-medium leading-none mb-0.5">
                  {listingMeta.priceLabel}
                </span>
              )}
              <span className="text-xs sm:text-sm font-bold text-brand-price">
                {formatVND(product.price)}
              </span>
            </div>

            {/* Seller Avatar / Name snippet */}
            <div className="flex items-center gap-1 min-w-0 max-w-[45%] text-brand-text-secondary">
              {product.seller.avatar_url ? (
                <img
                  src={product.seller.avatar_url}
                  alt=""
                  className="h-4 w-4 rounded-full object-cover shrink-0"
                />
              ) : (
                <User className="h-3.5 w-3.5 shrink-0 text-brand-text-muted" />
              )}
              <span className="text-[10px] font-medium truncate">
                {product.seller.full_name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
