/**
 * ServiceCaseCard — Square widget card for renovation cases (analog to FinanceCaseCard)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Wrench, Zap, Paintbrush, Home, Square, Flame, Package, Building2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceCaseStatus } from '@/hooks/useServiceCases';
import { formatCurrency } from '@/lib/formatters';
import type { ServiceCaseCategory } from '@/hooks/useServiceCases';

const CATEGORY_ICONS: Record<ServiceCaseCategory, React.ComponentType<{ className?: string }>> = {
  sanitaer: Wrench, elektro: Zap, maler: Paintbrush, dach: Home,
  fenster: Square, heizung: Flame, gutachter: ClipboardList,
  hausverwaltung: Building2, sonstige: Package,
};

interface ServiceCaseCardProps {
  serviceCase: {
    id: string;
    title: string;
    category: ServiceCaseCategory;
    status: ServiceCaseStatus;
    tender_id?: string | null;
    public_id?: string | null;
    cost_estimate_min?: number | null;
    cost_estimate_max?: number | null;
    budget_estimate?: number | null;
    property?: { address?: string } | null;
  };
  isSelected?: boolean;
  onClick?: () => void;
}

export function ServiceCaseCard({ serviceCase, isSelected, onClick }: ServiceCaseCardProps) {
  const CategoryIcon = CATEGORY_ICONS[serviceCase.category] || Package;
  const costText = serviceCase.cost_estimate_min && serviceCase.cost_estimate_max
    ? `${formatCurrency(serviceCase.cost_estimate_min / 100)} – ${formatCurrency(serviceCase.cost_estimate_max / 100)}`
    : serviceCase.budget_estimate != null
      ? formatCurrency(serviceCase.budget_estimate)
      : null;

  return (
    <Card
      className={cn(
        'glass-card shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02] group flex flex-col aspect-square',
        isSelected && 'ring-2 ring-primary shadow-glow'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col h-full justify-between">
        {/* Top: Status + ID */}
        <div className="flex items-start justify-between">
          <Badge variant="secondary" className="text-[10px] font-medium">{serviceCase.status}</Badge>
          <span className="text-[10px] font-mono text-muted-foreground">
            {serviceCase.tender_id || serviceCase.public_id}
          </span>
        </div>

        {/* Center: Icon + Title */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
            <CategoryIcon className="h-5 w-5 text-primary" />
          </div>
          <p className="font-semibold text-sm leading-tight line-clamp-2">{serviceCase.title}</p>
          {costText && (
            <p className="text-[11px] text-muted-foreground">{costText}</p>
          )}
          {serviceCase.property?.address && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">{serviceCase.property.address}</p>
          )}
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-end text-[10px] text-muted-foreground">
          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceCaseCardPlaceholder() {
  return (
    <Card className="glass-card border-dashed border-2 aspect-square flex flex-col items-center justify-center opacity-50">
      <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
          <Wrench className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Keine Vorgänge</p>
        <p className="text-[10px] text-muted-foreground">Starten Sie Ihre erste Sanierung</p>
      </CardContent>
    </Card>
  );
}
