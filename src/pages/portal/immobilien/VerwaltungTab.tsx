/**
 * VerwaltungTab — Orchestrator
 * R-30: 456 → ~150 lines
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, FileText, BarChart3, ChevronLeft } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useVVSteuerData } from '@/hooks/useVVSteuerData';
import { VVErklaerungView } from '@/components/vv/VVErklaerungView';
import { BWATab } from '@/components/portfolio/BWATab';
import { buildContextSummary, calculatePropertyResult } from '@/engines/vvSteuer/engine';
import { WorkflowStepProgress } from '@/components/shared/WorkflowStepProgress';
import { VerwaltungContextGrid } from '@/components/immobilien/verwaltung/VerwaltungContextGrid';
import { VerwaltungPropertyAccordion } from '@/components/immobilien/verwaltung/VerwaltungPropertyAccordion';
import { VerwaltungGesamtergebnis } from '@/components/immobilien/verwaltung/VerwaltungGesamtergebnis';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear - 2, currentYear - 3];

export function VerwaltungTab() {
  const [taxYear, setTaxYear] = useState(currentYear - 1);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [showErklaerung, setShowErklaerung] = useState(false);
  const [viewMode, setViewMode] = useState<'anlageV' | 'bwa'>('anlageV');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  const { contexts, isLoading, buildPropertyTaxData, save, isSaving } = useVVSteuerData(taxYear);
  const selectedContext = contexts.find((c: any) => c.id === selectedContextId);

  const erklaerungSummary = useMemo(() => {
    if (!showErklaerung || !selectedContext) return null;
    const propertyDataList = selectedContext.properties.map((p: any) => buildPropertyTaxData(p.id)).filter(Boolean) as any[];
    if (propertyDataList.length === 0) return null;
    return buildContextSummary(selectedContext.id, selectedContext.name, selectedContext.context_type, selectedContext.tax_number || '', taxYear, propertyDataList);
  }, [showErklaerung, selectedContext, taxYear, buildPropertyTaxData]);

  const gesamtErgebnis = useMemo(() => {
    if (!selectedContext) return null;
    let totalIncome = 0, totalCosts = 0, confirmed = 0;
    const total = selectedContext.properties.length;
    for (const prop of selectedContext.properties) {
      const td = buildPropertyTaxData(prop.id);
      if (td) { const r = calculatePropertyResult(td); totalIncome += r.totalIncome; totalCosts += r.totalCosts; if (td.manualData.confirmed) confirmed++; }
    }
    return { totalIncome, totalCosts, surplus: totalIncome - totalCosts, confirmed, total };
  }, [selectedContext, buildPropertyTaxData]);

  const handleContextSelect = (ctxId: string) => {
    if (viewMode === 'bwa') {
      setSelectedContextId(selectedContextId === ctxId ? null : ctxId);
    } else {
      if (selectedContextId === ctxId) { setSelectedContextId(null); setShowErklaerung(false); }
      else {
        setSelectedContextId(ctxId); setShowErklaerung(false);
        const ctx = contexts.find((c: any) => c.id === ctxId);
        if (ctx?.properties?.length > 0) setOpenAccordions({ [ctx.properties[0].id]: true });
      }
    }
  };

  const handleBack = () => { showErklaerung ? setShowErklaerung(false) : setSelectedContextId(null); };

  return (
    <PageShell>
      <ModulePageHeader
        title="Tax"
        description={viewMode === 'anlageV' ? "Anlage V — Vermietung & Verpachtung für deine Steuererklärung" : "BWA — Bewirtschaftungsanalyse auf Vermietereinheit-Ebene"}
        actions={
          <div className="flex items-center gap-3">
            {selectedContextId && viewMode === 'anlageV' && (
              <Button variant="ghost" size="sm" onClick={handleBack}><ChevronLeft className="h-4 w-4 mr-1" /> Zurück</Button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
              <FileText className={cn("h-3.5 w-3.5", viewMode === 'anlageV' ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn("text-xs font-medium", viewMode === 'anlageV' ? 'text-foreground' : 'text-muted-foreground')}>Anlage V</span>
              <Switch checked={viewMode === 'bwa'} onCheckedChange={(checked) => { setViewMode(checked ? 'bwa' : 'anlageV'); setShowErklaerung(false); }} />
              <BarChart3 className={cn("h-3.5 w-3.5", viewMode === 'bwa' ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn("text-xs font-medium", viewMode === 'bwa' ? 'text-foreground' : 'text-muted-foreground')}>BWA</span>
            </div>
            {viewMode === 'anlageV' && (
              <Select value={String(taxYear)} onValueChange={v => { setTaxYear(Number(v)); setShowErklaerung(false); }}>
                <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{YEAR_OPTIONS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        }
      />

      {/* Context Grid — shared between both modes */}
      <VerwaltungContextGrid contexts={contexts} selectedContextId={selectedContextId} mode={viewMode} onSelect={handleContextSelect} />

      {/* Empty State */}
      {contexts.length === 0 && !isLoading && (
        <Card className={DESIGN.CARD.SECTION}>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {viewMode === 'bwa' ? 'Keine Vermietereinheiten gefunden.' : 'Keine Vermietereinheiten mit Objekten gefunden. Legen Sie Objekte im Portfolio an und weisen Sie diese einer Vermietereinheit zu.'}
            </p>
            {viewMode === 'anlageV' && (
              <Button variant="link" className="mt-2" onClick={() => window.location.href = '/portal/immobilien/portfolio'}>Zum Portfolio →</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* BWA Detail */}
      {viewMode === 'bwa' && selectedContext && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">BWA — {selectedContext.name}</h3>
          <BWATab propertyIds={selectedContext.properties.map((p: any) => p.id)} veName={selectedContext.name} tenantId={selectedContext.properties[0]?.tenant_id || ''} />
        </div>
      )}

      {/* Anlage V: Property Accordions + Gesamtergebnis */}
      {viewMode === 'anlageV' && selectedContext && !showErklaerung && (
        <>
          <WorkflowStepProgress steps={[
            { label: 'Vermietereinheit wählen', status: 'done' },
            { label: 'Objekte bearbeiten', description: `${gesamtErgebnis?.confirmed ?? 0}/${gesamtErgebnis?.total ?? 0} bestätigt`, status: gesamtErgebnis?.confirmed === gesamtErgebnis?.total ? 'done' : 'active' },
            { label: 'Plausibilität prüfen', description: 'KI-Prüfung pro Objekt durchführen', status: gesamtErgebnis?.confirmed === gesamtErgebnis?.total ? 'done' : 'pending' },
            { label: 'Steuererklärung erzeugen', description: 'Anlage V generieren und exportieren', status: showErklaerung ? 'done' : 'pending' },
          ]} />
          <div className="flex items-center gap-2"><h3 className="text-base font-semibold">{selectedContext.name} — Objekte ({taxYear})</h3></div>
          <VerwaltungPropertyAccordion
            properties={selectedContext.properties} openAccordions={openAccordions}
            contextTaxNumber={selectedContext.tax_number || ''}
            buildPropertyTaxData={buildPropertyTaxData}
            onToggle={(propId) => setOpenAccordions(prev => ({ ...prev, [propId]: !prev[propId] }))}
            onSave={save} isSaving={isSaving}
          />
          {gesamtErgebnis && (
            <VerwaltungGesamtergebnis ergebnis={gesamtErgebnis} contextName={selectedContext.name} onGenerateErklaerung={() => setShowErklaerung(true)} />
          )}
        </>
      )}

      {/* Erklaerung View */}
      {showErklaerung && erklaerungSummary && <VVErklaerungView summary={erklaerungSummary} />}
    </PageShell>
  );
}

export default VerwaltungTab;
