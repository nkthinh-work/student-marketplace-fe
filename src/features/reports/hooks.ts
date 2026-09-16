import { useMutation } from '@tanstack/react-query';
import { createReport } from './api';
import type { CreateReportRequest, ReportResponse } from './types';

export function useCreateReport() {
  return useMutation<ReportResponse, Error, CreateReportRequest>({
    mutationFn: (data: CreateReportRequest) => createReport(data),
  });
}
