/**
 * VerwaltungTab — MOD-04 Verwaltung (ehem. MSV)
 * 
 * Linearer Scroll-Flow:
 * 1. ModulePageHeader
 * 2. WidgetGrid (Objekt-Widgets + Demo + CTA)
 * 3. Kachel 1: Mietliste
 * 4. Kachel 2: Aufgaben (Säumig + Mieterhöhung)
 * 5. Kachel 3: BWA/Buchwert/Controlling
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Home, AlertCircle, Plus } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useMSVData } from '@/hooks/useMSVData';
import { MietlisteTable } from '@/components/msv/MietlisteTable';
import { AufgabenSection } from '@/components/msv/AufgabenSection';
import { BWAControllingSection } from '@/components/msv/BWAControllingSection';

const AMPEL_COLORS = {
  paid: 'bg-green-500',
  partial: 'bg-yellow-500',
  overdue: 'bg-destructive',
};

const AMPEL_LABELS = {
  paid: 'Alle bezahlt',
  partial: 'Teilweise offen',
  overdue: 'Überfällig',
};

export function VerwaltungTab() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const { properties, isLoading } = useMSVData();

  const hasObjects = properties.length > 0;

  return (
    <PageShell>
      <ModulePageHeader
        title="Verwaltung"
        description="Mietkontrolle, Mahnwesen und BWA/Buchwert — alles auf einer Seite."
      />

      {/* Objekt-Widgets */}
      <WidgetGrid variant="widget">
        {properties.map(prop => (
          <WidgetCell key={prop.id}>
            <button
              onClick={() => setSelectedPropertyId(selectedPropertyId === prop.id ? null : prop.id)}
              className={cn(
                "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
                DESIGN.CARD.BASE,
                selectedPropertyId === prop.id
                  ? "ring-2 ring-primary border-primary shadow-sm"
                  : "border-border/50 hover:border-primary/40"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  {prop.isDemo && <Badge className="bg-primary/10 text-primary text-[10px]">Demo</Badge>}
                  {!prop.isDemo && <span />}
                  <div className={`h-3 w-3 rounded-full ${AMPEL_COLORS[prop.zahlstatus]}`} title={AMPEL_LABELS[prop.zahlstatus]} />
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{prop.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{prop.address}, {prop.city}</p>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Units</span>
                  <span className="font-semibold">{prop.unitCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Aktive Leases</span>
                  <span className="font-semibold">{prop.activeLeaseCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Zahlstatus</span>
                  <Badge className={cn(
                    "border-0 text-[10px]",
                    prop.zahlstatus === 'paid' && "bg-green-500/10 text-green-700 dark:text-green-400",
                    prop.zahlstatus === 'partial' && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                    prop.zahlstatus === 'overdue' && "bg-destructive/10 text-destructive",
                  )}>{AMPEL_LABELS[prop.zahlstatus]}</Badge>
                </div>
              </div>
            </button>
          </WidgetCell>
        ))}

        {/* CTA Widget */}
        <WidgetCell>
          <button
            onClick={() => window.location.href = '/portal/immobilien/portfolio'}
            className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-4 p-5 rounded-xl border border-dashed text-center transition-all",
              DESIGN.CARD.BASE,
              "hover:border-primary/50 hover:shadow-md"
            )}
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">MSV-Objekt hinzufügen</h3>
              <p className={cn(DESIGN.TYPOGRAPHY.LABEL, 'mt-1')}>Vermietung im Portfolio aktivieren</p>
            </div>
          </button>
        </WidgetCell>
      </WidgetGrid>

      {/* Empty State */}
      {!hasObjects && !isLoading && (
        <Card className={DESIGN.CARD.SECTION}>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine MSV-Objekte aktiv. Aktiviere Vermietung in der Immobilienakte → Flag rental_managed.
            </p>
            <Button variant="link" className="mt-2" onClick={() => window.location.href = '/portal/immobilien/portfolio'}>
              Zum Portfolio →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Kachel 1: Mietliste */}
      <MietlisteTable propertyId={selectedPropertyId} />

      {/* Kachel 2: Aufgaben */}
      <AufgabenSection propertyId={selectedPropertyId} />

      {/* Kachel 3: BWA/Buchwert — Full Width */}
      <BWAControllingSection propertyId={selectedPropertyId} />
    </PageShell>
  );
}

export default VerwaltungTab;
