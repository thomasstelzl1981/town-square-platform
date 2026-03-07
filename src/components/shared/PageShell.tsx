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
  /** Light-Mode Content Well (white container). Default true. Set false for full-bleed pages. */
  chromeWell?: boolean;
}

export function PageShell({ children, className, fullWidth, chromeWell = true }: PageShellProps) {
  return (
    <div className={cn(
      'page-shell mx-auto px-2 py-3 md:p-8 md:pb-10 space-y-4 md:space-y-6',
      fullWidth ? 'max-w-full' : 'max-w-7xl',
      chromeWell && 'bg-white dark:bg-transparent rounded-2xl border-0 md:border md:border-[hsl(var(--chrome-border)/0.5)] dark:border-0 shadow-none md:shadow-md dark:shadow-none md:mt-2',
      className
    )}>
      {children}
    </div>
  );
}
