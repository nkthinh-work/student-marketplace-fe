import type { NavigateFunction } from 'react-router-dom';

export interface SafeNavigationState {
  fromApp?: boolean;
  returnTo?: string;
  returnLabel?: string;
  source?: string;
}

/**
 * Validates whether a path is a safe internal application route.
 * Rejects external URLs, protocol schemes, protocol-relative paths, and invalid inputs.
 */
export function isValidInternalPath(path: unknown): path is string {
  if (typeof path !== 'string' || path.trim() === '') {
    return false;
  }

  const trimmed = path.trim();

  // Must start with exactly one '/' and not '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return false;
  }

  // Reject URL schemes (e.g. http:, https:, javascript:, data:, mailto:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) || trimmed.toLowerCase().includes('javascript:')) {
    return false;
  }

  return true;
}

export interface SafeBackInfo {
  label: string;
  handleBack: (navigate: NavigateFunction) => void;
}

/**
 * Resolves safe contextual in-app Back navigation behavior and label.
 *
 * Priority:
 * CASE A: valid internal returnTo exists -> navigate(validReturnTo) directly
 * CASE B: state.fromApp === true (explicit internal in-app navigation) -> navigate(-1)
 * CASE C: no safe internal source -> navigate('/', { replace: true })
 */
export function getSafeBackAction(
  state: unknown,
  fallbackUrl: string = '/',
): SafeBackInfo {
  const navState = (state && typeof state === 'object' ? state : {}) as SafeNavigationState;
  const isFromApp = navState.fromApp === true;
  const rawReturnTo = navState.returnTo;
  const validReturnTo = isValidInternalPath(rawReturnTo) ? rawReturnTo : undefined;
  const safeFallback = isValidInternalPath(fallbackUrl) ? fallbackUrl : '/';

  // Determine contextual back button label
  let label = 'Về trang chủ';
  if (navState.returnLabel && typeof navState.returnLabel === 'string' && navState.returnLabel.trim().length > 0) {
    const rawLabel = navState.returnLabel.trim();
    const normalized = rawLabel.toLowerCase();

    if (normalized === 'product') {
      label = 'Quay lại sản phẩm';
    } else if (normalized === 'order') {
      label = 'Quay lại đơn hàng';
    } else if (normalized === 'group') {
      label = 'Quay lại nhóm';
    } else if (normalized === 'conversation') {
      label = 'Quay lại cuộc trò chuyện';
    } else if (normalized === 'profile') {
      label = 'Quay lại trang cá nhân';
    } else if (normalized === 'generic' || normalized === 'default') {
      label = 'Quay lại';
    } else {
      label = rawLabel;
    }
  } else if (isFromApp) {
    if (validReturnTo === '/profile') {
      label = 'Quay lại trang cá nhân';
    } else if (validReturnTo?.startsWith('/products/')) {
      label = 'Quay lại sản phẩm';
    } else if (validReturnTo?.startsWith('/orders/')) {
      label = 'Quay lại đơn hàng';
    } else if (validReturnTo?.startsWith('/messages/')) {
      label = 'Quay lại cuộc trò chuyện';
    } else {
      label = 'Quay lại';
    }
  }

  // Safeguard: never leak internal technical identifier "generic" to end users
  if (label.trim().toLowerCase() === 'generic') {
    label = 'Quay lại';
  }

  // Execution handler
  const handleBack = (navigate: NavigateFunction) => {
    const hasHistoryStack =
      typeof window !== 'undefined' &&
      window.history.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0;

    if (isFromApp && hasHistoryStack) {
      // In-app navigation with existing history stack: pop history (-1) to avoid duplicate history entries
      navigate(-1);
    } else if (validReturnTo) {
      // Deep link or new tab: replace current entry with return target to prevent loop
      navigate(validReturnTo, { replace: true });
    } else {
      // Safe fallback
      navigate(safeFallback, { replace: true });
    }
  };

  return { label, handleBack };
}
