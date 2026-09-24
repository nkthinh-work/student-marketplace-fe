import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart, QrCode, X, ZoomIn } from 'lucide-react';
import type { SupportResponse } from '../types';

interface VietQRSupportCardProps {
  support?: SupportResponse | null;
  isLoading?: boolean;
}

const DEFAULT_FIXED_QR_URL = '/support/nguyen-khac-thinh-vietqr.png';

export const VietQRSupportCard: React.FC<VietQRSupportCardProps> = ({
  support,
  isLoading = false,
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-xs animate-pulse space-y-3">
        <div className="h-4 bg-stone-200 rounded w-1/3" />
        <div className="h-48 bg-stone-100 rounded-xl" />
      </div>
    );
  }

  const qrUrl = support?.fixed_qr_url || DEFAULT_FIXED_QR_URL;
  const supportMessage = support?.support_message || 'Quan trọng là tấm lòng 💛';

  return (
    <>
      <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-burgundy">
            <Heart className="h-4 w-4 fill-brand-burgundy text-brand-burgundy" />
            <span>Ủng hộ dự án</span>
          </div>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full">
            {supportMessage}
          </span>
        </div>

        {/* Support Description */}
        <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
          Chợ PTITers là dự án cộng đồng phục vụ sinh viên Học viện. Nếu bạn thấy nền tảng hữu ích và muốn gửi chút tấm lòng để hỗ trợ duy trì máy chủ, bạn có thể quét mã VietQR bên dưới.
        </p>

        {/* QR Section */}
        <div className="flex flex-col items-center justify-center p-4 bg-brand-cream/30 rounded-2xl border border-brand-border/60">
          <div
            onClick={() => setIsZoomOpen(true)}
            className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white p-3 shadow-card border border-stone-200/80 transition-all hover:shadow-md hover:scale-[1.01]"
            title="Nhấn để phóng to mã QR"
          >
            {!imgError ? (
              <img
                src={qrUrl}
                alt="Mã VietQR ủng hộ"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl filter-none"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center">
                <QrCode className="h-10 w-10 text-brand-burgundy/40 mb-2" />
                <span className="text-xs font-semibold text-brand-text">Mã VietQR</span>
                <span className="text-[11px] text-brand-text-muted mt-1">{supportMessage}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-xs font-semibold text-brand-burgundy shadow-md">
                <ZoomIn className="h-3.5 w-3.5" /> Phóng to
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-text-muted">
            <QrCode className="h-4 w-4" />
            <span>Quét bằng bất kỳ ứng dụng ngân hàng hoặc ví điện tử</span>
          </div>
        </div>
      </div>

      {/* QR Zoom Modal */}
      {isZoomOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="fixed inset-0 cursor-default"
              onClick={() => setIsZoomOpen(false)}
              aria-label="Đóng"
            />

            <div className="relative z-10 max-w-sm w-full bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 flex flex-col items-center animate-in zoom-in-95 duration-150">
              <div className="w-full flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-burgundy uppercase">
                  <Heart className="h-4 w-4 fill-brand-burgundy" />
                  <span>Ủng hộ Chợ PTITers</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!imgError ? (
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                  <img
                    src={qrUrl}
                    alt="Mã VietQR phóng to"
                    className="w-72 h-72 sm:w-80 sm:h-80 object-contain rounded-xl filter-none"
                  />
                </div>
              ) : (
                <div className="w-72 h-72 sm:w-80 sm:h-80 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 text-center">
                  <QrCode className="h-12 w-12 text-brand-burgundy/40 mb-2" />
                  <span className="text-sm font-semibold text-brand-text">Mã VietQR</span>
                  <span className="text-xs text-brand-text-muted mt-1">{supportMessage}</span>
                </div>
              )}

              <p className="mt-3 text-xs text-center font-medium text-brand-text-secondary">
                {supportMessage}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
