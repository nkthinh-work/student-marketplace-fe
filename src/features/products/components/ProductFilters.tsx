import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ListingType, ProductFilterParams } from '../types';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';

interface ProductFiltersProps {
  filters: ProductFilterParams;
  onChange: (filters: ProductFilterParams) => void;
  activeCount: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductFilters({
  filters,
  onChange,
  activeCount,
  isOpen: isOpenProp,
  onOpenChange,
}: ProductFiltersProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof isOpenProp === 'boolean';
  const isOpen = isControlled ? isOpenProp : internalOpen;

  const setIsOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  };

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
  const [priceError, setPriceError] = useState<string | null>(null);

  useEffect(() => {
    setListingType(filters.listing_type);
    setMinPrice(filters.min_price !== undefined ? String(filters.min_price) : '');
    setMaxPrice(filters.max_price !== undefined ? String(filters.max_price) : '');
    setPriceError(null);
  }, [filters]);

  // Robust scroll-preserving body lock for iOS Safari and mobile browsers
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const handleApply = () => {
    setPriceError(null);
    const minClean = minPrice.trim();
    const maxClean = maxPrice.trim();

    if (minClean && !/^\d+$/.test(minClean)) {
      setPriceError('Giá tối thiểu phải là số nguyên.');
      return;
    }
    if (maxClean && !/^\d+$/.test(maxClean)) {
      setPriceError('Giá tối đa phải là số nguyên.');
      return;
    }

    const minVal = minClean ? Number(minClean) : undefined;
    const maxVal = maxClean ? Number(maxClean) : undefined;

    if (minVal !== undefined && (minVal < 0 || minVal > 50_000_000)) {
      setPriceError('Giá tối thiểu phải từ 0 đến 50.000.000 VNĐ.');
      return;
    }
    if (maxVal !== undefined && (maxVal < 0 || maxVal > 50_000_000)) {
      setPriceError('Giá tối đa phải từ 0 đến 50.000.000 VNĐ.');
      return;
    }
    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
      setPriceError('Giá tối thiểu không thể lớn hơn giá tối đa.');
      return;
    }

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
    setPriceError(null);
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
        data-ui-role="product-sort-control"
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
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-default transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng bộ lọc"
          />

          {/* Dialog Content */}
          <div className="relative z-10 flex w-full sm:max-w-lg flex-col max-h-[85dvh] rounded-t-3xl sm:rounded-3xl bg-brand-warm-white shadow-2xl border border-brand-border p-5 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/60 shrink-0">
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
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Từ..."
                      value={minPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          setMinPrice(val);
                          setPriceError(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Backspace' ||
                          e.key === 'Delete' ||
                          e.key === 'Tab' ||
                          e.key === 'Escape' ||
                          e.key === 'Enter' ||
                          e.key === 'ArrowLeft' ||
                          e.key === 'ArrowRight' ||
                          e.key === 'Home' ||
                          e.key === 'End' ||
                          ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
                        ) {
                          return;
                        }
                        if (!/^\d$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        if (!/^\d+$/.test(pasted.trim())) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full rounded-xl bg-white border border-brand-border px-3 py-2 text-base md:text-sm text-brand-text focus:border-brand-burgundy focus:outline-hidden"
                    />
                  </div>
                  <span className="text-brand-text-muted text-xs">—</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Đến..."
                      value={maxPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          setMaxPrice(val);
                          setPriceError(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Backspace' ||
                          e.key === 'Delete' ||
                          e.key === 'Tab' ||
                          e.key === 'Escape' ||
                          e.key === 'Enter' ||
                          e.key === 'ArrowLeft' ||
                          e.key === 'ArrowRight' ||
                          e.key === 'Home' ||
                          e.key === 'End' ||
                          ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
                        ) {
                          return;
                        }
                        if (!/^\d$/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        if (!/^\d+$/.test(pasted.trim())) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full rounded-xl bg-white border border-brand-border px-3 py-2 text-base md:text-sm text-brand-text focus:border-brand-burgundy focus:outline-hidden"
                    />
                  </div>
                </div>
                {priceError && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {priceError}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-brand-border/60 shrink-0">
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
        </div>,
        document.body
      )}
    </div>
  );
}
