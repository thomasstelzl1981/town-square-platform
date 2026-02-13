/**
 * VerwaltungTab — Golden Path konform (ehem. Tabs → WidgetGrid + Inline-Flow)
 * 
 * GOLDEN PATH STANDARD:
 * - ModulePageHeader → WidgetGrid (Demo + CTA + aktive Objekte) → Inline-Sektionen
 * - Kein Tab-Wechsel, vertikaler Scroll-Flow
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Euro, Users } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { SectionCard } from '@/components/shared/SectionCard';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';

// Re-use existing MSV tab components as sections
import ObjekteTab from '@/pages/portal/msv/ObjekteTab';
import MieteingangTab from '@/pages/portal/msv/MieteingangTab';
import VermietungTab from '@/pages/portal/msv/VermietungTab';

const GP_VERWALTUNG = GOLDEN_PATH_PROCESSES.find(p => p.id === 'GP-VERWALTUNG')!;

export function VerwaltungTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isEnabled } = useDemoToggles();
  const showDemo = isEnabled('GP-VERWALTUNG');

  return (
    <PageShell>
      <ModulePageHeader
        title="Verwaltung"
        description="Mietverwaltung — Objekte, Mieteingang und Vermietung in einem Überblick."
      />

      <WidgetGrid>
        {/* Demo-Widget an Position 0 */}
        {showDemo && (
          <WidgetCell>
            <Card
              className={`h-full cursor-pointer transition-all hover:shadow-lg group flex flex-col ${
                selectedId === '__demo__' ? 'ring-2 ring-primary shadow-glow' : ''
              }`}
              onClick={() => setSelectedId('__demo__')}
            >
              <CardContent className="flex flex-col h-full justify-between p-4">
                <div className="flex items-start justify-between">
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-medium">
                    {GP_VERWALTUNG.demoWidget.badgeLabel}
                  </Badge>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm leading-tight">{GP_VERWALTUNG.demoWidget.title}</p>
                  <p className="text-[11px] text-muted-foreground">{GP_VERWALTUNG.demoWidget.subtitle}</p>
                </div>
                <div className="text-[10px] text-muted-foreground text-center">
                  6 Einheiten · 83% Auslastung · 4.200 €/Monat
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        )}

        {/* CTA-Widget */}
        <WidgetCell>
          <Card
            className="h-full cursor-pointer border-dashed hover:border-primary/50 transition-colors flex flex-col"
            onClick={() => setSelectedId('new')}
          >
            <CardContent className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-center">Neues Mietobjekt</p>
              <p className="text-xs text-muted-foreground text-center">
                Objekt anlegen und Mieter verwalten
              </p>
            </CardContent>
          </Card>
        </WidgetCell>
      </WidgetGrid>

      {/* Demo Inline-Detail */}
      {selectedId === '__demo__' && (
        <div className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold tracking-tight">Demo: MFH Düsseldorf</h2>
                <Badge className="bg-primary/10 text-primary border-0">Demo</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Königsallee 42, 40212 Düsseldorf · 6 Einheiten · 83% Auslastung
              </p>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              ✕
            </button>
          </div>

          {/* Mieterübersicht */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Mieterübersicht
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { unit: 'WE 01', tenant: 'Fam. Schmidt', rent: '720 €', status: 'aktiv' },
                { unit: 'WE 02', tenant: 'Hr. Müller', rent: '680 €', status: 'aktiv' },
                { unit: 'WE 03', tenant: 'Fr. Weber', rent: '750 €', status: 'aktiv' },
                { unit: 'WE 04', tenant: '— Leerstand —', rent: '—', status: 'leer' },
                { unit: 'WE 05', tenant: 'Fam. Fischer', rent: '820 €', status: 'aktiv' },
                { unit: 'WE 06', tenant: 'Hr. Wagner', rent: '1.230 €', status: 'aktiv' },
              ].map(m => (
                <div key={m.unit} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/30">
                  <span className="font-mono text-xs w-14">{m.unit}</span>
                  <span className="flex-1">{m.tenant}</span>
                  <span className="font-medium w-20 text-right">{m.rent}</span>
                  <Badge variant={m.status === 'aktiv' ? 'secondary' : 'outline'} className="ml-2 text-[10px]">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Mieteingang */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Euro className="h-4 w-4 text-primary" />
              Mieteingang (letzter Monat)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Soll', value: '4.200 €' },
                { label: 'Ist', value: '3.480 €' },
                { label: 'Quote', value: '83%' },
                { label: 'Offen', value: '720 €' },
              ].map(k => (
                <div key={k.label} className="glass-card rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-lg font-bold">{k.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vertikale Sektionen (echte Daten) — immer sichtbar */}
      <div className="space-y-4 md:space-y-6 pt-4">
        <SectionCard title="Objekte & Einheiten" description="Alle Mietobjekte und ihre Einheiten" icon={Building2}>
          <ObjekteTab />
        </SectionCard>

        <SectionCard title="Mieteingang" description="Zahlungseingänge und offene Posten" icon={Euro}>
          <MieteingangTab />
        </SectionCard>

        <SectionCard title="Vermietung" description="Inserate und Interessenten verwalten" icon={Users}>
          <VermietungTab />
        </SectionCard>
      </div>
    </PageShell>
  );
}

export default VerwaltungTab;
