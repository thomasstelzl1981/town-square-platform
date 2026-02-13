/**
 * MSVDashboard — MOD-05 Hauptseite
 * 
 * Vertikaler Scroll-Flow:
 * 1. ModulePageHeader
 * 2. WidgetGrid (Objekt-Widgets + Demo)
 * 3. Kachel 1: Mietliste
 * 4. Kachel 2: Aufgaben (Säumig + Mieterhöhung)
 * 5. Kachel 3: BWA/Buchwert/Controlling
 * 
 * ALLES sichtbar, Premium nur gelockt.
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Home, AlertCircle } from 'lucide-react';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { MietlisteTable } from '@/components/msv/MietlisteTable';
import { AufgabenSection } from '@/components/msv/AufgabenSection';
import { BWAControllingSection } from '@/components/msv/BWAControllingSection';

// Demo-Objekte
const DEMO_OBJECTS = [
  {
    id: '__demo_obj_1__',
    name: 'MFH Düsseldorf',
    adresse: 'Königsallee 42, 40212 Düsseldorf',
    units: 6,
    activeLeases: 5,
    zahlstatus: 'partial' as const,
  },
];

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

export default function MSVDashboard() {
  const { isEnabled } = useDemoToggles();
  const showDemo = isEnabled('GP-VERWALTUNG'); // Reuse GP-VERWALTUNG toggle for MSV
  const [selectedObjektId, setSelectedObjektId] = useState<string | null>(null);

  const objects = DEMO_OBJECTS; // TODO: Replace with real rental_managed properties from MOD-04
  const hasObjects = objects.length > 0 || showDemo;

  return (
    <PageShell>
      <ModulePageHeader
        title="Mietsonderverwaltung"
        description="Mietkontrolle, Mahnwesen und BWA/Buchwert — alles auf einer Seite."
      />

      {/* Objekt-Widgets */}
      <WidgetGrid variant="widget">
        {/* Demo-Widget an Position 0 */}
        {showDemo && (
          <WidgetCell>
            <button
              onClick={() => setSelectedObjektId(selectedObjektId === '__demo_obj_1__' ? null : '__demo_obj_1__')}
              className={cn(
                "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
                DESIGN.CARD.BASE,
                selectedObjektId === '__demo_obj_1__'
                  ? "ring-2 ring-primary border-primary shadow-sm"
                  : "border-primary/20 hover:border-primary/40"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-primary/10 text-primary text-[10px]">Demo</Badge>
                  <div className={`h-3 w-3 rounded-full ${AMPEL_COLORS.partial}`} title={AMPEL_LABELS.partial} />
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">MFH Düsseldorf</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Königsallee 42</p>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Units</span>
                  <span className="font-semibold">6</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Aktive Leases</span>
                  <span className="font-semibold">5</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Zahlstatus</span>
                  <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-0 text-[10px]">Teilweise offen</Badge>
                </div>
              </div>
            </button>
          </WidgetCell>
        )}

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
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">MSV-Objekt hinzufügen</h3>
              <p className={cn(DESIGN.TYPOGRAPHY.LABEL, 'mt-1')}>Vermietung in MOD-04 aktivieren</p>
            </div>
          </button>
        </WidgetCell>
      </WidgetGrid>

      {/* Empty State wenn keine rental_managed Objekte */}
      {!hasObjects && (
        <Card className={DESIGN.CARD.SECTION}>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine MSV-Objekte aktiv. Aktiviere Vermietung in der Immobilienakte (MOD-04) → Flag rental_managed.
            </p>
            <Button variant="link" className="mt-2" onClick={() => window.location.href = '/portal/immobilien/portfolio'}>
              Zum Portfolio →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Kachel 1: Mietliste */}
      <MietlisteTable />

      {/* Kachel 2: Aufgaben */}
      <AufgabenSection />

      {/* Kachel 3: BWA/Buchwert — Full Width */}
      <BWAControllingSection />
    </PageShell>
  );
}
