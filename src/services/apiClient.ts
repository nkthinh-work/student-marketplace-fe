import axios from 'axios';
import { auth } from '@/lib/firebase';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const apiClient = axios.create({
  baseURL: configuredBaseUrl || undefined,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn Firebase ID token vào Bearer Authorization header & dọn dẹp Content-Type cho FormData
apiClient.interceptors.request.use(
  async (config) => {
    // Để Axios và trình duyệt tự động sinh multipart boundary cho FormData
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

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

// Single-flight shared Promise cho các request 401 đồng thời
let refreshPromise: Promise<string | null> | null = null;

async function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    const userAtStart = auth.currentUser;
    if (!userAtStart) return null;
    const uidAtStart = userAtStart.uid;

    refreshPromise = (async () => {
      try {
        const token = await userAtStart.getIdToken(true);
        // Kiểm tra người dùng không logout hoặc đổi tài khoản trong lúc chờ token
        if (auth.currentUser?.uid !== uidAtStart) {
          return null;
        }
        return token;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      auth.currentUser
    ) {
      originalRequest._retry = true;

      try {
        const token = await getRefreshedToken();
        if (!token) {
          return Promise.reject(error);
        }
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(error);
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
