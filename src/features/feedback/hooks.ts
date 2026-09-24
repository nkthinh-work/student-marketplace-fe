import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteAdminFeedback,
  deleteMyFeedback,
  getAdminFeedbackDetail,
  getAdminFeedbacks,
  getMyFeedbacks,
  getPublicFeedbacks,
  getSupportInfo,
  submitFeedback,
} from './api';

export const feedbackKeys = {
  all: ['feedback'] as const,
  public: () => [...feedbackKeys.all, 'public'] as const,
  publicList: (params?: { limit?: number; cursor?: string }) =>
    [...feedbackKeys.public(), 'list', params] as const,
  me: () => [...feedbackKeys.all, 'me'] as const,
  support: () => [...feedbackKeys.all, 'support'] as const,
  admin: () => [...feedbackKeys.all, 'admin'] as const,
  adminList: (params?: { limit?: number; cursor?: string }) =>
    [...feedbackKeys.admin(), 'list', params] as const,
  adminDetail: (feedbackId: number) =>
    [...feedbackKeys.admin(), 'detail', feedbackId] as const,
};

export function usePublicFeedbacks(params?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: feedbackKeys.publicList(params),
    queryFn: () => getPublicFeedbacks(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useMyFeedbacks(enabled = true) {
  return useQuery({
    queryKey: feedbackKeys.me(),
    queryFn: () => getMyFeedbacks(),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => submitFeedback(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.public() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.me() });
    },
  });
}

export function useDeleteMyFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedbackId: number) => deleteMyFeedback(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.public() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.me() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.admin() });
    },
  });
}

export function useSupportInfo() {
  return useQuery({
    queryKey: feedbackKeys.support(),
    queryFn: getSupportInfo,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useAdminFeedbacks(params?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: feedbackKeys.adminList(params),
    queryFn: () => getAdminFeedbacks(params),
  });
}

export function useAdminFeedbackDetail(feedbackId: number, enabled = true) {
  return useQuery({
    queryKey: feedbackKeys.adminDetail(feedbackId),
    queryFn: () => getAdminFeedbackDetail(feedbackId),
    enabled: enabled && feedbackId > 0,
  });
}

export function useDeleteAdminFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (feedbackId: number) => deleteAdminFeedback(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.public() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.me() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.admin() });
    },
  });
}
