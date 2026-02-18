/**
 * StorageExtractionCard — Datenraum-Extraktion mit Scan/Angebot/Freigabe-Flow
 * Ruft sot-storage-extractor Edge Function auf.
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScanSearch, Play, XCircle, Loader2, Bot, Database, Receipt, FileSearch, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ScanResult {
  total_files: number;
  already_extracted: number;
  to_process: number;
  estimated_credits: number;
  estimated_minutes: number;
}

interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  total_files: number;
  processed_count: number;
  failed_count: number;
  progress_percent: number;
}

interface Props {
  tenantId: string | null;
}

export function StorageExtractionCard({ tenantId }: Props) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // ── Scan ──
  const scanMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-storage-extractor', {
        body: { action: 'scan', tenant_id: tenantId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Scan fehlgeschlagen');
      return data;
    },
    onSuccess: (data) => {
      setScanResult({
        total_files: data.total_files ?? 0,
        already_extracted: data.already_extracted ?? 0,
        to_process: data.to_process ?? 0,
        estimated_credits: data.estimated_credits ?? data.to_process ?? 0,
        estimated_minutes: Math.max(1, Math.ceil((data.to_process ?? 0) / 5)),
      });
    },
    onError: (e: Error) => toast.error(`Scan fehlgeschlagen: ${e.message}`),
  });

  // ── Start ──
  const startMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-storage-extractor', {
        body: { action: 'start', tenant_id: tenantId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Start fehlgeschlagen');
      return data;
    },
    onSuccess: (data) => {
      setJobStatus({
        job_id: data.job_id,
        status: 'processing',
        total_files: scanResult?.to_process ?? 0,
        processed_count: 0,
        failed_count: 0,
        progress_percent: 0,
      });
      setIsPolling(true);
      toast.success('Extraktion gestartet');
    },
    onError: (e: Error) => toast.error(`Start fehlgeschlagen: ${e.message}`),
  });

  // ── Cancel ──
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!jobStatus?.job_id) return;
      const { data, error } = await supabase.functions.invoke('sot-storage-extractor', {
        body: { action: 'cancel', tenant_id: tenantId, job_id: jobStatus.job_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsPolling(false);
      setJobStatus((prev) => prev ? { ...prev, status: 'cancelled' } : null);
      toast.info('Extraktion abgebrochen');
    },
  });

  // ── Polling ──
  const pollStatus = useCallback(async () => {
    if (!jobStatus?.job_id || !tenantId) return;
    try {
      const { data, error } = await supabase.functions.invoke('sot-storage-extractor', {
        body: { action: 'status', tenant_id: tenantId, job_id: jobStatus.job_id },
      });
      if (error || !data?.success) return;
      const newStatus: JobStatus = {
        job_id: jobStatus.job_id,
        status: data.status ?? 'processing',
        total_files: data.total_files ?? jobStatus.total_files,
        processed_count: data.processed_count ?? 0,
        failed_count: data.failed_count ?? 0,
        progress_percent: data.progress_percent ?? 0,
      };
      setJobStatus(newStatus);
      if (['completed', 'cancelled', 'failed'].includes(newStatus.status)) {
        setIsPolling(false);
        if (newStatus.status === 'completed') {
          toast.success(`Extraktion abgeschlossen: ${newStatus.processed_count} Dokumente verarbeitet`);
        }
      }
    } catch {
      // silent retry
    }
  }, [jobStatus?.job_id, tenantId]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [isPolling, pollStatus]);

  const isExtracting = jobStatus?.status === 'processing';
  const isDone = jobStatus?.status === 'completed';
  const isCancelled = jobStatus?.status === 'cancelled';

  const resetFlow = () => {
    setScanResult(null);
    setJobStatus(null);
    setIsPolling(false);
  };

  return (
    <Card className="glass-card flex flex-col overflow-hidden">
      <div className="p-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <ScanSearch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Datenraum-Extraktion</h3>
            <p className="text-xs text-muted-foreground">Bestehende Dateien für Armstrong durchsuchbar machen</p>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-6 space-y-5">
        {/* Explanation */}
        <p className="text-sm text-muted-foreground">
          Scannen Sie Ihren gesamten Datenraum und machen Sie alle Dokumente für Armstrong durchsuchbar.
          Sie erhalten einen Kostenvoranschlag bevor Credits berechnet werden.
        </p>

        {/* ── State: Initial ── */}
        {!scanResult && !jobStatus && (
          <Button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending || !tenantId}
            className="w-full"
          >
            {scanMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Datenraum wird gescannt…</>
            ) : (
              <><ScanSearch className="h-4 w-4 mr-2" /> Datenraum scannen</>
            )}
          </Button>
        )}

        {/* ── State: Scan Result (Angebot) ── */}
        {scanResult && !jobStatus && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-3">
              <p className="text-sm font-medium text-foreground">Scan-Ergebnis</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Dokumente gesamt</p>
                  <p className="font-medium text-foreground">{scanResult.total_files}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bereits extrahiert</p>
                  <p className="font-medium text-foreground">{scanResult.already_extracted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Zu verarbeiten</p>
                  <p className="font-medium text-primary">{scanResult.to_process}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Geschätzte Dauer</p>
                  <p className="font-medium text-foreground">~{scanResult.estimated_minutes} Min.</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-primary/10 bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">Geschätzte Kosten</span>
                <Badge variant="outline" className="font-mono">
                  {scanResult.estimated_credits} Credits ({(scanResult.estimated_credits * 0.25).toFixed(2)} €)
                </Badge>
              </div>
            </div>

            {scanResult.to_process === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <CheckCircle className="h-4 w-4 text-primary" />
                <p className="text-sm text-foreground">Alle Dokumente sind bereits extrahiert!</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetFlow} className="flex-1">
                  Abbrechen
                </Button>
                <Button
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  className="flex-1"
                >
                  {startMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Extraktion starten
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── State: Extracting ── */}
        {isExtracting && jobStatus && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fortschritt</span>
                <span className="font-medium text-foreground">
                  {jobStatus.processed_count} / {jobStatus.total_files}
                </span>
              </div>
              <Progress value={jobStatus.progress_percent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {jobStatus.progress_percent}% abgeschlossen
                {jobStatus.failed_count > 0 && ` · ${jobStatus.failed_count} fehlgeschlagen`}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="w-full text-destructive hover:text-destructive"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Extraktion abbrechen
            </Button>
          </div>
        )}

        {/* ── State: Done / Cancelled ── */}
        {(isDone || isCancelled) && jobStatus && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
              {isDone ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <p className="text-sm text-foreground">
                {isDone
                  ? `${jobStatus.processed_count} Dokumente erfolgreich extrahiert`
                  : 'Extraktion abgebrochen'}
                {jobStatus.failed_count > 0 && ` · ${jobStatus.failed_count} fehlgeschlagen`}
              </p>
            </div>
            <Button variant="outline" onClick={resetFlow} className="w-full">
              Neuen Scan starten
            </Button>
          </div>
        )}

        {/* NK-Beleg-Parsing */}
        <div className="p-3 rounded-xl border border-border/50 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">NK-Beleg-Parsing</p>
            <Badge variant="outline" className="text-xs font-mono">1 Credit</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Spezialisierter Parser für Nebenkostenbelege: Erkennt automatisch Versorger, Betrag, Zeitraum und Kostenkategorie.
          </p>
        </div>

        {/* Armstrong Examples */}
        <div className="p-3 rounded-xl bg-muted/50 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Armstrong kann dann z.B.:</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• „Durchsuche alle Dokumente nach Kündigungsfristen"</p>
            <p>• „Erstelle eine Übersicht aller Versicherungspolicen"</p>
            <p>• „Finde alle Nebenkostenabrechnungen der letzten 3 Jahre"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
