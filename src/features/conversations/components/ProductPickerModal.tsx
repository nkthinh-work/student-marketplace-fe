import React, { useState } from 'react';
import { X, Package, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/features/products/api';
import { useCurrentUser } from '@/features/users/hooks';
import { ProductContextSummary } from '../types';
import { formatVND } from '@/lib/formatters';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: number;
  otherUserName: string;
  onSelectProduct: (product: ProductContextSummary) => void;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  onSelectProduct,
}) => {
  const { data: user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'OTHER' | 'ME'>('OTHER');
  const [searchQuery, setSearchQuery] = useState('');

  const targetSellerId = activeTab === 'OTHER' ? otherUserId : user?.user_id;

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'picker', targetSellerId, searchQuery],
    queryFn: () =>
      getProducts({
        seller_id: targetSellerId,
        q: searchQuery.trim() || undefined,
        limit: 20,
      }),
    enabled: isOpen && Boolean(targetSellerId),
  });

  if (!isOpen) return null;

  const products = data?.items || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Chia sẻ sản phẩm
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Chọn sản phẩm để gửi vào cuộc trò chuyện
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('OTHER')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'OTHER'
                ? 'bg-white text-brand-burgundy shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Của {otherUserName || 'người này'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ME')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ME'
                ? 'bg-white text-brand-burgundy shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Của tôi
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-stone-100">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-brand-burgundy focus:ring-1 focus:ring-brand-burgundy text-stone-900"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[380px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-brand-burgundy mb-2" />
              <p className="text-xs">Đang tải sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-stone-400 text-center px-4">
              <Package className="w-10 h-10 text-stone-300 mb-2" />
              <p className="text-xs font-medium text-stone-700">
                {activeTab === 'OTHER'
                  ? 'Người này chưa có sản phẩm khả dụng nào'
                  : 'Bạn chưa có sản phẩm khả dụng nào'}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {searchQuery
                  ? 'Không tìm thấy sản phẩm phù hợp với từ khóa'
                  : 'Chỉ các sản phẩm đang hiển thị mới có thể chia sẻ'}
              </p>
            </div>
          ) : (
            products.map((prod) => {
              const primaryImage = prod.thumbnail_url || null;
              return (
                <div
                  key={prod.product_id}
                  onClick={() => {
                    onSelectProduct({
                      product_id: prod.product_id,
                      title: prod.title,
                      price: prod.price,
                      status: prod.status,
                      thumbnail_url: primaryImage,
                      listing_type: prod.listing_type,
                    });
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 hover:border-brand-burgundy/50 hover:bg-stone-50/80 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200 flex items-center justify-center">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-stone-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-stone-900 truncate group-hover:text-brand-burgundy transition-colors">
                      {prod.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-brand-burgundy">
                        {formatVND(prod.price, { showFreeForZero: true })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-burgundy/10 text-brand-burgundy group-hover:bg-brand-burgundy group-hover:text-white transition-colors"
                  >
                    Chọn
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
