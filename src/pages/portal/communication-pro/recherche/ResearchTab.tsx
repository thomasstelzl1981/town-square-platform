/**
 * ResearchTab — Zone 2 Golden Path Standard
 * DEMO_WIDGET CI + useDemoToggles + statische Demo-Ergebnistabelle + Billing-Slot
 * MOD-14 Communication Pro > Recherche
 */
import { useState, useCallback } from 'react';
import { Loader2, Plus, Eye, Search, Globe, Database, CheckCircle, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useResearchOrders, useCreateResearchOrder, type ResearchOrder } from '@/hooks/useResearchOrders';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ResearchOrderWidget, ResearchOrderCreateWidget } from './ResearchOrderWidget';
import { ResearchOrderInlineFlow } from './ResearchOrderInlineFlow';
import { DESIGN, CARD, TYPOGRAPHY, TABLE } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ─── Demo-Daten: 8 statische Kontakte ───────────────────────
const DEMO_RESULTS = [
  { firma: 'Hausverwaltung Meier GmbH', kategorie: 'Hausverwaltung', kontakt: 'Thomas Meier', rolle: 'Geschäftsführer', email: 't.meier@hv-meier.de', telefon: '0211-4478900', stadt: 'Düsseldorf', plz: '40210', web: 'hv-meier.de', score: 92, status: 'Validiert', duplikat: false },
  { firma: 'Rheinische Immobilien Service AG', kategorie: 'Hausverwaltung', kontakt: 'Sabine Krause', rolle: 'Vorstand', email: 's.krause@ris-ag.de', telefon: '0221-5567800', stadt: 'Köln', plz: '50667', web: 'ris-ag.de', score: 88, status: 'Validiert', duplikat: false },
  { firma: 'WEG-Profis Verwaltung GmbH', kategorie: 'WEG-Verwaltung', kontakt: 'Michael Braun', rolle: 'Geschäftsführer', email: 'm.braun@weg-profis.de', telefon: '0201-8834500', stadt: 'Essen', plz: '45127', web: 'weg-profis.de', score: 85, status: 'Validiert', duplikat: true },
  { firma: 'Westfalen Hausverwaltung', kategorie: 'Hausverwaltung', kontakt: 'Petra Schmidt', rolle: 'Prokuristin', email: 'p.schmidt@whv-ms.de', telefon: '0251-7790123', stadt: 'Münster', plz: '48143', web: 'whv-ms.de', score: 82, status: 'Validiert', duplikat: false },
  { firma: 'ProHaus Management GmbH', kategorie: 'Facility Management', kontakt: 'Jörg Hansen', rolle: 'Geschäftsführer', email: 'j.hansen@prohaus.de', telefon: '0231-4456700', stadt: 'Dortmund', plz: '44135', web: 'prohaus.de', score: 79, status: 'Prüfung', duplikat: false },
  { firma: 'Niederrhein Verwaltung GmbH', kategorie: 'Hausverwaltung', kontakt: 'Anna Weber', rolle: 'Geschäftsführerin', email: 'a.weber@nrv-gmbh.de', telefon: '0203-5589012', stadt: 'Duisburg', plz: '47051', web: 'nrv-gmbh.de', score: 76, status: 'Validiert', duplikat: false },
  { firma: 'Bergisch Immo GmbH & Co. KG', kategorie: 'Hausverwaltung', kontakt: 'Klaus Richter', rolle: 'Geschäftsführer', email: 'k.richter@bergisch-immo.de', telefon: '0202-3345600', stadt: 'Wuppertal', plz: '42103', web: 'bergisch-immo.de', score: 73, status: 'Prüfung', duplikat: true },
  { firma: 'Capital Wohnen Verwaltung AG', kategorie: 'Hausverwaltung', kontakt: 'Sandra Lange', rolle: 'Vorstand', email: 's.lange@capital-wohnen.de', telefon: '0228-6679800', stadt: 'Bonn', plz: '53111', web: 'capital-wohnen.de', score: 70, status: 'Validiert', duplikat: false },
];

