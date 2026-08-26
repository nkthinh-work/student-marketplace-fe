import { useState, useEffect } from 'react';
import type { ListingType, ProductFilterParams } from '../types';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';

interface ProductFiltersProps {
  filters: ProductFilterParams;
  onChange: (filters: ProductFilterParams) => void;
  activeCount: number;
}

export function ProductFilters({
  filters,
  onChange,
  activeCount,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Local state for modal inputs
  const [listingType, setListingType] = useState<ListingType | undefined>(
    filters.listing_type,
  );
  const [minPrice, setMinPrice] = useState<string>(
    filters.min_price !== undefined ? String(filters.min_price) : '',
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    filters.max_price !== undefined ? String(filters.max_price) : '',
  );

  useEffect(() => {
    setListingType(filters.listing_type);
    setMinPrice(filters.min_price !== undefined ? String(filters.min_price) : '');
    setMaxPrice(filters.max_price !== undefined ? String(filters.max_price) : '');
  }, [filters]);

  const handleApply = () => {
    const minVal = minPrice.trim() ? Math.max(0, Number(minPrice)) : undefined;
    const maxVal = maxPrice.trim() ? Math.max(0, Number(maxPrice)) : undefined;

    onChange({
      ...filters,
      listing_type: listingType,
      min_price: minVal,
      max_price: maxVal,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setListingType(undefined);
    setMinPrice('');
    setMaxPrice('');
    onChange({
      ...filters,
      listing_type: undefined,
      min_price: undefined,
      max_price: undefined,
    });
    setIsOpen(false);
  };

  return (
    <div>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`chip-interactive flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
          activeCount > 0
            ? 'bg-brand-burgundy text-white border-brand-burgundy shadow-sm'
            : 'bg-brand-warm-white text-brand-text-secondary border-brand-border hover:bg-brand-soft-pink'
        }`}
        aria-label="Mở bộ lọc"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Bộ lọc</span>
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-brand-text">
            {activeCount}
          </span>
        )}
      </button>

      {/* Filter Modal / Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-default transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng bộ lọc"
          />

          {/* Dialog Content */}
          <div className="relative z-10 flex w-full max-w-lg flex-col max-h-[85dvh] rounded-t-3xl sm:rounded-3xl bg-brand-warm-white shadow-2xl border border-brand-border p-5 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-brand-burgundy" />
                <h3 className="text-base font-bold text-brand-text">Bộ lọc sản phẩm</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="icon-btn-interactive flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted hover:bg-brand-soft-pink"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 hide-scrollbar">
              {/* Kiểu bán (Listing Type) */}
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                  Hình thức đăng bán
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: undefined, label: 'Tất cả' },
                    { id: 'FIXED_PRICE', label: 'Giá cố định' },
                    { id: 'AUCTION', label: 'Đấu giá' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setListingType(item.id as ListingType | undefined)}
                      className={`rounded-xl px-2.5 py-2 text-xs font-medium border transition-all ${
                        listingType === item.id
                          ? 'bg-brand-burgundy text-white border-brand-burgundy shadow-xs font-semibold'
                          : 'bg-white text-brand-text-secondary border-brand-border hover:bg-brand-soft-pink'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khoảng giá */}
              <div>
                <label className="block text-xs font-bold text-brand-text uppercase tracking-wider mb-2">
                  Khoảng giá (VNĐ)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="Từ..."
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full rounded-xl bg-white border border-brand-border px-3 py-2 text-xs sm:text-sm text-brand-text focus:border-brand-burgundy focus:outline-hidden"
                    />
                  </div>
                  <span className="text-brand-text-muted text-xs">—</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      placeholder="Đến..."
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full rounded-xl bg-white border border-brand-border px-3 py-2 text-xs sm:text-sm text-brand-text focus:border-brand-burgundy focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-brand-border/60">
              <button
                type="button"
                onClick={handleReset}
                className="btn-interactive flex items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-xs font-semibold text-brand-text-secondary hover:bg-brand-soft-pink shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Thiết lập lại
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="btn-interactive flex flex-1 items-center justify-center rounded-xl bg-brand-burgundy px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-burgundy-dark"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
