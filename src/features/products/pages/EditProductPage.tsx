import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProduct, useUpdateProduct } from '../hooks';
import type { ProductUpdateForm } from '../schemas';
import { ProductForm } from '../components/ProductForm';
import { ProductImageManager } from '../components/ProductImageManager';
import {
  ArrowLeft,
  Edit,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export function EditProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const numericId = productId ? parseInt(productId, 10) : undefined;

  const { data: product, isLoading, isError, refetch } = useProduct(numericId);
  const updateMutation = useUpdateProduct(numericId!);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <LoadingSpinner message="Đang tải thông tin sản phẩm..." />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-brand-price mx-auto" />
        <h2 className="text-lg font-bold text-brand-text">Không thể chỉnh sửa sản phẩm</h2>
        <p className="text-xs sm:text-sm text-brand-text-secondary">
          Sản phẩm không tồn tại hoặc bạn không có quyền chỉnh sửa tin đăng này.
        </p>
        <button
          type="button"
          onClick={() => navigate('/my-products')}
          className="btn-interactive inline-flex items-center gap-2 rounded-2xl bg-brand-burgundy px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-burgundy-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách tin
        </button>
      </div>
    );
  }

  const handleUpdateSubmit = (data: ProductUpdateForm) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    // Không gửi listing_type trong payload PATCH
    const { category_id, title, description, price, stock, status } = data;

    updateMutation.mutate(
      {
        category_id,
        title,
        description,
        price,
        stock,
        status,
      },
      {
        onSuccess: () => {
          setSuccessMessage('Đã cập nhật thông tin sản phẩm thành công!');
          refetch();
        },
        onError: (err) => {
          const detail =
            (err as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail || 'Không thể cập nhật sản phẩm. Vui lòng thử lại.';
          setErrorMessage(detail);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-interactive flex items-center gap-1.5 rounded-xl border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-text-secondary hover:bg-brand-soft-pink"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>

        <Link
          to={`/products/${product.product_id}`}
          className="btn-interactive flex items-center gap-1.5 rounded-xl border border-brand-border bg-white px-3 py-1.5 text-xs font-bold text-brand-burgundy hover:bg-brand-soft-pink no-underline"
        >
          <Eye className="h-3.5 w-3.5" /> Xem tin
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-brand-text flex items-center gap-2">
          <Edit className="h-6 w-6 text-brand-burgundy" />
          Chỉnh sửa tin đăng
        </h1>
        <p className="text-xs text-brand-text-secondary">
          Cập nhật giá, mô tả, tồn kho hoặc thay đổi trạng thái ẩn/hiện tin.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-5 sm:p-6 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card">
        <h3 className="text-sm font-bold text-brand-text mb-4 pb-2 border-b border-brand-border/60">
          Thông tin sản phẩm
        </h3>
        <ProductForm
          mode="edit"
          initialData={product}
          onSubmit={handleUpdateSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel={updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        />
      </div>

      <div className="p-5 sm:p-6 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card">
        <ProductImageManager
          productId={product.product_id}
          images={product.images}
          onImagesChange={() => refetch()}
        />
      </div>
    </div>
  );
}
