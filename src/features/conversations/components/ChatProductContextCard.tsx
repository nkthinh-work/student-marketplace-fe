import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ExternalLink } from 'lucide-react';
import { ProductContextSummary } from '../types';
import { formatVND } from '@/lib/formatters';

interface ChatProductContextCardProps {
  product: ProductContextSummary;
  conversationId?: number;
  onBeforeNavigateAway?: () => void;
}

export const ChatProductContextCard: React.FC<ChatProductContextCardProps> = ({
  product,
  conversationId,
  onBeforeNavigateAway,
}) => {
  return (
    <div className="bg-stone-50 border-b border-stone-200 px-3 py-2 sm:px-4 sm:py-2.5">
      <Link
        to={`/products/${product.product_id}`}
        onClick={() => onBeforeNavigateAway?.()}
        state={{
          fromApp: true,
          returnTo: conversationId ? `/messages/${conversationId}` : undefined,
          returnLabel: 'Quay lại cuộc trò chuyện',
          source: 'chat-context',
        }}
        className="flex items-center gap-3 group bg-white border border-stone-200 hover:border-brand-burgundy/40 rounded-xl p-2 transition-all shadow-xs"
      >
        <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-stone-100 border border-stone-200/80 flex items-center justify-center">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <Package className="w-5 h-5 text-stone-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs sm:text-sm font-medium text-stone-900 truncate group-hover:text-brand-burgundy transition-colors">
              {product.title}
            </h4>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-brand-burgundy shrink-0 ml-1" />
          </div>
          <p className="text-xs font-semibold text-brand-burgundy mt-0.5">
            {formatVND(product.price, { showFreeForZero: true })}
          </p>
        </div>
      </Link>
    </div>
  );
};
