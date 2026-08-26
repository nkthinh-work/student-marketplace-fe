import type { ListingType, ProductStatus } from '@/features/products/types';

// Format số/chuỗi sang định dạng tiền tệ VND
export function formatVND(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0 ₫';
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return '0 ₫';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

// Format chuỗi ISO datetime sang ngày/tháng/năm
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

// Format thời gian tương đối (VD: "2 giờ trước", "Hôm qua")
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;

    return formatDate(isoString);
  } catch {
    return formatDate(isoString);
  }
}

// Label và style badge cho hình thức bán
export function getListingTypeMeta(type: ListingType): {
  label: string;
  isAuction: boolean;
  priceLabel: string;
  badgeClass: string;
} {
  if (type === 'AUCTION') {
    return {
      label: 'Đấu giá',
      isAuction: true,
      priceLabel: 'Giá khởi điểm',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    };
  }

  return {
    label: 'Giá cố định',
    isAuction: false,
    priceLabel: 'Giá',
    badgeClass: 'bg-brand-soft-pink text-brand-burgundy border-brand-burgundy/20',
  };
}

// Label và style badge cho trạng thái sản phẩm
export function getProductStatusMeta(status: ProductStatus): {
  label: string;
  bgClass: string;
  textClass: string;
} {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'Đang bán',
        bgClass: 'bg-emerald-50 border-emerald-200',
        textClass: 'text-emerald-700',
      };
    case 'HIDDEN':
      return {
        label: 'Đã ẩn',
        bgClass: 'bg-gray-100 border-gray-300',
        textClass: 'text-gray-600',
      };
    case 'SOLD_OUT':
      return {
        label: 'Đã bán',
        bgClass: 'bg-red-50 border-red-200',
        textClass: 'text-red-700',
      };
    default:
      return {
        label: status,
        bgClass: 'bg-gray-50 border-gray-200',
        textClass: 'text-gray-700',
      };
  }
}
