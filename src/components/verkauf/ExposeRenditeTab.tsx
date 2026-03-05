/**
 * R-2: Rendite & AfA tab — Investment metrics for investors
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, PiggyBank, Percent } from 'lucide-react';
import { formatCurrency, formatPercent, type PropertyAccountingData } from './exposeTypes';

interface ExposeRenditeTabProps {
  monthlyRent: number | null;
  annualRent: number;
  grossYield: number;
  accounting: PropertyAccountingData | null;
}

export function ExposeRenditeTab({ monthlyRent, annualRent, grossYield, accounting }: ExposeRenditeTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Rendite & Abschreibung
        </CardTitle>
        <CardDescription>Investmentkennzahlen für Kapitalanleger</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Mietrendite */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Mieteinnahmen</h4>
            <div className="space-y-3">
              <MetricRow label="Monatliche Miete (Kalt)" value={formatCurrency(monthlyRent)} />
              <MetricRow label="Jahresmiete" value={formatCurrency(annualRent)} />
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-sm font-medium">Bruttorendite</span>
                <span className="font-bold text-primary text-lg">{grossYield.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* AfA-Daten */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Abschreibung (AfA)</h4>
            <div className="space-y-3">
              <MetricRowIcon icon={PiggyBank} label="AfA-Modell" value={accounting?.afa_method || 'Linear'} />
              <MetricRowIcon icon={Percent} label="AfA-Satz" value={formatPercent(accounting?.afa_rate_percent)} />
              <MetricRow label="Gebäudeanteil" value={formatPercent(accounting?.building_share_percent)} />
              <MetricRow label="Grundstücksanteil" value={formatPercent(accounting?.land_share_percent)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <span className="text-sm">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function MetricRowIcon({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
