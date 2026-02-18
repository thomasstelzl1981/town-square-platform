import { useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

/** Returns the parent route by removing the last path segment */
export function getParentRoute(pathname: string): string {
  // Normalize trailing slash
  const clean = pathname.replace(/\/+$/, '');
  if (clean === '/portal' || clean === '') return '/portal';
  const segments = clean.split('/');
  segments.pop();
  const parent = segments.join('/');
  return parent || '/portal';
}

/**
 * Detects a right-swipe gesture on a ref'd element and navigates to the parent route.
 * Only active on mobile. Threshold: >80px horizontal, <50px vertical.
 */
export function useSwipeBack(ref: React.RefObject<HTMLElement | null>) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = Math.abs(touch.clientY - touchStart.current.y);
    touchStart.current = null;

    // Right swipe: deltaX > 80, vertical movement < 50
    if (deltaX > 80 && deltaY < 50) {
      const clean = location.pathname.replace(/\/+$/, '');
      if (clean !== '/portal') {
        navigate(getParentRoute(clean));
      }
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!isMobile) return;
    const el = ref.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, ref, handleTouchStart, handleTouchEnd]);
}
