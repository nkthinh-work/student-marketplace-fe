import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createReport,
  enforceAdminReportAction,
  getAdminReportDetail,
  getAdminReports,
  getAdminSubjectReportHistory,
  updateAdminReportStatus,
  uploadReportEvidence,
} from './api';
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
import { productKeys } from '@/features/products/hooks';
import { publicUserProfileQueryKey } from '@/features/users/hooks';

export const adminReportKeys = {
  all: ['admin', 'reports'] as const,
  lists: () => [...adminReportKeys.all, 'list'] as const,
  list: (filters: AdminReportFilters) => [...adminReportKeys.lists(), filters] as const,
  details: () => [...adminReportKeys.all, 'detail'] as const,
  detail: (id: number) => [...adminReportKeys.details(), id] as const,
};

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  reportHistory: (userId: number, excludeReportId?: number) =>
    [...adminUserKeys.all, userId, 'report-history', { excludeReportId }] as const,
};

export function useCreateReport() {
  return useMutation<ReportResponse, Error, CreateReportRequest>({
    mutationFn: (data: CreateReportRequest) => createReport(data),
  });
}

export function useUploadReportEvidence() {
  return useMutation<
    ReportEvidenceUploadResponse,
    Error,
    { reportId: number; files: File[] }
  >({
    mutationFn: ({ reportId, files }) => uploadReportEvidence(reportId, files),
  });
}

export function useAdminReports(filters: AdminReportFilters = {}) {
  return useInfiniteQuery<AdminReportListResponse, Error>({
    queryKey: adminReportKeys.list(filters),
    queryFn: ({ pageParam }) =>
      getAdminReports({
        ...filters,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: undefined,
  });
}

export function useAdminReportDetail(reportId: number) {
  return useQuery<AdminReportDetailResponse, Error>({
    queryKey: adminReportKeys.detail(reportId),
    queryFn: () => getAdminReportDetail(reportId),
    enabled: reportId > 0,
  });
}

export function useAdminSubjectReportHistory(
  userId: number,
  excludeReportId?: number,
  limit = 5
) {
  return useInfiniteQuery<SubjectReportHistoryResponse, Error>({
    queryKey: adminUserKeys.reportHistory(userId, excludeReportId),
    queryFn: ({ pageParam }) =>
      getAdminSubjectReportHistory(userId, {
        limit,
        cursor: pageParam as string | undefined,
        exclude_report_id: excludeReportId,
      }),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: undefined,
    enabled: userId > 0,
  });
}

export function useUpdateAdminReportStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminReportDetailResponse,
    Error,
    { reportId: number; status: ReportStatus }
  >({
    mutationFn: ({ reportId, status }) =>
      updateAdminReportStatus(reportId, status),
    onSuccess: (data) => {
      queryClient.setQueryData(adminReportKeys.detail(data.report_id), data);
      queryClient.invalidateQueries({ queryKey: adminReportKeys.all });
      if (data.reported_subject?.user_id) {
        queryClient.invalidateQueries({
          queryKey: adminUserKeys.reportHistory(data.reported_subject.user_id),
        });
      }
    },
  });
}

export function useEnforceAdminReportAction() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminReportDetailResponse,
    Error,
    { reportId: number; data: AdminEnforcementRequest }
  >({
    mutationFn: ({ reportId, data }) =>
      enforceAdminReportAction(reportId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(adminReportKeys.detail(data.report_id), data);
      queryClient.invalidateQueries({ queryKey: adminReportKeys.lists() });
      if (data.reported_subject?.user_id) {
        queryClient.invalidateQueries({
          queryKey: adminUserKeys.reportHistory(data.reported_subject.user_id),
        });
        queryClient.invalidateQueries({
          queryKey: publicUserProfileQueryKey(data.reported_subject.user_id),
        });
      } else if (data.target_type === 'USER' && data.target_id) {
        queryClient.invalidateQueries({
          queryKey: publicUserProfileQueryKey(data.target_id),
        });
      }
      if (data.target_type === 'PRODUCT' && data.target_id) {
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(data.target_id),
        });
        queryClient.invalidateQueries({
          queryKey: productKeys.publicLists(),
        });
        queryClient.invalidateQueries({
          queryKey: productKeys.myLists(),
        });
      }
    },
  });
}

