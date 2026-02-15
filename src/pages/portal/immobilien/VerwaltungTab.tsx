/**
 * VerwaltungTab — V + V Anlage V Steuererklärung
 * 
 * 3-Stufen-Flow:
 * 1. Vermietereinheit wählen (WidgetGrid)
 * 2. Objekte der VE bearbeiten (Anlage V Form pro Objekt)
 * 3. Erklärung (read-only Zusammenfassung + Export)
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, AlertCircle, CheckCircle2, ChevronLeft, FileText } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useVVSteuerData } from '@/hooks/useVVSteuerData';
import { VVAnlageVForm } from '@/components/vv/VVAnlageVForm';
import { VVErklaerungView } from '@/components/vv/VVErklaerungView';
import { buildContextSummary } from '@/engines/vvSteuer/engine';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear - 2, currentYear - 3];

export function VerwaltungTab() {
  const [taxYear, setTaxYear] = useState(currentYear - 1);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showErklaerung, setShowErklaerung] = useState(false);

  const { contexts, isLoading, buildPropertyTaxData, save, isSaving } = useVVSteuerData(taxYear);

  const selectedContext = contexts.find((c: any) => c.id === selectedContextId);

  // Build Erklaerung summary when needed
  const erklaerungSummary = useMemo(() => {
    if (!showErklaerung || !selectedContext) return null;
    const propertyDataList = selectedContext.properties
      .map((p: any) => buildPropertyTaxData(p.id))
      .filter(Boolean) as any[];
    if (propertyDataList.length === 0) return null;
    return buildContextSummary(
      selectedContext.id,
      selectedContext.name,
      selectedContext.context_type,
      selectedContext.tax_number || '',
      taxYear,
      propertyDataList,
    );
  }, [showErklaerung, selectedContext, taxYear, buildPropertyTaxData]);

  const handleContextClick = (ctxId: string) => {
    if (selectedContextId === ctxId) {
      // If all confirmed, toggle Erklaerung view
      const ctx = contexts.find((c: any) => c.id === ctxId);
      if (ctx?.allConfirmed) {
        setShowErklaerung(!showErklaerung);
        setSelectedPropertyId(null);
      }
    } else {
      setSelectedContextId(ctxId);
      setSelectedPropertyId(null);
      setShowErklaerung(false);
    }
  };

  const handleBack = () => {
    if (showErklaerung) {
      setShowErklaerung(false);
    } else if (selectedPropertyId) {
      setSelectedPropertyId(null);
    } else {
      setSelectedContextId(null);
    }
  };

  const selectedTaxData = selectedPropertyId ? buildPropertyTaxData(selectedPropertyId) : null;

  return (
    <PageShell>
      <ModulePageHeader
        title="V + V"
        description="Vermietung + Verwaltung — Steuererklärung Anlage V"
        actions={
          <div className="flex items-center gap-3">
            {(selectedContextId || selectedPropertyId) && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Zurück
              </Button>
            )}
            <Select value={String(taxYear)} onValueChange={v => { setTaxYear(Number(v)); setSelectedPropertyId(null); setShowErklaerung(false); }}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* STUFE 1: Vermietereinheit-Widgets */}
      <WidgetGrid variant="widget">
        {contexts.map((ctx: any) => (
          <WidgetCell key={ctx.id}>
            <button
              onClick={() => handleContextClick(ctx.id)}
              className={cn(
                "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
                DESIGN.CARD.BASE,
                selectedContextId === ctx.id
                  ? "ring-2 ring-primary border-primary shadow-sm"
                  : "border-border/50 hover:border-primary/40"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px]">{ctx.context_type}</Badge>
                  {ctx.allConfirmed ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{ctx.confirmedCount}/{ctx.propertyCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{ctx.name}</span>
                </div>
                {ctx.tax_number && (
                  <p className="text-xs text-muted-foreground mt-1">StNr: {ctx.tax_number}</p>
                )}
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Objekte</span>
                  <span className="font-semibold">{ctx.propertyCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={cn(
                    "border-0 text-[10px]",
                    ctx.allConfirmed
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {ctx.allConfirmed ? 'Alle bestätigt' : 'In Bearbeitung'}
                  </Badge>
                </div>
                {ctx.allConfirmed && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Erklärung</span>
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
              </div>
            </button>
          </WidgetCell>
        ))}
      </WidgetGrid>

      {/* Empty State */}
      {contexts.length === 0 && !isLoading && (
        <Card className={DESIGN.CARD.SECTION}>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Keine Vermietereinheiten mit Objekten gefunden. Legen Sie Objekte im Portfolio an und weisen Sie diese einer Vermietereinheit zu.
            </p>
            <Button variant="link" className="mt-2" onClick={() => window.location.href = '/portal/immobilien/portfolio'}>
              Zum Portfolio →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STUFE 3: Erklaerung (wenn alle bestätigt) */}
      {showErklaerung && erklaerungSummary && (
        <VVErklaerungView summary={erklaerungSummary} />
      )}

      {/* STUFE 2: Objekt-Widgets der ausgewählten VE */}
      {selectedContext && !showErklaerung && (
        <>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{selectedContext.name} — Objekte ({taxYear})</h3>
          </div>

          <WidgetGrid variant="widget">
            {selectedContext.properties.map((prop: any) => {
              const annual = (buildPropertyTaxData(prop.id))?.manualData;
              const isConfirmed = annual?.confirmed ?? false;

              return (
                <WidgetCell key={prop.id}>
                  <button
                    onClick={() => { setSelectedPropertyId(selectedPropertyId === prop.id ? null : prop.id); setShowErklaerung(false); }}
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
                        <Badge variant="outline" className="text-[10px]">{prop.property_type}</Badge>
                        {isConfirmed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <span className="font-semibold text-sm">{prop.code || prop.address}</span>
                      <p className="text-xs text-muted-foreground mt-1">{prop.address} {prop.address_house_no}, {prop.postal_code} {prop.city}</p>
                    </div>
                    <div className="mt-3">
                      <Badge className={cn(
                        "border-0 text-[10px]",
                        isConfirmed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {isConfirmed ? 'Bestätigt' : 'Offen'}
                      </Badge>
                    </div>
                  </button>
                </WidgetCell>
              );
            })}
          </WidgetGrid>
        </>
      )}

      {/* STUFE 2b: Anlage V Form für ausgewähltes Objekt */}
      {selectedTaxData && !showErklaerung && (
        <VVAnlageVForm
          taxData={selectedTaxData}
          contextTaxNumber={selectedContext?.tax_number || ''}
          onSave={(data, taxRef, ownershipPct) => save({ propertyId: selectedTaxData.propertyId, data, taxRefNumber: taxRef, ownershipPercent: ownershipPct })}
          isSaving={isSaving}
        />
      )}
    </PageShell>
  );
}

export default VerwaltungTab;
