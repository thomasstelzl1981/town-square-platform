/**
 * MOD-18 Finanzen — Tab: Krankenversicherung (KV)
 * Widget CE Layout: WidgetGrid + WidgetCell (4-col, square)
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { getDemoKVContracts } from '@/engines/demoData';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CARD, TYPOGRAPHY, HEADER, DEMO_WIDGET, getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { Plus, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(v);
}

export default function KrankenversicherungTab() {
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const kvContracts = getDemoKVContracts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!demoEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
        <p>Keine Krankenversicherungsdaten vorhanden. Aktivieren Sie die Demo-Daten für eine Vorschau.</p>
      </div>
    );
  }

  const selectedKv = kvContracts.find(kv => kv.personId === selectedId);

  return (
    <PageShell>
      <ModulePageHeader
        title="Krankenversicherung"
        description="PKV & GKV Übersicht für alle Haushaltsmitglieder"
        actions={
          <Button variant="glass" size="icon-round" onClick={() => toast.info('Neue KV-Anlage wird vorbereitet…')}>
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <WidgetGrid>
        {kvContracts.map((kv) => {
          const isSelected = selectedId === kv.personId;
          return (
            <WidgetCell key={kv.personId}>
              <div
                className={cn(
                  CARD.BASE, CARD.INTERACTIVE,
                  'h-full flex flex-col justify-between p-5',
                  getActiveWidgetGlow('emerald'),
                  isSelected && getSelectionRing('emerald'),
                )}
                onClick={(e) => { e.stopPropagation(); setSelectedId(isSelected ? null : kv.personId); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSelectedId(isSelected ? null : kv.personId); }}}
                role="button"
                tabIndex={0}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={DEMO_WIDGET.BADGE + ' text-[10px]'}>DEMO</Badge>
                    <Badge variant="secondary" className="text-[10px]">{kv.type}</Badge>
                  </div>
                  <div className={HEADER.WIDGET_ICON_BOX}>
                    <Shield className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h4 className={TYPOGRAPHY.CARD_TITLE}>{kv.personName}</h4>
                  <p className="text-xs text-muted-foreground">{kv.provider}</p>
                </div>
                <div className="space-y-1 mt-auto pt-3 border-t border-border/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Beitrag</span>
                    <span className="font-semibold">{fmt(kv.monthlyPremium)}</span>
                  </div>
                </div>
              </div>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Detail section below grid */}
      {selectedKv && (
        <Card className="glass-card p-6 mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{selectedKv.personName} — {selectedKv.type}</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Versicherer</p>
              <p className="text-sm font-medium">{selectedKv.provider}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Typ</p>
              <p className="text-sm font-medium">{selectedKv.type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Monatsbeitrag</p>
              <p className="text-sm font-medium">{fmt(selectedKv.monthlyPremium)}</p>
            </div>
            {selectedKv.employerContribution && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">AG-Anteil</p>
                <p className="text-sm font-medium">{fmt(selectedKv.employerContribution)}</p>
              </div>
            )}
          </div>

          {Object.keys(selectedKv.details).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Zusatzdetails</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(selectedKv.details).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-medium">
                      {typeof value === 'boolean' ? (value ? '✓ Ja' : '✗ Nein') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </PageShell>
  );
}
