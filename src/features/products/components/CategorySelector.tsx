import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Layers, Check } from 'lucide-react';
import type { CategoryResponse } from '@/features/categories/types';

interface CategorySelectorProps {
  categories: CategoryResponse[];
  selectedCategoryId?: number;
  onSelect: (categoryId: number) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onSelect,
  disabled = false,
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedCategory = categories.find(
    (c) => String(c.category_id) === String(selectedCategoryId)
  );

  // Scroll lock for body when modal is open
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

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus selected or first option when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const selectedIndex = categories.findIndex(
          (c) => String(c.category_id) === String(selectedCategoryId)
        );
        const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;
        optionsRef.current[focusIndex]?.focus();
      }, 50);
    }
  }, [isOpen, categories, selectedCategoryId]);

  const handleSelectOption = (catId: number) => {
    onSelect(catId);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % categories.length;
      optionsRef.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + categories.length) % categories.length;
      optionsRef.current[prevIndex]?.focus();
    }
  };

  return (
    <div className="relative w-full">
      {/* Trigger Button - Looks like clean PTITers input */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        id="category-selector-trigger"
        className={`w-full rounded-2xl bg-white border px-4 py-3 text-sm text-brand-text flex items-center justify-between transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError
            ? 'border-red-400 focus:border-red-500'
            : 'border-brand-border hover:border-brand-burgundy/60 focus:border-brand-burgundy'
        } focus:outline-hidden`}
      >
        <span
          className={
            selectedCategory ? 'font-semibold text-brand-text' : 'text-brand-text-muted'
          }
        >
          {selectedCategory ? selectedCategory.name : '-- Chọn danh mục phù hợp --'}
        </span>
        <ChevronDown className="h-4 w-4 text-brand-text-muted shrink-0 transition-transform duration-200" />
      </button>

      {/* Application-Rendered Sheet / Modal Portal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-selector-title"
          >
            {/* Backdrop */}
            <button
              type="button"
              className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-default transition-opacity"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="Đóng bảng danh mục"
            />

            {/* Modal Dialog Content */}
            <div className="relative z-10 flex w-full sm:max-w-md flex-col max-h-[85dvh] rounded-t-3xl sm:rounded-3xl bg-brand-warm-white shadow-2xl border border-brand-border p-4 sm:p-5 animate-in slide-in-from-bottom duration-200">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-brand-border/60 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-soft-pink text-brand-burgundy flex items-center justify-center shrink-0">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h3
                    id="category-selector-title"
                    className="text-base font-bold text-brand-text"
                  >
                    Danh mục sản phẩm
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className="icon-btn-interactive flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted hover:bg-brand-soft-pink"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Category Options List */}
              <div
                role="radiogroup"
                aria-labelledby="category-selector-title"
                className="flex-1 overflow-y-auto py-3 space-y-1.5 hide-scrollbar max-h-[60dvh]"
              >
                {categories.map((cat, index) => {
                  const isSelected =
                    String(cat.category_id) === String(selectedCategoryId);
                  return (
                    <button
                      key={cat.category_id}
                      ref={(el) => {
                        optionsRef.current[index] = el;
                      }}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => handleSelectOption(cat.category_id)}
                      onKeyDown={(e) => handleOptionKeyDown(e, index)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl border transition-all text-left cursor-pointer select-none ${
                        isSelected
                          ? 'bg-brand-soft-pink/60 border-brand-burgundy/40 shadow-xs'
                          : 'bg-white border-brand-border/60 hover:bg-stone-50 hover:border-brand-border'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Radio indicator circle */}
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'border-brand-burgundy bg-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-brand-burgundy" />
                          )}
                        </div>
                        <span
                          className={`text-sm truncate ${
                            isSelected
                              ? 'font-bold text-brand-burgundy'
                              : 'font-medium text-brand-text'
                          }`}
                        >
                          {cat.name}
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 text-brand-burgundy shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
