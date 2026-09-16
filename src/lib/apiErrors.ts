import axios from 'axios';

/**
 * Extracts a user-friendly error message from an API error or unexpected exception.
 * Prevents raw 'AxiosError', 'Network Error', stack traces, or uncaught exceptions
 * from being displayed to normal users.
 */
export function getApiErrorMessage(
  error: unknown,
  defaultFallback: string = 'Đã xảy ra lỗi. Vui lòng thử lại.'
): string {
  if (!error) {
    return defaultFallback;
  }

  if (axios.isAxiosError(error)) {
    // 1. Backend response available with detailed error message
    if (error.response?.data) {
      const data = error.response.data as Record<string, any>;
      if (typeof data.detail === 'string' && data.detail.trim() !== '') {
        return data.detail;
      }
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        // FastAPI 422 Unprocessable Entity array of validation errors
        const validationMsgs = data.detail
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item && typeof item.msg === 'string') {
              const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
              return field ? `${field}: ${item.msg}` : item.msg;
            }
            return null;
          })
          .filter(Boolean);
        if (validationMsgs.length > 0) {
          return validationMsgs.join('; ');
        }
      }
      if (typeof data.message === 'string' && data.message.trim() !== '') {
        return data.message;
      }
    }

    // 2. HTTP status-based fallback messages
    if (error.response) {
      const status = error.response.status;
      if (status === 400) return 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
      if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu hoặc đã bị gỡ.';
      if (status === 409) return 'Dữ liệu bị xung đột hoặc phiên đã được cập nhật trước đó.';
      if (status === 422) return 'Dữ liệu nhập vào không hợp lệ. Vui lòng kiểm tra lại.';
      if (status >= 500) {
        return `Máy chủ đang gặp sự cố (${status}). Vui lòng thử lại sau giây lát.`;
      }
      return `Lỗi máy chủ (${status}). Vui lòng thử lại sau.`;
    }

    // 3. Request was made but no response received (Connection refused, DNS, Offline)
    if (error.request) {
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
    }

    // 4. Other Axios internal errors (e.g. request setup issue)
    return defaultFallback;
  }

  // Non-Axios errors
  if (error instanceof Error) {
    if (
      error.message &&
      !error.message.includes('AxiosError') &&
      !error.message.includes('Network Error') &&
      !error.message.includes('object Object')
    ) {
      return error.message;
    }
  }

  return defaultFallback;
}

/**
 * Returns HTTP status code if error is an AxiosError with response, else undefined.
 */
export function getApiErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * Checks whether an error represents deterministic loss of conversation/group access (403 or 404).
 * Network failures, timeouts, 401s, and 5xx errors return false to preserve normal error/retry UX.
 */
export function isAccessRevokedError(error: unknown): boolean {
  const status = getApiErrorStatus(error);
  return status === 403 || status === 404;
}

