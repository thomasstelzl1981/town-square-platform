/**
 * WidgetGrid — Standardisierter Grid-Container für Widget-Layouts
 * 
 * DESIGN MANIFEST V3.0:
 * - Maximal 4 Spalten (Desktop), 2 (Tablet), 1 (Mobile)
 * - Konsistente Gaps und Responsiveness
 * - Drei Varianten: widget (square), kpi (compact), form (2-col)
 * 
 * VERWENDUNG:
 * ```tsx
 * <WidgetGrid>
 *   <WidgetCell>...</WidgetCell>
 *   <WidgetCell>...</WidgetCell>
 * </WidgetGrid>
 * ```
 */

import { cn } from '@/lib/utils';
import { WIDGET_GRID, KPI_GRID, FORM_GRID } from '@/config/designManifest';
import type { ReactNode } from 'react';

interface WidgetGridProps {
  children: ReactNode;
  /** Layout-Variante: widget (4-col square), kpi (4-col compact), form (2-col) */
  variant?: 'widget' | 'kpi' | 'form';
  className?: string;
}

const VARIANT_CLASSES = {
  widget: `${WIDGET_GRID.CLASSES} ${WIDGET_GRID.GAP}`,
  kpi: `${KPI_GRID.CLASSES} ${KPI_GRID.GAP}`,
  form: `${FORM_GRID.CLASSES} ${FORM_GRID.GAP}`,
} as const;

export function WidgetGrid({ children, variant = 'widget', className }: WidgetGridProps) {
  return (
    <div className={cn(VARIANT_CLASSES[variant], className)}>
      {children}
    </div>
  );
}
