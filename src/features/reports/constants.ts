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
  PRODUCT: 'sản phẩm',
  ORDER: 'đơn hàng',
};
