import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ExternalLink } from 'lucide-react';
import { ProductContextSummary } from '../types';
import { formatVND } from '@/lib/formatters';

interface ProductCardBubbleProps {
  product: ProductContextSummary;
  isMine?: boolean;
  conversationId?: number;
  isGroup?: boolean;
  onBeforeNavigateAway?: () => void;
}

export const ProductCardBubble: React.FC<ProductCardBubbleProps> = ({
  product,
  isMine = false,
  conversationId,
  isGroup = false,
  onBeforeNavigateAway,
}) => {
  return (
    <div
      className={`rounded-2xl p-2.5 sm:p-3 border max-w-xs sm:max-w-sm transition-all mb-2 ${
        isMine
          ? 'bg-rose-950/30 border-rose-800/40 text-white'
          : 'bg-stone-50 border-stone-200 text-stone-900'
      }`}
    >
      <div className="flex gap-3 items-center">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shrink-0 flex items-center justify-center">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-6 h-6 text-stone-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className={`text-xs sm:text-sm font-semibold truncate ${
              isMine ? 'text-white' : 'text-stone-900'
            }`}
            title={product.title}
          >
            {product.title}
          </h4>
          <p
            className={`text-xs font-bold mt-0.5 ${
              isMine ? 'text-rose-200' : 'text-brand-burgundy'
            }`}
          >
            {formatVND(product.price, { showFreeForZero: true })}
          </p>

          <div className="flex items-center gap-1.5 mt-1">
            {product.status === 'AVAILABLE' ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                Đang bán
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-500/20 text-stone-400 font-medium">
                {product.status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-end">
        <Link
          to={`/products/${product.product_id}`}
          onClick={() => onBeforeNavigateAway?.()}
          state={{
            fromApp: true,
            returnTo: conversationId ? `/messages/${conversationId}` : undefined,
            returnLabel: isGroup ? 'Quay lại nhóm' : 'Quay lại cuộc trò chuyện',
            source: 'chat-product',
          }}
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
            isMine
              ? 'bg-white text-brand-burgundy hover:bg-rose-50'
              : 'bg-brand-burgundy text-white hover:bg-brand-burgundy/90'
          }`}
        >
          <span>Xem chi tiết</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
