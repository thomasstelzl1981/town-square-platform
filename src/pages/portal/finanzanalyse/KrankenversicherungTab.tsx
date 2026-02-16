/**
 * MOD-18 Finanzen — Tab: Krankenversicherung (KV)
 * 
 * Zeigt PKV/GKV-Status aller Haushaltsmitglieder als Demo-Widgets.
 * Daten kommen aus der demoData Engine (clientseitig).
 */
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DEMO_WIDGET } from '@/config/designManifest';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDemoKVContracts } from '@/engines/demoData';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { Shield, Heart, Users, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

const KV_TYPE_CONFIG = {
  PKV: { label: 'Private Krankenversicherung', color: 'text-primary', icon: Shield },
  GKV: { label: 'Gesetzliche Krankenversicherung', color: 'text-primary/70', icon: Heart },
  familienversichert: { label: 'Familienversichert', color: 'text-muted-foreground', icon: Users },
} as const;

export default function KrankenversicherungTab() {
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-18');
  const kvContracts = getDemoKVContracts();

  if (!demoEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
        <p>Keine Krankenversicherungsdaten vorhanden. Aktivieren Sie die Demo-Daten für eine Vorschau.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Krankenversicherung</h2>
          <p className="text-sm text-muted-foreground">PKV & GKV Übersicht für alle Haushaltsmitglieder</p>
        </div>
      </div>

      <WidgetGrid>
        {kvContracts.map((kv) => {
          const config = KV_TYPE_CONFIG[kv.type];
          const Icon = config.icon;
          return (
            <WidgetCell key={kv.personId} span={kv.type === 'familienversichert' ? 1 : 2}>
              <Card className={cn('h-full', DEMO_WIDGET.CARD, DEMO_WIDGET.HOVER)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-5 w-5', config.color)} />
                      <CardTitle className="text-base">{kv.personName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={DEMO_WIDGET.BADGE}>DEMO</Badge>
                      <Badge variant="outline" className={config.color}>{kv.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Versicherer</span>
                    <span className="text-sm font-medium">{kv.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monatsbeitrag</span>
                    <span className="text-sm font-semibold flex items-center gap-1">
                      <Euro className="h-3.5 w-3.5" />
                      {fmt(kv.monthlyPremium)}
                    </span>
                  </div>
                  {kv.employerContribution && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">AG-Anteil</span>
                      <span className="text-sm text-primary/70">{fmt(kv.employerContribution)}</span>
                    </div>
                  )}
                  {Object.entries(kv.details).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-xs">
                        {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </WidgetCell>
          );
        })}
      </WidgetGrid>
    </div>
  );
}
