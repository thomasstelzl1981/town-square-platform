/**
 * KPICard — Unified KPI card component for all modules
 * Golden standard: glass-card, p-5, icon right, label top, value below
 */
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  subtitleClassName?: string;
  onClick?: () => void;
  className?: string;
}

export function KPICard({ label, value, icon: Icon, subtitle, subtitleClassName, onClick, className }: KPICardProps) {
  return (
    <Card
      className={cn(
        'glass-card',
        onClick && 'cursor-pointer hover:border-primary/40 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className={cn('text-xs text-muted-foreground mt-0.5', subtitleClassName)}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
