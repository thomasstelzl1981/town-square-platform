/**
 * IntakeTab — Magic Intake Center main page.
 * Route: /portal/dms/intake
 *
 * Layout:
 * 1. Process Stepper (IntakeHowItWorks)
 * 2. Entity Picker + Upload Zone (with inline cost hint)
 * 3. Document Checklist (Live Progress)
 * 4. Konto-Intake (Contract detection from bank transactions)
 * 5. Recent Activity
 * 6. Link to Intelligenz tab
 */

import { useState, useCallback } from 'react';
import { Upload as UploadIcon, Sparkles, ArrowRight, Cloud, Loader2, ScanSearch } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { IntakeHowItWorks } from '@/components/dms/IntakeHowItWorks';
import { IntakeEntityPicker, type IntakeSelection } from '@/components/dms/IntakeEntityPicker';
import { IntakeUploadZone } from '@/components/dms/IntakeUploadZone';
import { IntakeChecklistGrid } from '@/components/dms/IntakeChecklistGrid';
import { IntakeRecentActivity } from '@/components/dms/IntakeRecentActivity';
import { CloudSourcePicker, type CloudSourceSelection } from '@/components/dms/CloudSourcePicker';
import { ContractDetectionDialog } from '@/components/shared/ContractDetectionDialog';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useContractCreation } from '@/hooks/useContractCreation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { detectRecurringContracts, type TransactionRow } from '@/engines/kontoMatch/recurring';
import type { DetectedContract } from '@/engines/kontoMatch/spec';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export function IntakeTab() {
  const [selection, setSelection] = useState<IntakeSelection | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [cloudSource, setCloudSource] = useState<CloudSourceSelection>({ source: 'storage', mode: 'sync_first' });
  const [isCloudImporting, setIsCloudImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedContracts, setDetectedContracts] = useState<DetectedContract[]>([]);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const { listFiles, syncNow, analyzeCloud, isConnected } = useCloudSync();
  const contractCreation = useContractCreation();
  const { activeTenantId } = useAuth();
  const navigate = useNavigate();

  // Check if FinAPI connections exist
  const { data: hasFinapiConnections } = useQuery({
    queryKey: ['finapi_connections_exist', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return false;
      const { data } = await supabase
        .from('finapi_connections')
        .select('id')
        .eq('tenant_id', activeTenantId)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!activeTenantId,
  });

  const handleUploadComplete = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleCloudImport = useCallback(async () => {
    setIsCloudImporting(true);
    try {
      if (cloudSource.mode === 'sync_first') {
        await syncNow();
      }
      await analyzeCloud();
      setRefreshKey((k) => k + 1);
    } finally {
      setIsCloudImporting(false);
    }
  }, [cloudSource, syncNow, analyzeCloud]);

  const handleAnalyzeTransactions = useCallback(async () => {
    if (!activeTenantId) return;
    setIsAnalyzing(true);
    try {
      // Load categorized transactions
      const { data: transactions, error } = await supabase
        .from('bank_transactions')
        .select('id, booking_date, amount_eur, counterparty, purpose_text, match_category, match_status')
        .eq('tenant_id', activeTenantId)
        .not('match_category', 'is', null)
        .order('booking_date', { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!transactions || transactions.length === 0) {
        toast.info('Keine kategorisierten Transaktionen gefunden. Bitte zuerst Konto-Matching durchführen.');
        return;
      }

      const results = detectRecurringContracts(transactions as TransactionRow[]);
      if (results.length === 0) {
        toast.info('Keine wiederkehrenden Zahlungsmuster erkannt.');
        return;
      }

      setDetectedContracts(results);
      setContractDialogOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Contract detection failed:', msg);
      toast.error('Fehler bei der Vertragsanalyse');
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeTenantId]);

  const handleConfirmContracts = useCallback((contracts: DetectedContract[]) => {
    contractCreation.mutate(contracts, {
      onSuccess: () => {
        setContractDialogOpen(false);
        setDetectedContracts([]);
        setRefreshKey((k) => k + 1);
      },
    });
  }, [contractCreation]);

  return (
    <PageShell>
      <ModulePageHeader
        title="Magic Intake"
        description="Dokumente hochladen — Armstrong erkennt und befüllt automatisch alle relevanten Felder"
      />

      <div className="space-y-8 max-w-4xl">
        {/* ── Block 1: Schrittleiste ── */}
        <IntakeHowItWorks />

        {/* ── Block 2: Entity-Picker + Upload ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UploadIcon className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dokument hochladen
            </h3>
            <span className="text-[10px] text-muted-foreground ml-auto">
              1 Credit / Dokument (0,25 €)
            </span>
          </div>
          <IntakeEntityPicker
            onSelectionComplete={setSelection}
            onReset={() => setSelection(null)}
          />
          <IntakeUploadZone
            selection={selection}
            onUploadComplete={handleUploadComplete}
          />
        </section>

        {/* ── Block 2b: Cloud-Import ── */}
        {isConnected && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Aus Cloud importieren
              </h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                1 Credit / Dokument
              </Badge>
            </div>
            <CloudSourcePicker onSelect={setCloudSource} />
            {cloudSource.source === 'cloud' && (
              <Button
                onClick={handleCloudImport}
                disabled={isCloudImporting}
                size="lg"
                className="w-full"
              >
                {isCloudImporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cloud-Dateien werden importiert…</>
                ) : (
                  <><Cloud className="h-4 w-4 mr-2" /> Cloud-Ordner importieren & analysieren</>
                )}
              </Button>
            )}
          </section>
        )}

        {/* ── Block 3: Konto-Intake (Contract Detection) ── */}
        {hasFinapiConnections && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ScanSearch className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Verträge aus Kontobewegungen
              </h3>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Wiederkehrende Zahlungen automatisch als Verträge erkennen — Abos, Versicherungen und Energieverträge werden aus deinen Kontobewegungen identifiziert.
              </p>
              <Button
                onClick={handleAnalyzeTransactions}
                disabled={isAnalyzing}
                variant="outline"
                className="w-full"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kontobewegungen werden analysiert…</>
                ) : (
                  <><ScanSearch className="h-4 w-4 mr-2" /> Kontobewegungen analysieren</>
                )}
              </Button>
            </div>
          </section>
        )}

        {/* ── Block 4: Dokument-Checkliste ── */}
        <IntakeChecklistGrid refreshKey={refreshKey} />

        {/* ── Block 5: Letzte Aktivität ── */}
        <IntakeRecentActivity />

        {/* ── Block 6: Link zur Intelligenz-Seite ── */}
        <button
          onClick={() => navigate('/portal/dms/intelligenz')}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Automatisch alle Dokumente verarbeiten? Zum Intelligenz-Tab
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Contract Detection Dialog ── */}
      <ContractDetectionDialog
        open={contractDialogOpen}
        onOpenChange={setContractDialogOpen}
        contracts={detectedContracts}
        onConfirm={handleConfirmContracts}
        isCreating={contractCreation.isPending}
      />
    </PageShell>
  );
}