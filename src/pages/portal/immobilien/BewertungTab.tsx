import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, FileText, Loader2 } from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { DESIGN } from '@/config/designManifest';
import { ValuationPreflight, ValuationPipeline, ValuationReportReader, generateValuationPdf } from '@/components/shared/valuation';
import { useValuationCase } from '@/hooks/useValuationCase';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function BewertungTab() {
  const { activeOrganization } = useAuth();
  const valuation = useValuationCase();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ['valuation-properties', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, code, address, city, property_type, market_value, year_built')
        .eq('tenant_id', activeOrganization!.id)
        .eq('status', 'active')
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrganization,
  });

  const { data: valuations, isLoading: valLoading } = useQuery({
    queryKey: ['valuation-cases-list', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valuation_cases')
        .select('id, status, source_mode, created_at, updated_at')
        .eq('tenant_id', activeOrganization!.id)
        .eq('status', 'final')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrganization,
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const completedValuations = valuations || [];
  const isValuationActive = valuation.state.status === 'running' || valuation.state.status === 'preflight';

  const handleSelectProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    valuation.reset();
  };

  const handlePreflight = () => {
    if (!selectedPropertyId) return;
    valuation.runPreflight({ propertyId: selectedPropertyId, sourceContext: 'MOD_04' });
  };

  const handleStart = () => {
    if (!selectedPropertyId) return;
    valuation.runValuation({ propertyId: selectedPropertyId, sourceContext: 'MOD_04' });
  };

  // Extract result data
  const result = valuation.state.resultData;
  const hasResult = result?.valueBand || result?.results;
  const resultObj = result?.results || result;

  const handleDownloadPdf = useCallback(async () => {
    if (!resultObj?.valueBand || !resultObj?.snapshot) return;
    try {
      await generateValuationPdf({
        snapshot: resultObj.snapshot,
        valueBand: resultObj.valueBand,
        methods: resultObj.methods || [],
        financing: resultObj.financing || [],
        stressTests: resultObj.stressTests || [],
        lienProxy: resultObj.lienProxy || null,
        dataQuality: resultObj.dataQuality || null,
        compStats: resultObj.compStats || null,
        comps: resultObj.comps || [],
        location: resultObj.location || null,
        executiveSummary: resultObj.executiveSummary || '',
        caseId: valuation.state.caseId || 'unknown',
        generatedAt: new Date().toISOString(),
      });
      toast.success('PDF erstellt');
    } catch (e) {
      console.error('PDF error:', e);
      toast.error('PDF-Erstellung fehlgeschlagen');
    }
  }, [resultObj, valuation.state.caseId]);

  return (
    <PageShell>
      <ModulePageHeader
        title="Bewertung"
        description="SoT Wertermittlung — KI-gestützte Bewertung mit deterministischem Rechenkern"
      />

      <div className={DESIGN.FORM_GRID.FULL}>
        {/* Left: Bewertbare Objekte */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <WidgetHeader icon={TrendingUp} title="Bewertbare Objekte" description="Objekte aus deinem Portfolio" />
              {propsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : properties && properties.length > 0 ? (
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead className="text-right">Verkehrswert</TableHead>
                      <TableHead className="w-[90px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((prop) => (
                      <TableRow
                        key={prop.id}
                        className={selectedPropertyId === prop.id ? 'bg-primary/5' : 'cursor-pointer hover:bg-muted/50'}
                        onClick={() => handleSelectProperty(prop.id)}
                      >
                        <TableCell className="font-mono text-xs">{prop.code || '–'}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{prop.address}</p>
                          <p className="text-xs text-muted-foreground">{prop.city}</p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {prop.property_type || '–'}
                          {prop.year_built ? ` · ${prop.year_built}` : ''}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(prop.market_value)}
                        </TableCell>
                        <TableCell>
                          {selectedPropertyId === prop.id && (
                            <Badge variant="secondary" className="text-[10px]">Gewählt</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Keine Objekte vorhanden</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Legen Sie zuerst Immobilien an, um Bewertungen zu starten.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valuation Preflight / Pipeline */}
          {selectedPropertyId && valuation.state.status !== 'running' && valuation.state.status !== 'final' && (
            <ValuationPreflight
              preflight={valuation.state.preflight}
              isLoading={valuation.isLoading}
              onCheckPreflight={handlePreflight}
              onStartValuation={handleStart}
            />
          )}

          {valuation.state.status === 'running' && (
            <ValuationPipeline
              stages={valuation.state.stages}
              currentStage={valuation.state.currentStage}
              status={valuation.state.status}
              error={valuation.state.error}
            />
          )}
        </div>

        {/* Right: Gutachten / Results */}
        <div className="space-y-4">
          {hasResult ? (
            <ValuationReportReader
              valueBand={resultObj?.valueBand || null}
              methods={resultObj?.methods || []}
              financing={resultObj?.financing || []}
              stressTests={resultObj?.stressTests || []}
              lienProxy={resultObj?.lienProxy || null}
              debtService={resultObj?.debtService || null}
              dataQuality={resultObj?.dataQuality || null}
              compStats={resultObj?.compStats || null}
              executiveSummary={resultObj?.executiveSummary}
              onDownloadPdf={handleDownloadPdf}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <WidgetHeader icon={FileText} title="Gutachten" description="Abgeschlossene Bewertungen & Reports" />
                {valLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : completedValuations.length > 0 ? (
                  <div className="space-y-3">
                    {completedValuations.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="h-14 w-11 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 border">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">PDF</Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium font-mono">{v.public_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {v.completed_at ? new Date(v.completed_at).toLocaleDateString('de-DE') : '–'}
                          </p>
                        </div>
                        <p className="text-sm font-semibold shrink-0">{formatCurrency(v.market_value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-10 text-center border border-dashed rounded-lg">
                    <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Noch keine Gutachten vorhanden</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Wählen Sie ein Objekt und starten Sie eine Bewertung.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
