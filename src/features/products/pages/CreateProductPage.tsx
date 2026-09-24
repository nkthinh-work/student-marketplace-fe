import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProduct, useProduct } from '../hooks';
import type { ProductCreateForm } from '../schemas';
import { ProductForm } from '../components/ProductForm';
import { ProductImageManager } from '../components/ProductImageManager';
import { useUserAccessStatus } from '@/features/users/hooks';
import { getApiErrorMessage } from '@/lib/apiErrors';
import {
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  AlertCircle,
  Eye,
} from 'lucide-react';

export function CreateProductPage() {
  const navigate = useNavigate();
  const createMutation = useCreateProduct();
  const { data: accessStatus } = useUserAccessStatus();
  const isSellRestricted = accessStatus?.can_sell === false;

  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: createdProduct, refetch: refetchCreatedProduct } = useProduct(
    createdProductId || undefined,
  );

  const handleCreateSubmit = (data: ProductCreateForm) => {
    setErrorMessage(null);
    if (isSellRestricted) {
      setErrorMessage('Tài khoản của bạn đang bị giới hạn quyền bán hàng.');
      return;
    }

    createMutation.mutate(
      {
        ...data,
        listing_type: 'FIXED_PRICE',
      },
      {
        onSuccess: (newProduct) => {
          setCreatedProductId(newProduct.product_id);
        },
        onError: (err) => {
          setErrorMessage(getApiErrorMessage(err, 'Không thể tạo tin đăng. Vui lòng kiểm tra lại.'));
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

        <span className="text-xs font-bold text-brand-burgundy uppercase tracking-wider">
          {createdProductId ? 'Bước 2 / 2: Tải ảnh' : 'Bước 1 / 2: Thông tin'}
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-brand-text flex items-center gap-2">
          <PackagePlus className="h-6 w-6 text-brand-burgundy" />
          Đăng tin bán sản phẩm
        </h1>
        <p className="text-xs sm:text-sm text-brand-text-secondary">
          Chia sẻ sách giáo trình, đồ điện tử hoặc vật dụng sinh viên tới cộng đồng PTITers.
        </p>
      </div>

      {isSellRestricted && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Tài khoản của bạn đang bị giới hạn quyền bán hàng. Bạn không thể đăng bán sản phẩm mới lúc này.</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!createdProductId ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card">
          <ProductForm
            mode="create"
            onSubmit={handleCreateSubmit}
            isSubmitting={createMutation.isPending || isSellRestricted}
            submitLabel={
              isSellRestricted
                ? 'Tài khoản bị giới hạn bán hàng'
                : createMutation.isPending
                ? 'Đang tạo tin...'
                : 'Tiếp tục: Tải ảnh sản phẩm'
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Tin đăng đã được tạo thành công!</span>
              <span>Hãy thêm hình ảnh để sản phẩm của bạn thu hút người mua hơn nhé.</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card">
            <ProductImageManager
              productId={createdProductId}
              images={createdProduct?.images || []}
              onImagesChange={() => refetchCreatedProduct()}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/products/${createdProductId}`)}
              className="btn-interactive flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-burgundy py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-brand-burgundy-dark"
            >
              <Eye className="h-4 w-4" /> Xem tin vừa đăng
            </button>

            <button
              type="button"
              onClick={() => navigate('/my-products')}
              className="btn-interactive flex-1 flex items-center justify-center gap-2 rounded-2xl border border-brand-border bg-white py-3.5 text-xs sm:text-sm font-bold text-brand-text-secondary hover:bg-brand-soft-pink"
            >
              Quản lý tin của tôi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
