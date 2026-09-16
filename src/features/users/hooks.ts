import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteMyBankAccount,
  fetchCurrentUser,
  fetchMyBankAccount,
  fetchPublicUserProfile,
  fetchSupportedBanks,
  fetchUserSoldProducts,
  updateCurrentUser,
  updateMyBankAccount,
} from './api';
import type { BankAccountInput, UserUpdate } from './types';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const CURRENT_USER_KEY = ['currentUser'] as const;
export const currentUserQueryKey = (uid?: string | null) => ['currentUser', uid ?? null] as const;
export const MY_BANK_ACCOUNT_KEY = ['myBankAccount'] as const;
export const myBankAccountQueryKey = (uid?: string | null) => ['myBankAccount', uid ?? null] as const;
export const SUPPORTED_BANKS_KEY = ['supportedBanks'] as const;
export const publicUserProfileQueryKey = (userId: number) => ['publicUser', userId] as const;
export const userSoldProductsQueryKey = (userId: number) => ['userSoldProducts', userId] as const;

// Hook lấy thông tin user hiện tại từ backend (chỉ fetch khi đã auth qua Firebase)
export function useCurrentUser() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  return useQuery({
    queryKey: currentUserQueryKey(uid),
    queryFn: fetchCurrentUser,
    enabled: !!uid,
    staleTime: 60 * 1000,
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

// Hook lấy thông tin hồ sơ công khai của một người dùng
export function usePublicUserProfile(userId: number) {
  return useQuery({
    queryKey: publicUserProfileQueryKey(userId),
    queryFn: () => fetchPublicUserProfile(userId),
    enabled: !isNaN(userId) && userId > 0,
    staleTime: 60 * 1000,
  });
}

// Hook lấy lịch sử sản phẩm đã bán của một người dùng (COMPLETED sales)
export function useUserSoldProducts(userId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: userSoldProductsQueryKey(userId),
    queryFn: () => fetchUserSoldProducts(userId),
    enabled: !isNaN(userId) && userId > 0 && enabled,
    staleTime: 60 * 1000,
  });
}

// Mutation cập nhật thông tin cá nhân
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuth();

  return useMutation({
    mutationFn: (data: UserUpdate) => updateCurrentUser(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(currentUserQueryKey(firebaseUser?.uid), updatedUser);
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      if (updatedUser?.user_id) {
        queryClient.invalidateQueries({ queryKey: publicUserProfileQueryKey(updatedUser.user_id) });
      }
    },
  });
}

// Hook lấy danh sách ngân hàng Việt Nam hỗ trợ
export function useSupportedBanks() {
  return useQuery({
    queryKey: SUPPORTED_BANKS_KEY,
    queryFn: fetchSupportedBanks,
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });
}

// Hook lấy tài khoản nhận tiền của người dùng hiện tại
export function useMyBankAccount() {
  const { firebaseUser } = useAuth();
  const uid = firebaseUser?.uid;

  return useQuery({
    queryKey: myBankAccountQueryKey(uid),
    queryFn: fetchMyBankAccount,
    enabled: !!uid,
    staleTime: 60 * 1000,
  });
}

// Mutation cập nhật tài khoản nhận tiền
export function useUpdateMyBankAccount() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuth();

  return useMutation({
    mutationFn: (data: BankAccountInput) => updateMyBankAccount(data),
    onSuccess: (data) => {
      queryClient.setQueryData(myBankAccountQueryKey(firebaseUser?.uid), data);
      queryClient.invalidateQueries({ queryKey: MY_BANK_ACCOUNT_KEY });
    },
  });
}

// Mutation xóa tài khoản nhận tiền
export function useDeleteMyBankAccount() {
  const queryClient = useQueryClient();
  const { firebaseUser } = useAuth();

  return useMutation({
    mutationFn: () => deleteMyBankAccount(),
    onSuccess: () => {
      queryClient.setQueryData(myBankAccountQueryKey(firebaseUser?.uid), null);
      queryClient.invalidateQueries({ queryKey: MY_BANK_ACCOUNT_KEY });
    },
  });
}
