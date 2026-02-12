/**
 * ListRow — Unified row component for lists inside widgets
 * Uses DESIGN.LIST from Design Manifest V4.0
 */
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
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
        DESIGN.LIST.ROW,
        onClick && DESIGN.LIST.ROW_HOVER,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
