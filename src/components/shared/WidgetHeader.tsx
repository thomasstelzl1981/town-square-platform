/**
 * WidgetHeader — Unified header for widget cards
 * Icon-Box + Title + optional Description + optional right-side action
 */
import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface WidgetHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const WidgetHeader = memo(function WidgetHeader({ icon: Icon, title, description, action, className }: WidgetHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
      </div>
      {action}
    </div>
  );
});
