/**
 * ContractWidget — Versorgungsvertrag als Widget (aspect-square)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Flame, Droplets, Wifi, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DEMO_WIDGET } from '@/config/designManifest';
import { isDemoId } from '@/engines/demoData/engine';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  strom: Zap,
  gas: Flame,
  wasser: Droplets,
  internet: Wifi,
  hausrat: FileText,
  haftpflicht: FileText,
};

const CATEGORY_LABELS: Record<string, string> = {
  strom: 'Stromvertrag',
  gas: 'Gasvertrag',
  wasser: 'Wasservertrag',
  internet: 'Internet & Telefon',
  hausrat: 'Hausratversicherung',
  haftpflicht: 'Haftpflichtversicherung',
};

interface ContractWidgetProps {
  contract: any;
}

export function ContractWidget({ contract }: ContractWidgetProps) {
  const navigate = useNavigate();
  const isDemo = isDemoId(contract.id);
  const Icon = CATEGORY_ICONS[contract.category] || FileText;
  const label = CATEGORY_LABELS[contract.category] || contract.category;

  return (
    <Card className={cn('glass-card h-full flex flex-col', isDemo && DEMO_WIDGET.CARD)}>
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {isDemo && <Badge className={DEMO_WIDGET.BADGE + ' text-[10px] mb-1'}>DEMO</Badge>}
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Ihr Vertrag</p>
            <p className="font-medium text-xs">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{contract.provider_name || 'Anbieter'}</p>
            {contract.monthly_cost && (
              <p className="text-xs font-medium mt-0.5">
                {Number(contract.monthly_cost).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-[10px] h-6 mt-2 -ml-2 px-2"
          onClick={() => navigate(`/portal/immobilien/zuhause/zuhause/${contract.home_id}`)}
        >
          <ArrowRight className="h-3 w-3 mr-1" />Details
        </Button>
      </CardContent>
    </Card>
  );
}
