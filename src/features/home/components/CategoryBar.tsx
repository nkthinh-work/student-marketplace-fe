import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useCategories } from '@/features/categories/hooks';
import { getCategoryMeta, sortCategories } from '@/features/categories/categoryMeta';

interface CategoryBarProps {
  selectedCategoryId?: number;
  onSelectCategory: (id?: number) => void;
}

export function CategoryBar({
  selectedCategoryId,
  onSelectCategory,
}: CategoryBarProps) {
  const { data: categories = [] } = useCategories();

  const sortedCategories = useMemo(() => sortCategories(categories), [categories]);

  return (
    <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
      {/* Client-only "Dành cho bạn" Tab (category_id = undefined) */}
      <button
        type="button"
        onClick={() => onSelectCategory(undefined)}
        className={`chip-interactive flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
          selectedCategoryId === undefined
            ? 'bg-brand-burgundy text-white chip-interactive--selected font-semibold'
            : 'bg-brand-warm-white text-brand-text-secondary border border-brand-border hover:bg-brand-soft-pink hover:border-brand-burgundy/20'
        }`}
      >
        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        <span>Dành cho bạn</span>
      </button>

      {/* Backend Categories */}
      {sortedCategories.map((cat) => {
        const isSelected = selectedCategoryId === cat.category_id;
        const { icon: CategoryIcon } = getCategoryMeta(cat);

        return (
          <button
            key={cat.category_id}
            type="button"
            onClick={() => onSelectCategory(cat.category_id)}
            className={`chip-interactive flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-brand-burgundy text-white chip-interactive--selected font-semibold'
                : 'bg-brand-warm-white text-brand-text-secondary border border-brand-border hover:bg-brand-soft-pink hover:border-brand-burgundy/20'
            }`}
          >
            <CategoryIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}

