import { useCallback, useRef } from 'react';

// Hook scroll-reveal kích hoạt hiệu ứng khi phần tử vào viewport (hỗ trợ prefers-reduced-motion)
export function useScrollReveal(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const observerMap = useRef<Map<Element, IntersectionObserver>>(new Map());

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      if (prefersReducedMotion) {
        node.classList.add('reveal-visible');
        return;
      }

      if (observerMap.current.has(node)) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('reveal-visible');
              observer.unobserve(entry.target);
              observerMap.current.delete(entry.target);
            }
          });
        },
        {
          threshold: options?.threshold ?? 0.1,
          rootMargin: options?.rootMargin ?? '0px 0px -40px 0px',
        },
      );

      observer.observe(node);
      observerMap.current.set(node, observer);
    },
    [prefersReducedMotion, options?.threshold, options?.rootMargin],
  );

  return revealRef;
}
