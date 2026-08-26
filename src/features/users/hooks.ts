import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, updateCurrentUser } from './api';
import type { UserUpdate } from './types';
import { useAuth } from '@/features/auth/hooks/useAuth';

const CURRENT_USER_KEY = ['currentUser'] as const;

// Hook lấy thông tin user hiện tại từ backend (chỉ fetch khi đã auth qua Firebase)
export function useCurrentUser() {
  const { firebaseUser } = useAuth();

  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    enabled: !!firebaseUser,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Không retry khi bị 401 hoặc 403 (BANNED/INACTIVE)
      if (error && typeof error === 'object' && 'response' in error) {
        const status = (error as unknown as { response?: { status?: number } }).response
          ?.status;
        if (status === 403 || status === 401) return false;
      }
      return failureCount < 2;
    },
  });
}

// Mutation cập nhật thông tin cá nhân
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdate) => updateCurrentUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}
