/**
 * StorageExtractionCard — Datenraum für Armstrong aktivieren
 * Marketing-fokussierte Kachel mit Scan/Angebot/Freigabe/Abarbeitung-Flow
 * Now supports cloud sources via CloudSourcePicker.
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScanSearch, Play, XCircle, Loader2, Bot, CheckCircle, Brain, Upload, Clock, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CloudSourcePicker, type CloudSourceSelection } from '@/components/dms/CloudSourcePicker';
import { useCloudSync } from '@/hooks/useCloudSync';

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

const VALUE_PROPOSITIONS = [
  {
    icon: Upload,
    title: 'Kein manuelles Hochladen',
    text: 'Keine Copy-Paste-Schleifen wie bei ChatGPT oder Copilot. Armstrong liest direkt aus Ihrem Datenraum.',
  },
  {
    icon: Clock,
    title: 'Einmal aktivieren, dauerhaft nutzen',
    text: 'Einmalige Extraktion — danach hat Armstrong sofortigen Zugriff auf alle Inhalte.',
  },
  {
    icon: Shield,
    title: 'Volle Kostenkontrolle',
    text: 'Sie sehen den Kostenvoranschlag vorher und entscheiden, ob Sie freigeben.',
  },
];

const ARMSTRONG_EXAMPLES = [
  '„Fasse alle Mietverträge zusammen und zeige die Kündigungsfristen"',
  '„Erstelle eine Übersicht aller Versicherungspolicen mit Prämien"',
  '„Vergleiche die Nebenkostenabrechnungen 2024 und 2025"',
  '„Welche Dokumente betreffen die Immobilie Musterstr. 5?"',
  '„Finde alle offenen Rechnungen der letzten 12 Monate"',
];

export function StorageExtractionCard({ tenantId }: Props) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [sourceSelection, setSourceSelection] = useState<CloudSourceSelection>({ source: 'storage', mode: 'sync_first' });
  const { listFiles, syncNow, analyzeCloud, isSyncing: isCloudSyncing } = useCloudSync();

  // ── Cloud file count ──
  const cloudScanMutation = useMutation({
    mutationFn: async () => {
      const result = await listFiles();
      return result;
    },
    onSuccess: (data) => {
      setScanResult({
        total_files: data.total,
        already_extracted: 0,
        to_process: data.total,
        estimated_credits: data.total,
        estimated_minutes: Math.max(1, Math.ceil(data.total / 5)),
      });
    },
    onError: (e: Error) => toast.error(`Cloud-Scan fehlgeschlagen: ${e.message}`),
  });

  // ── Scan (DMS Storage) ──
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

  const handleScan = useCallback(() => {
    if (sourceSelection.source === 'cloud') {
      cloudScanMutation.mutate();
    } else {
      scanMutation.mutate();
    }
  }, [sourceSelection, cloudScanMutation, scanMutation]);

  // ── Start (DMS Storage) ──
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

  const handleStart = useCallback(async () => {
    if (sourceSelection.source === 'cloud') {
      if (sourceSelection.mode === 'sync_first') {
        await syncNow();
      }
      await analyzeCloud();
      setScanResult(null);
      toast.success('Cloud-Analyse abgeschlossen');
    } else {
      startMutation.mutate();
    }
  }, [sourceSelection, syncNow, analyzeCloud, startMutation]);

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
    <Card className="glass-card flex flex-col overflow-hidden md:col-span-2 lg:col-span-3">
      <div className="p-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg">Datenraum für Armstrong aktivieren</h3>
            <p className="text-sm text-muted-foreground">Machen Sie Ihren gesamten Datenbestand für Ihre KI lesbar</p>
          </div>
        </div>
      </div>

      <CardContent className="flex-1 p-6 space-y-6">
        {/* ── Value Proposition ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VALUE_PROPOSITIONS.map((vp) => (
            <div key={vp.title} className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-2">
              <div className="flex items-center gap-2">
                <vp.icon className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-medium text-foreground">{vp.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">{vp.text}</p>
            </div>
          ))}
        </div>

        {/* ── Flow ── */}
        <div className="max-w-xl space-y-4">
          {/* State: Initial */}
          {!scanResult && !jobStatus && (
            <>
              <CloudSourcePicker onSelect={setSourceSelection} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {sourceSelection.source === 'cloud'
                  ? 'Zählen Sie die Dateien in Ihrem Cloud-Ordner, um einen Kostenvoranschlag zu erhalten.'
                  : 'Starten Sie einen Scan, um zu sehen, wie viele Dokumente verarbeitet werden können. Sie erhalten einen Kostenvoranschlag und entscheiden dann, ob Sie die Extraktion freigeben.'}
              </p>
              <Button
                onClick={handleScan}
                disabled={scanMutation.isPending || cloudScanMutation.isPending || !tenantId}
                size="lg"
              >
                {(scanMutation.isPending || cloudScanMutation.isPending) ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {sourceSelection.source === 'cloud' ? 'Cloud wird analysiert…' : 'Datenraum wird analysiert…'}</>
                ) : (
                  <><ScanSearch className="h-4 w-4 mr-2" /> {sourceSelection.source === 'cloud' ? 'Cloud-Ordner scannen' : 'Datenraum scannen'}</>
                )}
              </Button>
            </>
          )}

          {/* State: Scan Result (Kostenvoranschlag) */}
          {scanResult && !jobStatus && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-3">
                <p className="text-sm font-medium text-foreground">Kostenvoranschlag</p>
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
                    onClick={handleStart}
                    disabled={startMutation.isPending || isCloudSyncing}
                    className="flex-1"
                  >
                    {startMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Extraktion freigeben
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* State: Extracting */}
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

          {/* State: Done / Cancelled */}
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
        </div>

        {/* ── Was danach möglich ist ── */}
        <div className="p-4 rounded-xl bg-muted/50 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Was danach möglich ist</p>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Nach der Aktivierung kann Armstrong Ihren gesamten Datenraum lesen und analysieren — wie ein persönlicher Assistent mit Zugriff auf alle Ihre Dokumente:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ARMSTRONG_EXAMPLES.map((example) => (
              <div key={example} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span>{example}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
