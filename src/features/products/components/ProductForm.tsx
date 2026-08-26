import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCategories } from '@/features/categories/hooks';
import {
  productCreateSchema,
  productUpdateSchema,
  type ProductCreateForm,
  type ProductUpdateForm,
} from '../schemas';
import type { ProductDetailResponse } from '../types';
import {
  Package,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface CreateProductFormProps {
  mode: 'create';
  initialData?: never;
  onSubmit: (data: ProductCreateForm) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

interface EditProductFormProps {
  mode: 'edit';
  initialData: ProductDetailResponse;
  onSubmit: (data: ProductUpdateForm) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

type ProductFormProps = CreateProductFormProps | EditProductFormProps;

export function ProductForm(props: ProductFormProps) {
  const { mode, initialData, onSubmit, isSubmitting = false, submitLabel } = props;
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductCreateForm & ProductUpdateForm>({
    resolver: zodResolver(
      mode === 'create' ? productCreateSchema : productUpdateSchema,
    ),
    defaultValues: {
      category_id: initialData?.category.category_id || undefined,
      title: initialData?.title || '',
      description: initialData?.description || '',
      price: initialData?.price ? Number(initialData.price) : undefined,
      stock: initialData?.available_stock ?? 1,
      status: (initialData?.status as 'AVAILABLE' | 'HIDDEN') || 'AVAILABLE',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        category_id: initialData.category.category_id,
        title: initialData.title,
        description: initialData.description || '',
        price: Number(initialData.price),
        stock: initialData.available_stock,
        status: (initialData.status as 'AVAILABLE' | 'HIDDEN') || 'AVAILABLE',
      });
    }
  }, [initialData, reset]);

  const onFormSubmit = (data: ProductCreateForm & ProductUpdateForm) => {
    if (mode === 'create') {
      (onSubmit as (d: ProductCreateForm) => void)(data as ProductCreateForm);
    } else {
      (onSubmit as (d: ProductUpdateForm) => void)(data as ProductUpdateForm);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-brand-text mb-1.5 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-brand-burgundy" />
          Danh mục sản phẩm <span className="text-brand-price">*</span>
        </label>
        <select
          {...register('category_id')}
          disabled={categoriesLoading}
          className="w-full rounded-2xl bg-white border border-brand-border px-4 py-3 text-sm text-brand-text focus:border-brand-burgundy focus:outline-hidden disabled:opacity-50"
        >
          <option value="">-- Chọn danh mục phù hợp --</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.category_id.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-brand-text mb-1.5 flex items-center gap-1.5">
          <Package className="h-4 w-4 text-brand-burgundy" />
          Tiêu đề tin đăng <span className="text-brand-price">*</span>
        </label>
        <input
          type="text"
          placeholder="Ví dụ: Giáo trình Giải tích 1 PTIT (Đầy đủ bài tập)"
          {...register('title')}
          className="w-full rounded-2xl bg-white border border-brand-border px-4 py-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:border-brand-burgundy focus:outline-hidden"
        />
        {errors.title && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-brand-text mb-1.5 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-brand-burgundy" />
          Mô tả chi tiết
        </label>
        <textarea
          rows={4}
          placeholder="Mô tả chi tiết sản phẩm, tình trạng thực tế, phụ kiện đi kèm, lý do bán..."
          {...register('description')}
          className="w-full rounded-2xl bg-white border border-brand-border p-4 text-sm text-brand-text placeholder:text-brand-text-muted focus:border-brand-burgundy focus:outline-hidden resize-none"
        />
        {errors.description && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-brand-text mb-1.5 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-brand-burgundy" />
            Giá bán (VNĐ) <span className="text-brand-price">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="Ví dụ: 45000"
            {...register('price')}
            className="w-full rounded-2xl bg-white border border-brand-border px-4 py-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:border-brand-burgundy focus:outline-hidden"
          />
          {errors.price && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.price.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-text mb-1.5 flex items-center gap-1.5">
            <Package className="h-4 w-4 text-brand-burgundy" />
            Số lượng có sẵn <span className="text-brand-price">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="1"
            {...register('stock')}
            className="w-full rounded-2xl bg-white border border-brand-border px-4 py-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:border-brand-burgundy focus:outline-hidden"
          />
          {errors.stock && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.stock.message}
            </p>
          )}
        </div>
      </div>

      {mode === 'edit' && initialData?.listing_type === 'AUCTION' && (
        <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-800 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-700 shrink-0" />
          <span>
            Sản phẩm này là <strong>Đấu giá (AUCTION)</strong>. Không thể thay đổi hình thức bán.
          </span>
        </div>
      )}

      {mode === 'edit' && (
        <div>
          <label className="block text-xs font-bold text-brand-text mb-1.5 flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-brand-burgundy" />
            Trạng thái hiển thị
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 p-3 rounded-2xl border border-brand-border bg-white cursor-pointer hover:bg-brand-soft-pink/40 has-checked:border-emerald-600 has-checked:bg-emerald-50 transition-all text-xs font-semibold text-brand-text">
              <input
                type="radio"
                value="AVAILABLE"
                {...register('status' as never)}
                className="accent-emerald-600"
              />
              <Eye className="h-4 w-4 text-emerald-600" />
              <span>Đang hiển thị (AVAILABLE)</span>
            </label>
            <label className="flex items-center gap-2 p-3 rounded-2xl border border-brand-border bg-white cursor-pointer hover:bg-brand-soft-pink/40 has-checked:border-gray-500 has-checked:bg-gray-100 transition-all text-xs font-semibold text-brand-text">
              <input
                type="radio"
                value="HIDDEN"
                {...register('status' as never)}
                className="accent-gray-600"
              />
              <EyeOff className="h-4 w-4 text-gray-500" />
              <span>Tạm ẩn tin (HIDDEN)</span>
            </label>
          </div>
        </div>
      )}

      <div className="pt-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-interactive flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-burgundy py-3.5 text-sm font-bold text-white shadow-md hover:bg-brand-burgundy-dark disabled:opacity-50"
        >
          {submitLabel || (mode === 'create' ? 'Tiếp tục: Thêm ảnh sản phẩm' : 'Lưu thay đổi')}
        </button>
      </div>
    </form>
  );
}
