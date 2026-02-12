/**
 * WidgetCell — Standardisierter Wrapper für einzelne Widget-Zellen
 * 
 * DESIGN MANIFEST V3.0:
 * - Desktop: aspect-square (quadratisch)
 * - Mobile: h-[260px] (feste Höhe)
 * - Optional: span-2 für doppelt-breite Widgets
 * 
 * VERWENDUNG:
 * ```tsx
 * <WidgetGrid>
 *   <WidgetCell>
 *     <MyWidget />
 *   </WidgetCell>
 *   <WidgetCell span={2}>
 *     <WideWidget />
 *   </WidgetCell>
 * </WidgetGrid>
 * ```
 */

import { cn } from '@/lib/utils';
import { WIDGET_CELL } from '@/config/designManifest';
import type { ReactNode } from 'react';

interface WidgetCellProps {
  children: ReactNode;
  /** Spaltenbreite: 1 (Standard) oder 2 (doppelt breit) */
  span?: 1 | 2;
  className?: string;
}

export function WidgetCell({ children, span = 1, className }: WidgetCellProps) {
  return (
    <div
      className={cn(
        WIDGET_CELL.DIMENSIONS,
        span === 2 && WIDGET_CELL.SPAN_2,
        className
      )}
    >
      {children}
    </div>
  );
}
