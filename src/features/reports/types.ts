export type ReportTargetType = 'USER' | 'PRODUCT' | 'ORDER';

export type ReportReason =
  | 'SCAM'
  | 'FAKE_ITEM'
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'NO_SHOW'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';

export interface CreateReportRequest {
  target_type: ReportTargetType;
  target_id: number;
  reason: ReportReason;
  description?: string | null;
}

export interface ReportResponse {
  report_id: number;
  target_type: ReportTargetType;
  target_id: number;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  created_at: string;
}