const DEMO_ORDER: ResearchOrder = {
  id: '__demo__',
  tenant_id: '',
  created_by: '',
  status: 'done',
  title: 'Hausverwaltungen NRW',
  intent_text: 'Geschäftsführer von Hausverwaltungen in Nordrhein-Westfalen mit mehr als 500 Einheiten',
  icp_json: { branche: 'Immobilien / Hausverwaltung', region: 'NRW', role: 'Geschäftsführer', keywords: ['WEG', 'Mietverwaltung'] },
  max_results: 50,
  cost_cap: 10,
  cost_spent: 4.20,
  results_count: 37,
  consent_confirmed: true,
  provider_plan_json: { firecrawl: true, epify: false, apollo: false },
  ai_summary_md: 'Recherche abgeschlossen: 37 qualifizierte Kontakte gefunden, davon 12 mit Confidence >80%.',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T12:30:00Z',
} as any;

export function ResearchTab() {
  const { data: orders = [], isLoading } = useResearchOrders();
  const createOrder = useCreateResearchOrder();
  const { user, activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const demoEnabled = isEnabled('GP-RECHERCHE');
  const isDemo = activeOrderId === '__demo__';
  const activeOrder = isDemo ? DEMO_ORDER : orders.find(o => o.id === activeOrderId) || null;

  const handleCreate = useCallback(async () => {
    if (!user?.id || !activeTenantId) {
      toast.error('Profil nicht geladen');
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        tenant_id: activeTenantId,
        created_by: user.id,
      });
      setActiveOrderId(order.id);
    } catch (e: any) {
      toast.error(`Fehler beim Erstellen: ${e.message}`);
    }
  }, [user, activeTenantId, createOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ModulePageHeader
        title="Recherche"
        description="Asynchrone Lead-Engine — Rechercheaufträge anlegen, durchführen und Kontakte übernehmen."
      />

      {/* Widget Grid */}
      <WidgetGrid>
        {/* Demo Widget — Position 0 mit DEMO_WIDGET CI */}
        {demoEnabled && (
          <WidgetCell>
            <Card
              className={cn(
                'h-full cursor-pointer transition-all',
                DESIGN.DEMO_WIDGET.CARD,
                DESIGN.DEMO_WIDGET.HOVER,
                isDemo && 'ring-2 ring-emerald-500 shadow-glow'
              )}
              onClick={() => setActiveOrderId(isDemo ? null : '__demo__')}
            >
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, 'text-[10px]')}>Demo</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Fertig
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Hausverwaltungen NRW</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    37 qualifizierte Kontakte gefunden
                  </p>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Intent:</span>
                    <span className="text-foreground truncate ml-2">GF HV &gt; 500 WE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Region:</span>
                    <span className="text-foreground">NRW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Treffer:</span>
                    <span className="text-foreground font-medium">37 / 50</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        )}

        {/* Real Orders */}
        {orders.map(order => (
          <WidgetCell key={order.id}>
            <ResearchOrderWidget
              order={order}
              isActive={order.id === activeOrderId}
              onClick={() => setActiveOrderId(activeOrderId === order.id ? null : order.id)}
            />
          </WidgetCell>
        ))}

        {/* CTA: New Order */}
        <WidgetCell>
          <ResearchOrderCreateWidget onClick={handleCreate} />
        </WidgetCell>
      </WidgetGrid>

      {/* Inline Case Flow for real orders */}
      {activeOrder && !isDemo && (
        <ResearchOrderInlineFlow order={activeOrder} />
      )}

      {/* Demo Inline Flow — vollständige Ergebnistabelle */}
      {isDemo && (
        <div className="space-y-4">
          {/* Auftrags-Zusammenfassung */}
          <div className={cn(CARD.CONTENT, 'space-y-3')}>
            <h3 className={TYPOGRAPHY.CARD_TITLE}>Demo-Auftrag: Hausverwaltungen NRW</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className={TYPOGRAPHY.LABEL}>Suchintent:</span> <span>Geschäftsführer von Hausverwaltungen in NRW mit &gt;500 Einheiten</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Branche:</span> <span>Immobilien / Hausverwaltung</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Region:</span> <span>NRW</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Rolle:</span> <span>Geschäftsführer</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Max. Treffer:</span> <span>50</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Credits:</span> <span>37 Credits (= 18,50 €)</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Ergebnis:</span> <span className="font-medium">37 qualifizierte Kontakte</span></div>
              <div><span className={TYPOGRAPHY.LABEL}>Provider:</span> <span>Firecrawl</span></div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-xs">
              <p className="font-medium mb-1">KI-Zusammenfassung:</p>
              <p>Recherche abgeschlossen: 37 qualifizierte Kontakte gefunden, davon 12 mit Confidence &gt;80%.</p>
            </div>
          </div>

          {/* Vollständige Ergebnis-Tabelle */}
          <div className={TABLE.WRAPPER}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <h3 className="text-sm font-semibold">Ergebnisse (8 von 37 angezeigt)</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Excel-Export
                </Button>
                <Button size="sm" variant="outline" disabled className="text-xs">
                  <Upload className="h-3 w-3 mr-1" />
                  Ins Kontaktbuch
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={TABLE.HEADER_BG}>
                    <th className={TABLE.HEADER_CELL}>Firma</th>
                    <th className={TABLE.HEADER_CELL}>Kategorie</th>
                    <th className={TABLE.HEADER_CELL}>Kontakt</th>
                    <th className={TABLE.HEADER_CELL}>Rolle</th>
                    <th className={TABLE.HEADER_CELL}>E-Mail</th>
                    <th className={TABLE.HEADER_CELL}>Telefon</th>
                    <th className={TABLE.HEADER_CELL}>Stadt</th>
                    <th className={TABLE.HEADER_CELL}>PLZ</th>
                    <th className={TABLE.HEADER_CELL}>Web</th>
                    <th className={TABLE.HEADER_CELL}>Score</th>
                    <th className={TABLE.HEADER_CELL}>Status</th>
                    <th className={TABLE.HEADER_CELL}>Import</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_RESULTS.map((r, i) => (
                    <tr key={i} className={cn(TABLE.ROW_HOVER, TABLE.ROW_BORDER)}>
                      <td className={cn(TABLE.BODY_CELL, 'font-medium whitespace-nowrap')}>{r.firma}</td>
                      <td className={TABLE.BODY_CELL}>{r.kategorie}</td>
                      <td className={TABLE.BODY_CELL}>{r.kontakt}</td>
                      <td className={TABLE.BODY_CELL}>{r.rolle}</td>
                      <td className={cn(TABLE.BODY_CELL, 'text-primary')}>{r.email}</td>
                      <td className={cn(TABLE.BODY_CELL, 'whitespace-nowrap')}>{r.telefon}</td>
                      <td className={TABLE.BODY_CELL}>{r.stadt}</td>
                      <td className={TABLE.BODY_CELL}>{r.plz}</td>
                      <td className={cn(TABLE.BODY_CELL, 'text-primary')}>{r.web}</td>
                      <td className={TABLE.BODY_CELL}>
                        <Badge variant={r.score >= 80 ? 'default' : 'secondary'} className="text-[10px]">
                          {r.score}
                        </Badge>
                      </td>
                      <td className={TABLE.BODY_CELL}>
                        <Badge variant={r.status === 'Validiert' ? 'outline' : 'secondary'} className="text-[10px]">
                          {r.status}
                        </Badge>
                      </td>
                      <td className={TABLE.BODY_CELL}>
                        <Badge
                          variant={r.duplikat ? 'destructive' : 'default'}
                          className="text-[10px]"
                        >
                          {r.duplikat ? 'DUPLIKAT' : 'NEU'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
