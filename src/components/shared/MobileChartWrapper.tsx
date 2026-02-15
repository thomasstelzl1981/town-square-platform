/**
 * MobileChartWrapper — Replaces complex Recharts with compact KPI summaries on mobile
 * Phase 3: MUX-020
 */
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KPISummaryItem {
  label: string;
  value: string;
  color?: string;
}

interface MobileChartWrapperProps {
  /** The full chart to render on desktop */
  children: ReactNode;
  /** Title shown on mobile KPI card */
  title?: string;
  /** KPI items to show instead of chart on mobile */
  mobileKPIs?: KPISummaryItem[];
  /** Chart height on desktop (default: h-80) */
  className?: string;
}

export function MobileChartWrapper({ children, title, mobileKPIs, className }: MobileChartWrapperProps) {
  const isMobile = useIsMobile();

  if (!isMobile || !mobileKPIs?.length) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="space-y-2">
      {title && (
        <p className={cn(DESIGN.TYPOGRAPHY.HINT, 'font-medium')}>{title}</p>
      )}
      <div className={cn(
        'grid gap-2',
        mobileKPIs.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
      )}>
        {mobileKPIs.map((kpi, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
            <div className={cn('text-sm font-bold mt-0.5', kpi.color)}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MobileChartWrapper;
