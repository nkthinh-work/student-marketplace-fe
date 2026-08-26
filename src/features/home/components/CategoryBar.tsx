import { useCategories } from '@/features/categories/hooks';
import type { CategoryResponse } from '@/features/categories/types';

interface CategoryBarProps {
  selectedCategoryId?: number;
  onSelectCategory: (id?: number) => void;
}

const CATEGORY_ICON_MAP: Record<string, string> = {
  'giao-trinh-sach': '📚',
  'sach-giao-trinh': '📚',
  'thiet-bi-dien-tu': '💻',
  'do-dien-tu': '💻',
  'phong-tro-ktx': '🏢',
  'xe-co': '🏍️',
  'do-sinh-hoat': '🧺',
  'thoi-trang': '👕',
  'dung-cu-hoc-tap': '✏️',
};

export function CategoryBar({
  selectedCategoryId,
  onSelectCategory,
}: CategoryBarProps) {
  const { data: categories = [] } = useCategories();

  const getCategoryIcon = (cat: CategoryResponse) => {
    return CATEGORY_ICON_MAP[cat.slug] || '🏷️';
  };

  return (
    <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
      {/* Client-only "Dành cho bạn" Tab (category_id = undefined) */}
      <button
        type="button"
        onClick={() => onSelectCategory(undefined)}
        className={`chip-interactive flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
          selectedCategoryId === undefined
            ? 'bg-brand-burgundy text-white chip-interactive--selected font-semibold'
            : 'bg-brand-warm-white text-brand-text-secondary border border-brand-border hover:bg-brand-soft-pink hover:border-brand-burgundy/20'
        }`}
      >
        <span>🏠</span>
        <span>Dành cho bạn</span>
      </button>

      {/* Backend Categories */}
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.category_id;
        return (
          <button
            key={cat.category_id}
            type="button"
            onClick={() => onSelectCategory(cat.category_id)}
            className={`chip-interactive flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              isSelected
                ? 'bg-brand-burgundy text-white chip-interactive--selected font-semibold'
                : 'bg-brand-warm-white text-brand-text-secondary border border-brand-border hover:bg-brand-soft-pink hover:border-brand-burgundy/20'
            }`}
          >
            <span>{getCategoryIcon(cat)}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
