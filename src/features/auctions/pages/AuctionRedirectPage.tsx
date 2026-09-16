import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, HelpCircle } from 'lucide-react';
import { useAuctionDetail } from '../hooks';

export const AuctionRedirectPage: React.FC = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const parsedAuctionId = auctionId ? Number(auctionId) : 0;
  const isValidId = !isNaN(parsedAuctionId) && parsedAuctionId > 0;

  const { data: auction, isLoading, isError } = useAuctionDetail(parsedAuctionId, {
    enabled: isValidId,
  });

  useEffect(() => {
    if (auction?.product_id) {
      // Use replace: true so the redirect does not stay in history,
      // avoiding back-button redirect loops.
      navigate(`/products/${auction.product_id}`, { replace: true });
    }
  }, [auction?.product_id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-burgundy mb-3" />
        <p className="text-sm text-brand-text-muted">Đang chuyển hướng đến sản phẩm đấu giá...</p>
      </div>
    );
  }

  if (!isValidId || isError) {
    return (
      <div className="min-h-[60vh] max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-border">
          <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-brand-text mb-1">
            Không tìm thấy phiên đấu giá
          </h2>
          <p className="text-xs text-brand-text-muted mb-6">
            Phiên đấu giá không tồn tại hoặc đã bị gỡ bỏ.
          </p>
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/', { replace: true });
              }
            }}
            className="px-5 py-2 bg-brand-burgundy text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-brand-burgundy-dark transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin text-brand-burgundy mb-3" />
      <p className="text-sm text-brand-text-muted">Đang chuyển hướng đến sản phẩm đấu giá...</p>
    </div>
  );
};
