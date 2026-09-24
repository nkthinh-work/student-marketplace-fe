import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  approveCommunityMoment,
  deleteAdminCommunityMoment,
  getAdminCommunityMomentDetail,
  getAdminCommunityMoments,
  getPublicHeroMoments,
  rejectCommunityMoment,
  submitCommunityMoment,
} from './api';
import type {
  AdminCommunityMomentCursorPage,
  AdminCommunityMomentItem,
  CommunityMomentStatus,
  PublicHeroResponse,
} from './types';

export const communityMomentKeys = {
  all: ['communityMoments'] as const,
  hero: () => [...communityMomentKeys.all, 'hero'] as const,
  adminAll: () => [...communityMomentKeys.all, 'admin'] as const,
  adminList: (status?: CommunityMomentStatus) =>
    [...communityMomentKeys.adminAll(), 'list', status] as const,
  adminDetail: (id: number) =>
    [...communityMomentKeys.adminAll(), 'detail', id] as const,
};

export function useCommunityHeroMoments() {
  return useQuery<PublicHeroResponse>({
    queryKey: communityMomentKeys.hero(),
    queryFn: getPublicHeroMoments,
    staleTime: 60 * 1000, // 1 minute fresh
    retry: 1,
  });
}

export function useSubmitCommunityMoment() {
  return useMutation({
    mutationFn: ({ file, note }: { file: File; note: string }) =>
      submitCommunityMoment(file, note),
    onSuccess: () => {
      // Do not optimistically inject into Hero. Hero only reflects approved content.
    },
  });
}

export function useAdminCommunityMoments(status?: CommunityMomentStatus) {
  return useInfiniteQuery<AdminCommunityMomentCursorPage>({
    queryKey: communityMomentKeys.adminList(status),
    queryFn: ({ pageParam }) =>
      getAdminCommunityMoments({
        status,
        cursor: pageParam as string | undefined,
        limit: 20,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useAdminCommunityMomentDetail(momentId: number | null) {
  return useQuery<AdminCommunityMomentItem>({
    queryKey: momentId ? communityMomentKeys.adminDetail(momentId) : ['moment', 'none'],
    queryFn: () => getAdminCommunityMomentDetail(momentId!),
    enabled: Boolean(momentId),
  });
}

export function useApproveCommunityMoment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (momentId: number) => approveCommunityMoment(momentId),
    onSuccess: () => {
      // Invalidate both admin lists (PENDING, APPROVED) and detail
      queryClient.invalidateQueries({ queryKey: communityMomentKeys.adminAll() });
      // Invalidate public hero query so returning Home immediately observes the newly-approved image
      queryClient.invalidateQueries({ queryKey: communityMomentKeys.hero() });
    },
  });
}

export function useRejectCommunityMoment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (momentId: number) => rejectCommunityMoment(momentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityMomentKeys.adminAll() });
    },
  });
}

export function useDeleteAdminCommunityMoment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (momentId: number) => deleteAdminCommunityMoment(momentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityMomentKeys.adminAll() });
      queryClient.invalidateQueries({ queryKey: communityMomentKeys.hero() });
    },
  });
}
