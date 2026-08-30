import React, { useState } from "react";
import { AlertCircle, FileUp, Loader2, UploadCloud, X } from "lucide-react";
import type { OrderDetailResponse } from "../types";
import { useUploadReceipt } from "../hooks";

interface UploadReceiptModalProps {
  order: OrderDetailResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const UploadReceiptModal: React.FC<UploadReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const uploadMutation = useUploadReceipt();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Chỉ hỗ trợ file ảnh định dạng JPEG, PNG, WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Kích thước file không được vượt quá 5MB.");
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Vui lòng chọn file ảnh biên nhận.");
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        orderId: order.order_id,
        file: selectedFile,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || "Không thể tải lên biên nhận, vui lòng thử lại."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-brand-warm-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-brand-border">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-brand-burgundy" />
            <h3 className="text-lg font-black text-brand-text">
              Tải lên biên nhận thanh toán
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-brand-text-muted hover:text-brand-text rounded-full hover:bg-brand-soft-pink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-3.5 pt-3.5">
          <p className="text-xs text-brand-text-secondary">
            Tải lên ảnh chụp màn hình giao dịch chuyển khoản cho đơn hàng{" "}
            <span className="font-mono font-bold text-brand-text">
              {order.order_code}
            </span>.
          </p>

          {/* File picker */}
          <div className="border-2 border-dashed border-brand-border rounded-2xl p-4 text-center hover:border-brand-burgundy bg-white transition-colors">
            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="max-h-48 mx-auto rounded-xl object-contain border border-brand-border/60"
                />
                <label className="text-xs font-bold text-brand-burgundy hover:underline cursor-pointer block">
                  Chọn ảnh khác
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <FileUp className="w-10 h-10 mx-auto text-brand-text-muted mb-2" />
                <span className="text-xs font-bold text-brand-text block mb-1">
                  Nhấn để chọn ảnh biên nhận
                </span>
                <span className="text-[11px] text-brand-text-muted block">
                  PNG, JPG, WEBP (Tối đa 5MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-interactive px-4 py-2 rounded-2xl border border-brand-border bg-white text-brand-text hover:bg-brand-soft-pink text-xs font-bold"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={!selectedFile || uploadMutation.isPending}
              className="btn-interactive px-5 py-2 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-bold shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {uploadMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Tải lên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
