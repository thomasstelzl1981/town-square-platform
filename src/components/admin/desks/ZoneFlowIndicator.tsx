/**
 * ZoneFlowIndicator — Compact Z3 → Z1 → Z2 flow visualization
 * Shows the governance data flow for each Operative Desk.
 */
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export interface ZoneFlowConfig {
  z3Surface: string;
  z1Desk: string;
  z2Manager: string;
}

interface ZoneFlowIndicatorProps {
  flow: ZoneFlowConfig;
}

export function ZoneFlowIndicator({ flow }: ZoneFlowIndicatorProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs">
      <Badge variant="outline" className="bg-teal-500/10 text-teal-700 border-teal-500/30 text-xs font-normal">
        Z3 · {flow.z3Surface}
      </Badge>
      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs font-normal">
        Z1 · {flow.z1Desk}
      </Badge>
      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-xs font-normal">
        Z2 · {flow.z2Manager}
      </Badge>
    </div>
  );
}
