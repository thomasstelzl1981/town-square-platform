import { useIsMobile } from '@/hooks/use-mobile';
import type { ReactNode } from 'react';

interface DesktopOnlyProps {
  children: ReactNode;
  /** Optional fallback content shown on mobile instead */
  fallback?: ReactNode;
}

/**
 * Hides children on mobile devices.
 * Used to remove creation widgets, forms, and "new item" buttons on mobile.
 * On mobile, users create new entries via Armstrong Actions or the Desktop/PWA version.
 */
export function DesktopOnly({ children, fallback = null }: DesktopOnlyProps) {
  const isMobile = useIsMobile();
  if (isMobile) return <>{fallback}</>;
  return <>{children}</>;
}
