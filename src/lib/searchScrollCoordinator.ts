/**
 * Canonical Search Viewport Dismissal & Results Scroll Coordinator
 * Coordinates mobile keyboard dismissal via input blur, observes real visualViewport expansion,
 * and scrolls to the Results/Sort header without arbitrary device delays or magic offsets.
 */

let activeCoordinatorController: AbortController | null = null;

export function cleanupSearchCoordinator(): void {
  if (activeCoordinatorController) {
    activeCoordinatorController.abort();
    activeCoordinatorController = null;
  }
}

/**
 * Execute scroll to results header, dynamically measuring the bottom of visible sticky stack.
 */
export function executeScrollToResults(retriesLeft = 12): void {
  if (typeof window === 'undefined') return;

  const target = document.querySelector<HTMLElement>('[data-ui-role="search-results-header"]');
  if (!target) {
    if (retriesLeft > 0) {
      requestAnimationFrame(() => executeScrollToResults(retriesLeft - 1));
    }
    return;
  }

  // Measure visible sticky stack dynamically at scroll time
  const header = document.querySelector<HTMLElement>('header');
  const stickyCategoryBar = document.querySelector<HTMLElement>('.sticky');

  let stickyBottom = 0;
  if (header) {
    const rect = header.getBoundingClientRect();
    if (rect.bottom > stickyBottom) stickyBottom = rect.bottom;
  }
  if (stickyCategoryBar) {
    const rect = stickyCategoryBar.getBoundingClientRect();
    if (rect.bottom > stickyBottom) stickyBottom = rect.bottom;
  }

  const targetRect = target.getBoundingClientRect();
  const currentScrollY = window.scrollY;
  // Position target immediately below the lowest sticky chrome element with 8px breathing space
  const targetTop = currentScrollY + targetRect.top - stickyBottom - 8;

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.scrollTo({
    top: Math.max(0, Math.floor(targetTop)),
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });
}

/**
 * Coordinate keyboard blur, viewport expansion stabilization, and result scroll.
 */
export function coordinateSearchDismissAndScroll(inputEl?: HTMLInputElement | null): void {
  if (typeof window === 'undefined') return;

  // Cancel any prior coordinator to prevent racing
  cleanupSearchCoordinator();

  const controller = new AbortController();
  activeCoordinatorController = controller;
  const { signal } = controller;

  // 1. Request virtual keyboard dismiss
  if (inputEl) {
    inputEl.blur();
  }

  const vv = window.visualViewport;
  if (!vv) {
    // Fallback if visualViewport unsupported
    executeScrollToResults();
    cleanupSearchCoordinator();
    return;
  }

  let rafId: number | null = null;
  let fallbackTimer: NodeJS.Timeout | null = null;
  let consecutiveStableFrames = 0;
  let lastMeasuredHeight = vv.height;
  const STABLE_FRAMES_REQUIRED = 3;

  const cleanupListeners = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (fallbackTimer !== null) clearTimeout(fallbackTimer);
    vv.removeEventListener('resize', onVvChange);
    vv.removeEventListener('scroll', onVvChange);
  };

  const finish = () => {
    if (signal.aborted) return;
    cleanupListeners();
    activeCoordinatorController = null;
    executeScrollToResults();
  };

  const checkStability = () => {
    if (signal.aborted) {
      cleanupListeners();
      return;
    }

    const currentHeight = vv.height;
    if (Math.abs(currentHeight - lastMeasuredHeight) <= 1) {
      consecutiveStableFrames++;
    } else {
      consecutiveStableFrames = 0;
      lastMeasuredHeight = currentHeight;
    }

    if (consecutiveStableFrames >= STABLE_FRAMES_REQUIRED) {
      finish();
    } else {
      rafId = requestAnimationFrame(checkStability);
    }
  };

  const onVvChange = () => {
    if (signal.aborted) return;
    consecutiveStableFrames = 0;
  };

  vv.addEventListener('resize', onVvChange, { passive: true });
  vv.addEventListener('scroll', onVvChange, { passive: true });

  // Start checking stability loop
  rafId = requestAnimationFrame(checkStability);

  // Bounded fallback safety guard (350ms) in case browser does not emit further events
  fallbackTimer = setTimeout(() => {
    if (!signal.aborted) {
      finish();
    }
  }, 350);

  signal.addEventListener('abort', cleanupListeners);
}
