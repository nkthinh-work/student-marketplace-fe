import { previewProducts, formatVND } from '@/data/previewProducts';
import { ShoppingBag, Tag, Heart } from 'lucide-react';
import { useScrollReveal } from '@/lib/useScrollReveal';

interface PreviewProductsProps {
  selectedCategory: string;
}

export function PreviewProductsSection({ selectedCategory }: PreviewProductsProps) {
  const filteredProducts =
    selectedCategory === 'for-you'
      ? previewProducts
      : previewProducts.filter((p) => p.category === selectedCategory);

  const revealRef = useScrollReveal();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-brand-text flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-brand-burgundy" />
          Mặt hàng nổi bật
        </h2>
        <span className="text-xs text-brand-text-muted">
          {filteredProducts.length} sản phẩm
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-border p-8 text-center">
          <Tag className="h-8 w-8 text-brand-text-muted mb-2" />
          <p className="text-sm text-brand-text-secondary font-medium">
            Chưa có sản phẩm nào trong danh mục này
          </p>
          <p className="text-xs text-brand-text-muted mt-1">
            Hãy quay lại sau hoặc chọn danh mục khác nhé!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              ref={revealRef}
              className={`reveal stagger-${Math.min(index % 6 + 1, 6)} group card-interactive flex flex-col overflow-hidden rounded-2xl bg-brand-warm-white border border-brand-border elevation-1`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-soft-pink">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Favorite heart — preview only, no backend logic */}
                <button
                  type="button"
                  aria-label="Yêu thích"
                  className="heart-preview absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-brand-text-muted"
                >
                  <Heart className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5">
                <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-brand-text group-hover:text-brand-burgundy transition-colors">
                  {product.title}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-brand-price">
                    {formatVND(product.price)}
                  </span>
                  <span className="rounded-md bg-brand-soft-pink px-1.5 py-0.5 text-[10px] font-medium text-brand-text-secondary">
                    PTIT
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

