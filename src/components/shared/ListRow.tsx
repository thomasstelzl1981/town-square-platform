/**
 * ListRow — Unified row component for lists inside widgets
 * Consistent padding, border, hover state
 */
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ListRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListRow({ children, onClick, className }: ListRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30',
        onClick && 'cursor-pointer hover:border-primary/20 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
