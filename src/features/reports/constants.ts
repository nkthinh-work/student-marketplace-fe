import type { ReportReason, ReportTargetType } from './types';

export const REPORT_REASON_MATRIX: Record<ReportTargetType, ReportReason[]> = {
  USER: ['SCAM', 'SPAM', 'INAPPROPRIATE', 'OTHER'],
  PRODUCT: ['SCAM', 'FAKE_ITEM', 'SPAM', 'INAPPROPRIATE', 'OTHER'],
  ORDER: ['SCAM', 'FAKE_ITEM', 'SPAM', 'INAPPROPRIATE', 'NO_SHOW', 'OTHER'],
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SCAM: 'Lừa đảo / Gian lận',
  FAKE_ITEM: 'Hàng giả / Sai mô tả',
  SPAM: 'Spam / Quấy rối',
  INAPPROPRIATE: 'Nội dung phản cảm / Không phù hợp',
  NO_SHOW: 'Bùng hẹn / Không đến điểm hẹn',
  OTHER: 'Lý do khác',
};

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  USER: 'người dùng',
  PRODUCT: 'tin đăng',
  ORDER: 'giao dịch',
};

export const ADMIN_REPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Chờ xử lý',
  REVIEWING: 'Chờ xử lý',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Đã bỏ qua',
  COMPLETED: 'Đã xử lý',
};

export const REPORT_WORKFLOW_LABELS: Record<string, string> = {
  OPEN: 'Chờ xử lý',
  REVIEWING: 'Chờ xử lý',
  COMPLETED: 'Đã xử lý',
};

export const REPORT_CONCLUSION_LABELS: Record<string, string> = {
  SUPPORTED: 'Có căn cứ',
  INSUFFICIENT_EVIDENCE: 'Không đủ căn cứ',
};

export const MODERATION_ACTION_OPTION_LABELS = {
  START_REVIEW: 'Bắt đầu xem xét',
  CONFIRM_SUPPORTED: 'Xác nhận có căn cứ',
  MARK_INSUFFICIENT_EVIDENCE: 'Bỏ qua báo cáo',
} as const;

export const ADMIN_REPORT_ACTION_LABELS = {
  START_REVIEW: 'Bắt đầu xem xét',
  RESOLVE: 'Xác nhận có căn cứ',
  REJECT: 'Bỏ qua',
} as const;

export const ADMIN_REPORT_STATUS_BADGES: Record<
  string,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  OPEN: {
    label: 'Cần xử lý',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
  },
  REVIEWING: {
    label: 'Cần xử lý',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
  },
  RESOLVED: {
    label: 'Đã xử lý',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
  },
  REJECTED: {
    label: 'Đã bỏ qua',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
  },
  COMPLETED: {
    label: 'Đã xử lý',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
  },
};

export const REPORT_CONCLUSION_BADGES: Record<
  string,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  SUPPORTED: {
    label: 'Có căn cứ',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-200',
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'Đã bỏ qua',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
  },
};

export const ADMIN_TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  USER: 'Người dùng',
  PRODUCT: 'Tin đăng',
  ORDER: 'Giao dịch',
};

export const ADMIN_TARGET_TYPE_BADGES: Record<
  ReportTargetType,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  USER: {
    label: 'Người dùng',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-200',
  },
  PRODUCT: {
    label: 'Tin đăng',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200',
  },
  ORDER: {
    label: 'Giao dịch',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
  },
};

export const TARGET_USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  BANNED: 'Đã khóa',
  INACTIVE: 'Ngừng hoạt động',
};

export const TARGET_PRODUCT_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Đang hiển thị',
  HIDDEN: 'Đã ẩn',
  SOLD_OUT: 'Đã bán hết',
};

export const TARGET_PRODUCT_MODERATION_LABELS: Record<string, string> = {
  CLEAR: 'Bình thường',
  BLOCKED: 'Đã bị ẩn',
};

export const TARGET_ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

export const MODERATION_ACTION_LABELS: Record<string, string> = {
  USER_BAN: 'Khóa tài khoản',
  USER_UNBAN: 'Mở khóa tài khoản',
  PRODUCT_HIDE: 'Ẩn tin đăng',
  PRODUCT_RESTORE: 'Hiện lại tin đăng',
  BUY_RESTRICT: 'Hạn chế quyền mua',
  BUY_RESTORE: 'Gỡ hạn chế quyền mua',
  SELL_RESTRICT: 'Hạn chế quyền bán',
  SELL_RESTORE: 'Gỡ hạn chế quyền bán',
};

