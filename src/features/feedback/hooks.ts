import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminSupportContribution,
  createSupportClaim,
  deleteAdminFeedback,
  deleteAdminSupportContribution,
  deleteMyFeedback,
  getAdminFeedbackDetail,
  getAdminFeedbacks,
  getAdminSupportClaims,
  getAdminSupportContributions,
  getMyFeedbacks,
  getMySupportClaims,
  getPublicFeedbacks,
  getSupportInfo,
  getSupporterLeaderboard,
  rejectAdminSupportClaim,
  submitFeedback,
  updateAdminSupportContributionVisibility,
  verifyAdminSupportClaim,
} from './api';
import type {
  AdminSupportContributionCreatePayload,
  AdminSupportContributionVisibilityPayload,
  AdminSupportClaimRejectPayload,
  AdminSupportClaimVerifyPayload,
  SupportClaimCreatePayload,
} from './types';

export const feedbackKeys = {
  all: ['feedback'] as const,
  public: () => [...feedbackKeys.all, 'public'] as const,
  publicList: (params?: { limit?: number; cursor?: string }) =>
    [...feedbackKeys.public(), 'list', params] as const,
  me: () => [...feedbackKeys.all, 'me'] as const,
  support: () => [...feedbackKeys.all, 'support'] as const,
  leaderboard: () => [...feedbackKeys.all, 'leaderboard'] as const,
  admin: () => [...feedbackKeys.all, 'admin'] as const,
  adminList: (params?: { limit?: number; cursor?: string }) =>
    [...feedbackKeys.admin(), 'list', params] as const,
  adminDetail: (feedbackId: number) =>
    [...feedbackKeys.admin(), 'detail', feedbackId] as const,
  supportContributions: () => [...feedbackKeys.all, 'supportContributions'] as const,
  supportContributionsList: (params?: { limit?: number; cursor?: string }) =>
    [...feedbackKeys.supportContributions(), 'list', params] as const,
  supportClaims: () => [...feedbackKeys.all, 'supportClaims'] as const,
  mySupportClaims: () => [...feedbackKeys.supportClaims(), 'me'] as const,
  adminSupportClaims: () => [...feedbackKeys.admin(), 'supportClaims'] as const,
  adminSupportClaimsList: (params?: { status?: string; limit?: number; cursor?: string }) =>
    [...feedbackKeys.adminSupportClaims(), 'list', params] as const,
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

export function useSupporterLeaderboard() {
  return useQuery({
    queryKey: feedbackKeys.leaderboard(),
    queryFn: getSupporterLeaderboard,
    staleTime: 1000 * 60 * 5, // 5 minutes (contributions change rarely)
  });
}

export function useAdminSupportContributions(params?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: feedbackKeys.supportContributionsList(params),
    queryFn: () => getAdminSupportContributions(params),
  });
}

export function useCreateAdminSupportContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminSupportContributionCreatePayload) =>
      createAdminSupportContribution(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.supportContributions() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.leaderboard() });
    },
  });
}

export function useUpdateAdminSupportContributionVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contributionId,
      payload,
    }: {
      contributionId: number;
      payload: AdminSupportContributionVisibilityPayload;
    }) => updateAdminSupportContributionVisibility(contributionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.supportContributions() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.leaderboard() });
    },
  });
}

export function useDeleteAdminSupportContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contributionId: number) => deleteAdminSupportContribution(contributionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.supportContributions() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.leaderboard() });
    },
  });
}

export function useMySupportClaims(enabled = true) {
  return useQuery({
    queryKey: feedbackKeys.mySupportClaims(),
    queryFn: () => getMySupportClaims(10),
    enabled,
    staleTime: 1000 * 15, // 15 seconds
  });
}

export function useCreateSupportClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupportClaimCreatePayload) => createSupportClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.mySupportClaims() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.adminSupportClaims() });
    },
  });
}

export function useAdminSupportClaims(params?: {
  status?: string;
  limit?: number;
  cursor?: string;
}) {
  return useQuery({
    queryKey: feedbackKeys.adminSupportClaimsList(params),
    queryFn: () => getAdminSupportClaims(params),
    staleTime: 1000 * 10,
  });
}

export function useVerifyAdminSupportClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      payload,
    }: {
      claimId: number;
      payload: AdminSupportClaimVerifyPayload;
    }) => verifyAdminSupportClaim(claimId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.adminSupportClaims() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.supportContributions() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.leaderboard() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.mySupportClaims() });
    },
  });
}

export function useRejectAdminSupportClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      payload,
    }: {
      claimId: number;
      payload: AdminSupportClaimRejectPayload;
    }) => rejectAdminSupportClaim(claimId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.adminSupportClaims() });
      queryClient.invalidateQueries({ queryKey: feedbackKeys.mySupportClaims() });
    },
  });
}
