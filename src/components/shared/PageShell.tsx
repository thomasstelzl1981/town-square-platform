/**
 * PageShell — Unified outer container for all Zone 2 module pages
 * Provides consistent padding and spacing across all modules.
 */
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('p-4 md:p-6 space-y-6', className)}>
      {children}
    </div>
  );
}
