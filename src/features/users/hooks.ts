import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCurrentUser,
  fetchMyBankAccount,
  fetchSupportedBanks,
  updateCurrentUser,
  updateMyBankAccount,
  deleteMyBankAccount,
} from './api';
import type { BankAccountInput, UserUpdate } from './types';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const CURRENT_USER_KEY = ['currentUser'] as const;
export const MY_BANK_ACCOUNT_KEY = ['myBankAccount'] as const;
export const SUPPORTED_BANKS_KEY = ['supportedBanks'] as const;

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

  return useQuery({
    queryKey: MY_BANK_ACCOUNT_KEY,
    queryFn: fetchMyBankAccount,
    enabled: !!firebaseUser,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation cập nhật tài khoản nhận tiền
export function useUpdateMyBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BankAccountInput) => updateMyBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_BANK_ACCOUNT_KEY });
    },
  });
}

// Mutation xóa tài khoản nhận tiền
export function useDeleteMyBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMyBankAccount(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_BANK_ACCOUNT_KEY });
    },
  });
}
