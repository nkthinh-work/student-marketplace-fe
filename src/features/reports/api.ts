import { apiClient } from '@/services/apiClient';
import type { CreateReportRequest, ReportResponse } from './types';

export async function createReport(data: CreateReportRequest): Promise<ReportResponse> {
  const response = await apiClient.post<ReportResponse>('/api/v1/reports', data);
  return response.data;
}
