/**
 * Canonical WebSocket base URL resolver.
 *
 * Precedence:
 * 1. Explicit VITE_WS_BASE_URL if configured (e.g. wss://ws.example.com)
 * 2. Absolute VITE_API_BASE_URL if configured (e.g. https://api.example.com -> wss://api.example.com)
 * 3. Current browser origin (e.g. localhost:3000 -> ws://localhost:3000, abc.devtunnels.ms -> wss://abc.devtunnels.ms)
 */
export function getWebSocketBaseUrl(): string {
  const explicitWs = import.meta.env.VITE_WS_BASE_URL?.trim();
  if (explicitWs) {
    return explicitWs.replace(/\/+$/, '');
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (apiBase && /^https?:\/\//i.test(apiBase)) {
    try {
      const url = new URL(apiBase);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${url.host}`;
    } catch {
      // Fall back to browser location if URL parsing fails
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}`;
  }

  return 'ws://localhost:3000';
}
