/**
 * PageShell — Unified outer container for all Zone 2 module pages
 * Provides consistent padding and spacing across all modules.
 */
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageShell({ children, className, fullWidth }: PageShellProps) {
  return (
    <div className={cn(fullWidth ? 'max-w-full' : 'max-w-7xl', 'mx-auto px-2 py-3 md:p-6 space-y-4 md:space-y-6', className)}>
      {children}
    </div>
  );
}
