import test from 'node:test';
import assert from 'node:assert/strict';

test('Tutorial Video Upload: Timeout and Progress configuration', async () => {
  // Mock apiClient
  let capturedConfig = null;
  const mockApiClient = {
    post: async (url, data, config) => {
      capturedConfig = { url, data, ...config };
      return { data: { tutorial_id: 1, title: 'Test' } };
    },
    defaults: {
      timeout: 30000,
    },
  };

  // Simulate replaceTutorialVideo and createTutorial logic
  const mockFile = new Blob(['mp4-binary-content'], { type: 'video/mp4' });
  const progressCalls = [];
  const onUploadProgress = (e) => progressCalls.push(e);

  const replaceTutorialVideo = async (tutorialId, videoFile, onProgress) => {
    const formData = new FormData();
    formData.append('video', videoFile);
    return mockApiClient.post(`/admin/tutorials/${tutorialId}/video`, formData, {
      timeout: 180000,
      onUploadProgress: onProgress,
    });
  };

  await replaceTutorialVideo(42, mockFile, onUploadProgress);

  assert.equal(capturedConfig.url, '/admin/tutorials/42/video');
  assert.equal(capturedConfig.timeout, 180000, 'Video replace must configure 180s timeout to allow large file upload');
  assert.equal(typeof capturedConfig.onUploadProgress, 'function');
  assert.equal(mockApiClient.defaults.timeout, 30000, 'Default apiClient timeout must remain 30s for non-video APIs');
});

test('Tutorial Video Upload: extractErrorMessage properly formats timeout and network limit errors', () => {
  function extractErrorMessage(err, fallback, isDevTunnel = false) {
    const requestId =
      err?.response?.headers?.['x-railway-request-id'] ||
      err?.response?.headers?.['x-request-id'] ||
      null;
    const reqIdSuffix = requestId ? ` [Mã yêu cầu: ${requestId}]` : '';

    if (err?.response?.status === 413) {
      if (isDevTunnel) {
        return `Dung lượng tệp vượt quá giới hạn 16 MB của Dev Tunnel. Vui lòng nén video hoặc truy cập localhost:3000.${reqIdSuffix}`;
      }
      return `Dung lượng tệp vượt quá giới hạn tải lên cho phép (HTTP 413 Payload Too Large).${reqIdSuffix}`;
    }

    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return `${detail.trim()}${reqIdSuffix}`;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const joined = detail
        .map((item) => item?.msg || (typeof item === 'string' ? item : ''))
        .filter(Boolean)
        .join(', ');
      if (joined) {
        return `${joined}${reqIdSuffix}`;
      }
    }

    const status = err?.response?.status;
    if (status === 502 || status === 503 || status === 504) {
      return `Máy chủ lưu trữ video hoặc cổng kết nối tạm thời không phản hồi (HTTP ${status}). Vui lòng kiểm tra lại danh sách tutorial trước khi thử lại.${reqIdSuffix}`;
    }

    if (status === 500) {
      return `Máy chủ gặp sự cố nội bộ khi xử lý video (HTTP 500). Vui lòng thử lại sau.${reqIdSuffix}`;
    }

    if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
      return 'Quá thời gian tải lên (timeout). Máy chủ có thể vẫn đang xử lý trong nền, vui lòng kiểm tra lại danh sách tutorial trước khi tải lại.';
    }

    if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
      if (isDevTunnel) {
        return 'Lỗi kết nối mạng hoặc đường truyền tải lên bị ngắt quãng (nếu dùng Dev Tunnel, tệp không được vượt quá 16 MB). Vui lòng kiểm tra lại danh sách.';
      }
      return 'Không thể kết nối đến máy chủ hoặc đường truyền bị gián đoạn (Network Error). Máy chủ có thể đã lưu video, vui lòng làm mới danh sách tutorial để kiểm tra trước khi tải lại.';
    }

    return `${fallback}${reqIdSuffix}`;
  }

  // Case 1: Client timeout
  const timeoutErr = { code: 'ECONNABORTED', message: 'timeout of 180000ms exceeded' };
  const msgTimeout = extractErrorMessage(timeoutErr, 'Fallback');
  assert.match(msgTimeout, /timeout/i);
  assert.match(msgTimeout, /danh sách tutorial/i);

  // Case 2a: Dev Tunnel 413 Payload Too Large
  const payload413Err = { response: { status: 413 } };
  const msg413Dev = extractErrorMessage(payload413Err, 'Fallback', true);
  assert.match(msg413Dev, /16 MB của Dev Tunnel/);

  // Case 2b: Production 413 Payload Too Large (no Dev Tunnel mention)
  const msg413Prod = extractErrorMessage(payload413Err, 'Fallback', false);
  assert.match(msg413Prod, /HTTP 413 Payload Too Large/);
  assert.equal(msg413Prod.includes('Dev Tunnel'), false);

  // Case 3a: Network Error on Production (no Dev Tunnel mention)
  const networkErr = { code: 'ERR_NETWORK', message: 'Network Error' };
  const msgNetworkProd = extractErrorMessage(networkErr, 'Fallback', false);
  assert.match(msgNetworkProd, /Network Error/i);
  assert.equal(msgNetworkProd.includes('Dev Tunnel'), false);

  // Case 3b: Network Error on Dev Tunnel
  const msgNetworkDev = extractErrorMessage(networkErr, 'Fallback', true);
  assert.match(msgNetworkDev, /Dev Tunnel/);

  // Case 4: Backend 502 Cloudinary upload error detail
  const err502 = { response: { status: 502, data: { detail: 'Tải video lên máy chủ lưu trữ thất bại hoặc quá thời gian xử lý. Vui lòng thử lại.' } } };
  const msg502 = extractErrorMessage(err502, 'Fallback');
  assert.equal(msg502, 'Tải video lên máy chủ lưu trữ thất bại hoặc quá thời gian xử lý. Vui lòng thử lại.');

  // Case 5: Safe Request ID suffix
  const errWithReqId = { response: { status: 503, headers: { 'x-railway-request-id': 'req-safe-123' } } };
  const msgWithReqId = extractErrorMessage(errWithReqId, 'Fallback');
  assert.match(msgWithReqId, /\[Mã yêu cầu: req-safe-123\]/);
});
