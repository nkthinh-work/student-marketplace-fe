import { apiClient } from '@/services/apiClient';
import type {
  BankAccount,
  BankAccountInput,
  PublicUserProfileResponse,
  SoldProductListResponse,
  SupportedBank,
  UserResponse,
  UserUpdate,
} from './types';

export async function fetchCurrentUser(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>('/api/v1/users/me');
  return data;
}

export async function fetchPublicUserProfile(
  userId: number,
): Promise<PublicUserProfileResponse> {
  const { data } = await apiClient.get<PublicUserProfileResponse>(
    `/api/v1/users/${userId}`,
  );
  return data;
}

export async function fetchUserSoldProducts(
  userId: number,
): Promise<SoldProductListResponse> {
  const { data } = await apiClient.get<SoldProductListResponse>(
    `/api/v1/users/${userId}/sold-products`,
  );
  return data;
}

export async function updateCurrentUser(
  payload: UserUpdate,
): Promise<UserResponse> {
  const { data } = await apiClient.patch<UserResponse>(
    '/api/v1/users/me',
    payload,
  );
  return data;
}

export async function fetchSupportedBanks(): Promise<SupportedBank[]> {
  const { data } = await apiClient.get<SupportedBank[]>('/api/v1/users/banks');
  return data;
}

export async function fetchMyBankAccount(): Promise<BankAccount | null> {
  const { data } = await apiClient.get<BankAccount | null>(
    '/api/v1/users/me/bank-account',
  );
  return data;
}

export async function updateMyBankAccount(
  payload: BankAccountInput,
): Promise<BankAccount> {
  const { data } = await apiClient.put<BankAccount>(
    '/api/v1/users/me/bank-account',
    payload,
  );
  return data;
}

export async function deleteMyBankAccount(): Promise<void> {
  await apiClient.delete('/api/v1/users/me/bank-account');
}
