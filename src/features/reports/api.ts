import { apiClient } from '@/services/apiClient';
import type {
  AdminEnforcementRequest,
  AdminReportDetailResponse,
  AdminReportFilters,
  AdminReportListResponse,
  CreateReportRequest,
  ReportEvidenceUploadResponse,
  ReportResponse,
  ReportStatus,
  SubjectReportHistoryResponse,
} from './types';

export async function createReport(data: CreateReportRequest): Promise<ReportResponse> {
  const response = await apiClient.post<ReportResponse>('/api/v1/reports', data);
  return response.data;
}

export async function uploadReportEvidence(
  reportId: number,
  files: File[]
): Promise<ReportEvidenceUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  const response = await apiClient.post<ReportEvidenceUploadResponse>(
    `/api/v1/reports/${reportId}/evidence`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

export async function getAdminReports(
  params?: AdminReportFilters
): Promise<AdminReportListResponse> {
  const response = await apiClient.get<AdminReportListResponse>('/api/v1/admin/reports', {
    params,
  });
  return response.data;
}

export async function getAdminReportDetail(
  reportId: number
): Promise<AdminReportDetailResponse> {
  const response = await apiClient.get<AdminReportDetailResponse>(
    `/api/v1/admin/reports/${reportId}`
  );
  return response.data;
}

export async function updateAdminReportStatus(
  reportId: number,
  status: ReportStatus
): Promise<AdminReportDetailResponse> {
  const response = await apiClient.patch<AdminReportDetailResponse>(
    `/api/v1/admin/reports/${reportId}/status`,
    { status }
  );
  return response.data;
}

export async function enforceAdminReportAction(
  reportId: number,
  data: AdminEnforcementRequest
): Promise<AdminReportDetailResponse> {
  const response = await apiClient.post<AdminReportDetailResponse>(
    `/api/v1/admin/reports/${reportId}/enforcement`,
    data
  );
  return response.data;
}

export async function getAdminReportEvidenceBlob(
  reportId: number,
  attachmentId: number,
  variant: 'thumbnail' | 'full',
  signal?: AbortSignal
): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    `/api/v1/admin/reports/${reportId}/evidence/${attachmentId}`,
    {
      params: { variant },
      responseType: 'blob',
      signal,
    }
  );
  return response.data;
}

export async function getAdminSubjectReportHistory(
  userId: number,
  params?: {
    limit?: number;
    cursor?: string;
    exclude_report_id?: number;
  },
  signal?: AbortSignal
): Promise<SubjectReportHistoryResponse> {
  const response = await apiClient.get<SubjectReportHistoryResponse>(
    `/api/v1/admin/users/${userId}/report-history`,
    {
      params,
      signal,
    }
  );
  return response.data;
}

