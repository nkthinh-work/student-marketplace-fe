import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTutorial,
  deleteTutorial,
  getAdminTutorials,
  getPublicTutorials,
  reorderTutorials,
  replaceTutorialVideo,
  updateTutorialMetadata,
} from './api';
import type {
  AdminTutorialReorderPayload,
  AdminTutorialUpdatePayload,
} from './types';

export const TUTORIALS_QUERY_KEY = {
  public: ['tutorials', 'public'] as const,
  admin: (featureKey?: string) => ['tutorials', 'admin', featureKey || 'all'] as const,
};

export function usePublicTutorials() {
  return useQuery({
    queryKey: TUTORIALS_QUERY_KEY.public,
    queryFn: getPublicTutorials,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

export function useAdminTutorials(featureKey?: string) {
  return useQuery({
    queryKey: TUTORIALS_QUERY_KEY.admin(featureKey),
    queryFn: () => getAdminTutorials(featureKey),
  });
}

export function useCreateTutorial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createTutorial(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
}

export function useUpdateTutorialMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tutorialId,
      payload,
    }: {
      tutorialId: number;
      payload: AdminTutorialUpdatePayload;
    }) => updateTutorialMetadata(tutorialId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
}

export function useReplaceTutorialVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tutorialId,
      videoFile,
    }: {
      tutorialId: number;
      videoFile: File;
    }) => replaceTutorialVideo(tutorialId, videoFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
}

export function useReorderTutorials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminTutorialReorderPayload) => reorderTutorials(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
}

export function useDeleteTutorial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tutorialId: number) => deleteTutorial(tutorialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
    },
  });
}
