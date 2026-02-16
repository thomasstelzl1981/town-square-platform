/**
 * KPICard — Unified KPI card component for all modules
 * Uses DESIGN.CARD.KPI, DESIGN.TYPOGRAPHY, DESIGN.HEADER from Design Manifest V4.0
 */
import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
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

export const KPICard = memo(function KPICard({ label, value, icon: Icon, subtitle, subtitleClassName, onClick, className }: KPICardProps) {
  return (
    <Card
      className={cn(
        DESIGN.CARD.KPI,
        onClick && 'cursor-pointer hover:border-primary/40 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className={DESIGN.TYPOGRAPHY.LABEL}>{label}</p>
            <p className={cn(DESIGN.TYPOGRAPHY.VALUE, 'mt-1')}>{value}</p>
          </div>
          <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
