import { apiClient } from '@/services/apiClient';

export interface AttachmentDownloadTicketResponse {
  ticket: string;
  download_url: string;
  expires_in_seconds: number;
}

/**
 * Requests an opaque, short-lived single-use download ticket via authenticated API request,
 * then triggers native browser download to the authorized streaming endpoint.
 *
 * Security Invariants:
 * 1. Firebase ID token is NEVER placed in URL query parameters or download URLs.
 * 2. Ticket is single-use, 60s TTL, and stored in Redis.
 * 3. Browser native download manager preserves the original filename and extension.
 */
export async function requestAttachmentDownload(
  conversationId: number,
  attachmentId: number,
  fallbackName?: string
): Promise<void> {
  try {
    const { data } = await apiClient.post<AttachmentDownloadTicketResponse>(
      `/api/v1/conversations/${conversationId}/attachments/${attachmentId}/download-ticket`
    );

    if (!data?.download_url) {
      throw new Error('Không nhận được đường dẫn tải xuống hợp lệ.');
    }

    // Resolve URL against API base URL if relative
    let targetUrl = data.download_url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      const baseUrl = apiClient.defaults.baseURL || '';
      targetUrl = `${baseUrl.replace(/\/$/, '')}/${targetUrl.replace(/^\//, '')}`;
    }

    // Trigger browser native download manager via a temporary link
    const link = document.createElement('a');
    link.href = targetUrl;
    if (fallbackName) {
      link.setAttribute('download', fallbackName);
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 403 || status === 404) {
      alert('Bạn không có quyền tải tệp này hoặc cuộc trò chuyện không tồn tại.');
    } else if (status === 503) {
      alert('Tạm thời không thể tải xuống. Vui lòng thử lại.');
    } else {
      alert(error?.response?.data?.detail || 'Không thể tải xuống tệp đính kèm. Vui lòng thử lại sau.');
    }
    throw error;
  }
}
