/**
 * ModulePageHeader — Consistent header for all Zone 2 module pages
 * 
 * Provides:
 * - UPPERCASE title (tracking-tight, font-bold)
 * - Muted description (normal-case)
 * - Optional action buttons on the right
 * - Consistent mb-6 spacing
 */
import type { ReactNode } from 'react';

interface ModulePageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function ModulePageHeader({ title, description, actions }: ModulePageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">{actions}</div>}
    </div>
  );
}
