import type { ListingType, ProductStatus } from '@/features/products/types';

/**
 * Normalizes any wire price value (number, string, scientific notation e.g. "5.1E+5", Decimal string)
 * into a safe, valid integer VND number.
 */
export function normalizeMoney(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : Math.round(value);
  }
  const str = String(value).trim();
  if (!str) return 0;
  const parsed = Number(str);
  if (!isNaN(parsed) && isFinite(parsed)) {
    return Math.round(parsed);
  }
  const floatVal = parseFloat(str);
  return isNaN(floatVal) || !isFinite(floatVal) ? 0 : Math.round(floatVal);
}

/**
 * Formats a money amount into human-readable VND currency (e.g. "510.000 ₫").
 * Handles scientific notation, numbers, strings, and zero cleanly.
 */
export function formatVND(
  value: number | string | null | undefined,
  options?: { showFreeForZero?: boolean }
): string {
  const num = normalizeMoney(value);
  if (num === 0 && options?.showFreeForZero) return 'Miễn phí';
  if (num === 0) return '0 ₫';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a numeric value with thousands separator (e.g. "510.000") without currency symbol.
 * Useful for formatted number inputs.
 */
export function formatNumberVND(value: number | string | null | undefined): string {
  const num = normalizeMoney(value);
  if (num === 0) return '0';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Parses any server ISO datetime string into UTC epoch milliseconds.
 * If backend sends naive UTC string without 'Z' or timezone offset, appends 'Z'
 * to avoid browser interpreting it in local timezone.
 */
export function parseServerDateTime(isoString: string | null | undefined): number {
  if (!isoString) return 0;
  let normalized = String(isoString).trim();
  if (!normalized) return 0;
  if (!normalized.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(normalized)) {
    normalized += 'Z';
  }
  const time = new Date(normalized).getTime();
  return isNaN(time) ? 0 : time;
}

// Format chuỗi ISO datetime sang ngày/tháng/năm
export function formatDate(isoString: string): string {
  try {
    const timestamp = parseServerDateTime(isoString);
    if (!timestamp) return isoString;
    const date = new Date(timestamp);

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
