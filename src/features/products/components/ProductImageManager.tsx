import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProductImageResponse } from '../types';
import {
  useDeleteProductImage,
  useSetThumbnail,
  useReorderImages,
  productKeys,
} from '../hooks';
import { uploadProductImage } from '../api';
import {
  Upload,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface UploadingQueueItem {
  tempId: string;
  file: File;
  previewUrl: string;
  status: 'queued' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface ProductImageManagerProps {
  productId: number;
  images: ProductImageResponse[];
  onImagesChange?: () => void;
}

export function ProductImageManager({
  productId,
  images,
  onImagesChange,
}: ProductImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadingQueueItem[]>([]);
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const deleteMutation = useDeleteProductImage(productId);
  const setThumbnailMutation = useSetThumbnail(productId);
  const reorderMutation = useReorderImages(productId);

  // Thu hồi object URL khi component unmount
  useEffect(() => {
    return () => {
      uploadQueue.forEach((item) => {
        if (item.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [uploadQueue]);

  // Upload một file đơn lẻ lên server
  const uploadSingleFile = useCallback(
    async (item: UploadingQueueItem) => {
      try {
        await uploadProductImage(productId, item.file);

        if (item.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }

        setUploadQueue((prev) =>
          prev.map((i) =>
            i.tempId === item.tempId
              ? { ...i, status: 'success', errorMessage: undefined }
              : i,
          ),
        );

        // Làm mới cache chi tiết sản phẩm và danh sách tin của seller
        queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
        queryClient.invalidateQueries({ queryKey: productKeys.myLists() });
        queryClient.invalidateQueries({ queryKey: productKeys.publicLists() });

        onImagesChange?.();
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || 'Upload ảnh thất bại. Vui lòng thử lại.';

        setUploadQueue((prev) =>
          prev.map((i) =>
            i.tempId === item.tempId
              ? { ...i, status: 'error', errorMessage: errorMsg }
              : i,
          ),
        );
      } finally {
        activeUploadsRef.current.delete(item.tempId);
      }
    },
    [productId, queryClient, onImagesChange],
  );

  // Điều phối hàng đợi tải lên song song với giới hạn concurrency = 2
  useEffect(() => {
    if (!productId || isNaN(productId)) return;

    const queuedItems = uploadQueue.filter(
      (item) => item.status === 'queued' && !activeUploadsRef.current.has(item.tempId),
    );
    const uploadingCount = uploadQueue.filter(
      (item) => item.status === 'uploading' || activeUploadsRef.current.has(item.tempId),
    ).length;

    const availableSlots = 2 - uploadingCount;
    if (availableSlots > 0 && queuedItems.length > 0) {
      const itemsToUpload = queuedItems.slice(0, availableSlots);

      // Đánh dấu vào activeUploadsRef ngay để chống duplicate dispatch
      itemsToUpload.forEach((item) => {
        activeUploadsRef.current.add(item.tempId);
      });

      // Cập nhật trạng thái uploading trên UI
      setUploadQueue((prev) =>
        prev.map((item) =>
          itemsToUpload.some((target) => target.tempId === item.tempId)
            ? { ...item, status: 'uploading' }
            : item,
        ),
      );

      // Thực thi upload cho từng item trong batch
      itemsToUpload.forEach((item) => {
        uploadSingleFile(item);
      });
    }
  }, [uploadQueue, productId, uploadSingleFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems: UploadingQueueItem[] = [];

    files.forEach((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`File "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" vượt quá kích thước 10MB.`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        tempId: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        status: 'queued',
      });
    });

    setUploadQueue((prev) => [...prev, ...newItems]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = (tempId: string) => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.tempId === tempId
          ? { ...item, status: 'queued', errorMessage: undefined }
          : item,
      ),
    );
  };

  const handleRemoveQueueItem = (tempId: string) => {
    setUploadQueue((prev) => {
      const item = prev.find((i) => i.tempId === tempId);
      if (item?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.tempId !== tempId);
    });
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
    const itemA = sorted[index];
    const itemB = sorted[targetIndex];
    if (!itemA || !itemB) return;

    const reorderPayload = {
      images: sorted.map((img, idx) => {
        if (idx === index) return { image_id: itemB.image_id, sort_order: idx };
        if (idx === targetIndex) return { image_id: itemA.image_id, sort_order: idx };
        return { image_id: img.image_id, sort_order: idx };
      }),
    };

    reorderMutation.mutate(reorderPayload, {
      onSuccess: () => onImagesChange?.(),
    });
  };

  const handleSetThumbnail = (imageId: number) => {
    setThumbnailMutation.mutate(imageId, {
      onSuccess: () => onImagesChange?.(),
    });
  };

  const handleDeleteImage = (imageId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

    deleteMutation.mutate(imageId, {
      onSuccess: () => onImagesChange?.(),
    });
  };

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      {/* Upload Action Button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-brand-text">Hình ảnh sản phẩm</h4>
          <p className="text-xs text-brand-text-muted">
            Tải lên hình ảnh rõ nét (định dạng JPG, PNG, WEBP, tối đa 10MB/ảnh)
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-interactive flex items-center gap-1.5 rounded-xl bg-brand-burgundy px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-burgundy-dark"
        >
          <Upload className="h-4 w-4" />
          <span>Thêm ảnh</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Upload Queue Progress */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-brand-soft-pink/40 p-3 border border-brand-border/60">
          <span className="text-xs font-bold text-brand-text block mb-1">
            Đang xử lý tải lên ({uploadQueue.filter((i) => i.status === 'success').length}/
            {uploadQueue.length})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {uploadQueue.map((item) => (
              <div
                key={item.tempId}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-brand-border/80 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-9 w-9 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 truncate">
                    <span className="font-semibold block truncate">{item.file.name}</span>
                    {item.status === 'queued' && (
                      <span className="text-brand-text-muted text-[10px]">Đang chờ...</span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="text-brand-burgundy text-[10px] font-semibold flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Đang tải...
                      </span>
                    )}
                    {item.status === 'success' && (
                      <span className="text-emerald-600 text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Thành công
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-red-600 text-[10px] font-semibold flex items-center gap-1 truncate">
                        <AlertCircle className="h-3 w-3 shrink-0" /> {item.errorMessage}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.status === 'error' && (
                    <button
                      type="button"
                      onClick={() => handleRetry(item.tempId)}
                      className="p-1 text-brand-burgundy hover:bg-brand-soft-pink rounded-md"
                      title="Thử lại"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveQueueItem(item.tempId)}
                    className="p-1 text-brand-text-muted hover:text-brand-price rounded-md"
                    title="Hủy"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Uploaded Images Grid */}
      {sortedImages.length === 0 && uploadQueue.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-brand-border bg-brand-warm-white/60 hover:bg-brand-soft-pink/30 cursor-pointer transition-colors text-center"
        >
          <ImageIcon className="h-10 w-10 text-brand-text-muted mb-2 stroke-1" />
          <p className="text-xs sm:text-sm font-semibold text-brand-text">
            Chưa có ảnh nào được tải lên
          </p>
          <p className="text-xs text-brand-text-muted mt-1">
            Bấm vào đây hoặc nút &quot;Thêm ảnh&quot; để chọn ảnh sản phẩm
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sortedImages.map((img, idx) => (
            <div
              key={img.image_id}
              className={`relative flex flex-col rounded-2xl overflow-hidden bg-brand-warm-white border ${
                img.is_thumbnail
                  ? 'border-brand-burgundy ring-2 ring-brand-burgundy/20'
                  : 'border-brand-border'
              } shadow-xs`}
            >
              {/* Image Preview */}
              <div className="relative aspect-[4/3] w-full bg-brand-soft-pink">
                <img
                  src={img.image_url}
                  alt={`Ảnh ${idx + 1}`}
                  className="h-full w-full object-cover"
                />

                {/* Thumbnail Tag */}
                {img.is_thumbnail && (
                  <span className="absolute top-2 left-2 rounded-md bg-brand-burgundy text-white px-2 py-0.5 text-[10px] font-bold shadow-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-brand-gold text-brand-gold" /> Ảnh chính
                  </span>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.image_id)}
                  disabled={deleteMutation.isPending}
                  className="icon-btn-interactive absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-brand-price hover:bg-red-50 shadow-sm"
                  title="Xóa ảnh"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between p-2 bg-white text-xs border-t border-brand-border/60">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'left')}
                    disabled={idx === 0 || reorderMutation.isPending}
                    className="p-1 rounded-md border border-brand-border hover:bg-brand-soft-pink disabled:opacity-30 disabled:pointer-events-none"
                    title="Chuyển sang trái"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'right')}
                    disabled={idx === sortedImages.length - 1 || reorderMutation.isPending}
                    className="p-1 rounded-md border border-brand-border hover:bg-brand-soft-pink disabled:opacity-30 disabled:pointer-events-none"
                    title="Chuyển sang phải"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Set Thumbnail Button */}
                {!img.is_thumbnail && (
                  <button
                    type="button"
                    onClick={() => handleSetThumbnail(img.image_id)}
                    disabled={setThumbnailMutation.isPending}
                    className="text-[11px] font-semibold text-brand-burgundy hover:underline flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" /> Đặt làm chính
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
