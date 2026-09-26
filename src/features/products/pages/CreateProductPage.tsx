import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProduct, useProduct, useSubmitProductReview } from '../hooks';
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
  Send,
  Clock,
  Sparkles,
} from 'lucide-react';

export function CreateProductPage() {
  const navigate = useNavigate();
  const createMutation = useCreateProduct();
  const submitReviewMutation = useSubmitProductReview();
  const { data: accessStatus } = useUserAccessStatus();
  const isSellRestricted = accessStatus?.can_sell === false;

  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

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

  const handleSubmitForReview = () => {
    if (!createdProductId) return;
    setErrorMessage(null);

    submitReviewMutation.mutate(createdProductId, {
      onSuccess: () => {
        setIsSubmittedSuccess(true);
      },
      onError: (err) => {
        setErrorMessage(getApiErrorMessage(err, 'Không thể gửi duyệt tin đăng. Vui lòng thử lại.'));
      },
    });
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
          {isSubmittedSuccess
            ? 'Hoàn thành'
            : createdProductId
            ? 'Bước 2 / 2: Ảnh sản phẩm (không bắt buộc) & Gửi duyệt'
            : 'Bước 1 / 2: Thông tin'}
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
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSubmittedSuccess ? (
        /* Section 53: Success State after Submit Review */
        <div className="p-6 sm:p-8 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card text-center space-y-4 animate-in fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
            <Clock className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-brand-text">
              Tin đăng đã được gửi kiểm duyệt
            </h2>
            <p className="text-xs sm:text-sm text-brand-text-secondary max-w-md mx-auto">
              Bạn sẽ nhận được thông báo khi tin được quản trị viên duyệt. Trong thời gian này, bạn có thể quản lý hoặc xem lại bản nháp trong danh sách tin đăng của mình.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/my-products')}
              className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-burgundy px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-brand-burgundy-dark cursor-pointer"
            >
              <span>Xem danh sách tin của tôi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatedProductId(null);
                setIsSubmittedSuccess(false);
              }}
              className="btn-interactive w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-border bg-white px-6 py-3 text-xs sm:text-sm font-bold text-brand-text-secondary hover:bg-brand-soft-pink cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Đăng thêm tin khác</span>
            </button>
          </div>
        </div>
      ) : !createdProductId ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card">
          <ProductForm
            mode="create"
            onSubmit={handleCreateSubmit}
            isSubmitting={createMutation.isPending || isSellRestricted}
            submitLabel={
              isSellRestricted
                ? 'Tài khoản bị giới hạn bán hàng'
                : createMutation.isPending
                ? 'Đang lưu thông tin...'
                : 'Tiếp tục: Tải ảnh sản phẩm'
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-stone-100/90 border border-stone-200 flex items-center gap-2.5 text-xs text-stone-700">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Thông tin đã lưu thành bản nháp!</span>
              <span>Bạn có thể tải thêm ảnh hoặc gửi kiểm duyệt trực tiếp ngay bây giờ.</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-brand-warm-white border border-brand-border shadow-card">
            <ProductImageManager
              productId={createdProductId}
              images={createdProduct?.images || []}
              onImagesChange={() => refetchCreatedProduct()}
            />
          </div>

          {/* Section 53: Final action is Gửi duyệt tin đăng */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={submitReviewMutation.isPending}
              className="btn-interactive w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-brand-burgundy py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-brand-burgundy-dark cursor-pointer disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{submitReviewMutation.isPending ? 'Đang gửi duyệt...' : 'Gửi duyệt tin đăng'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/my-products')}
              className="btn-interactive w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl border border-brand-border bg-white py-3.5 text-xs sm:text-sm font-bold text-brand-text-secondary hover:bg-brand-soft-pink cursor-pointer"
            >
              <span>Lưu nháp & để sau</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
