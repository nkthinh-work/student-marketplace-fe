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
  target_id?: number;
  target_public_id?: string;
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

export interface ReporterSummary {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
}

export interface AdminHandlerSummary {
  user_id: number;
  full_name: string;
}

export interface ReportEvidenceMetadata {
  attachment_id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  media_type?: 'IMAGE' | 'VIDEO';
}

export interface ReportEvidenceUploadResponse {
  report_id: number;
  attachments: ReportEvidenceMetadata[];
}

export interface UserTargetSummary {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  status: string;
  role?: string;
}

export type ProductModerationStatus = 'CLEAR' | 'BLOCKED';

export interface ProductTargetSummary {
  product_id: number;
  title: string;
  seller?: AdminHandlerSummary | null;
  status: string;
  moderation_status: ProductModerationStatus;
  is_deleted: boolean;
}

export interface OrderTargetSummary {
  order_id: number;
  order_code: string;
  buyer?: AdminHandlerSummary | null;
  seller?: AdminHandlerSummary | null;
  status: string;
  total_amount?: number | null;
}

export interface AdminReportResponse {
  report_id: number;
  reporter_id: number;
  reporter?: ReporterSummary | null;
  target_type: ReportTargetType;
  target_id: number;
  target_available: boolean;
  target_summary?:
  | UserTargetSummary
  | ProductTargetSummary
  | OrderTargetSummary
  | Record<string, unknown>
  | null;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  workflow_state?: ReportWorkflowState;
  conclusion?: ReportConclusion | null;
  handled_by?: number | null;
  handler?: AdminHandlerSummary | null;
  handled_at?: string | null;
  created_at: string;
  evidence_count: number;
}

export type AdminReportQueueState = 'NEEDS_ACTION' | 'COMPLETED';
export type ReportWorkflowState = 'OPEN' | 'REVIEWING' | 'COMPLETED';
export type ReportConclusion = 'SUPPORTED' | 'INSUFFICIENT_EVIDENCE';
export type ModerationActionOption =
  | 'START_REVIEW'
  | 'CONFIRM_SUPPORTED'
  | 'MARK_INSUFFICIENT_EVIDENCE';

export type ModerationActionType =
  | 'USER_BAN'
  | 'USER_UNBAN'
  | 'PRODUCT_HIDE'
  | 'PRODUCT_RESTORE'
  | 'BUY_RESTRICT'
  | 'BUY_RESTORE'
  | 'SELL_RESTRICT'
  | 'SELL_RESTORE';

export interface ModerationActionSummary {
  moderation_action_id: number;
  action_type: ModerationActionType | string;
  previous_status: string;
  new_status: string;
  admin?: AdminHandlerSummary | null;
  created_at: string;
}

export interface AdminCapabilityRestrictionResponse {
  capability: 'BUY' | 'SELL' | string;
  expires_at?: string | null;
  restorable_from_current_report: boolean;
}

export interface ReportedSubjectSummary {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  role_in_order?: 'BUYER' | 'SELLER' | string | null;
  status: string;
  can_buy: boolean;
  can_sell: boolean;
  active_restrictions: AdminCapabilityRestrictionResponse[];
  prior_report_count?: number;
}

export interface SubjectReportHistoryEnforcementAction {
  action_type: ModerationActionType | string;
  previous_status: string;
  new_status: string;
}

export interface SubjectReportHistoryItem {
  report_id: number;
  target_type: ReportTargetType;
  reason: ReportReason;
  status: ReportStatus;
  created_at: string;
  handled_at?: string | null;
  evidence_count: number;
  enforcement_actions: SubjectReportHistoryEnforcementAction[];
}

export interface SubjectReportHistoryResponse {
  user_id: number;
  items: SubjectReportHistoryItem[];
  next_cursor?: string | null;
  has_more: boolean;
  total_count: number;
}

export interface AdminReportDetailResponse extends AdminReportResponse {
  evidence: ReportEvidenceMetadata[];
  enforcement_actions: ModerationActionSummary[];
  available_moderation_actions?: ModerationActionOption[];
  available_enforcement_actions: ModerationActionType[] | string[];
  reported_subject?: ReportedSubjectSummary | null;
}

export interface AdminReportListResponse {
  items: AdminReportResponse[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface AdminReportStatusUpdateRequest {
  status: ReportStatus;
}

export interface AdminEnforcementRequest {
  action: ModerationActionType | 'CAPABILITY_RESTRICT' | 'CAPABILITY_RESTORE';
  capabilities?: ('BUY' | 'SELL')[];
  duration_days?: 1 | 3 | 7 | 14;
}

export interface AdminReportFilters {
  queue_state?: AdminReportQueueState;
  status?: ReportStatus;
  workflow?: ReportWorkflowState;
  conclusion?: ReportConclusion;
  target_type?: ReportTargetType;
  cursor?: string;
  limit?: number;
}

