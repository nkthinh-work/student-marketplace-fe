import axios from 'axios';
import { auth } from '@/lib/firebase';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const apiClient = axios.create({
  baseURL: configuredBaseUrl || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn Firebase ID token vào Bearer Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // Fallback gửi request không auth khi lấy token thất bại
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Tự động refresh token và retry 1 lần khi gặp 401
let isRefreshing = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      auth.currentUser
    ) {
      if (isRefreshing) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const token = await auth.currentUser.getIdToken(true);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      const detail = String(error.response?.data?.detail || '').toLowerCase();
      if (
        detail.includes('banned') ||
        detail.includes('inactive') ||
        detail.includes('tài khoản đã bị khóa') ||
        detail.includes('tài khoản không hoạt động')
      ) {
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/account-restricted'
        ) {
          window.location.href = '/account-restricted';
        }
      }
    }

    return Promise.reject(error);
  },
);

export { apiClient };
