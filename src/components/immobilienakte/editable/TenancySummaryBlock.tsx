import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users, ArrowRight } from 'lucide-react';
import type { TenancyStatus } from '@/types/immobilienakte';

interface TenancySummaryBlockProps {
  tenancyStatus: TenancyStatus;
  activeLeasesCount: number;
  totalRentWarmEur: number;
  tenantName?: string;
  tenantSince?: string;
  onNavigateToTab?: () => void;
}

const STATUS_CONFIG: Record<TenancyStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Vermietet', color: 'bg-green-600' },
  VACANT: { label: 'Leerstand', color: 'bg-red-500' },
  TERMINATING: { label: 'Kündigung', color: 'bg-amber-500' },
  ENDED: { label: 'Beendet', color: 'bg-muted-foreground' },
};

export function TenancySummaryBlock({
  tenancyStatus,
  activeLeasesCount,
  totalRentWarmEur,
  tenantName,
  tenantSince,
  onNavigateToTab,
}: TenancySummaryBlockProps) {
  const config = STATUS_CONFIG[tenancyStatus] || STATUS_CONFIG.VACANT;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mietverhältnis
          </span>
          <Badge className={config.color}>
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aktive Verträge</Label>
            <p className="text-lg font-semibold">{activeLeasesCount}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesamtmiete (warm)</Label>
            <p className="text-lg font-semibold text-primary">
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalRentWarmEur)}
            </p>
          </div>
        </div>

        {tenantName && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mieter</Label>
            <p className="text-sm font-medium">{tenantName}</p>
          </div>
        )}

        {tenantSince && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mieter seit</Label>
            <p className="text-sm">{tenantSince}</p>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button 
            variant="link" 
            className="p-0 h-auto text-sm text-muted-foreground hover:text-primary"
            onClick={onNavigateToTab}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Vollständige Verwaltung im Tab "Mietverhältnis"
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
