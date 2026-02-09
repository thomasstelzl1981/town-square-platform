import { useState } from 'react';
import { useAuditJobs, useCreateJob, useUpdateJob } from './useAuditJobs';
import { useCreateReport } from './useAuditReports';
import { runInAppAudit } from './inAppAuditRunner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const JOB_STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  queued: 'outline',
  running: 'secondary',
  succeeded: 'default',
  failed: 'destructive',
};

export default function AuditRunTab() {
  const { profile } = useAuth();
  const { data: jobs, isLoading } = useAuditJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const createReport = useCreateReport();
  const [running, setRunning] = useState(false);

  const handleRunAudit = async () => {
    setRunning(true);
    try {
      // Create job entry
      const job = await createJob.mutateAsync({
        status: 'running',
        job_type: 'IN_APP',
        triggered_by: profile?.id || null,
        started_at: new Date().toISOString(),
      });

      // Run audit
      const result = await runInAppAudit();
      const today = new Date().toISOString().split('T')[0];

      // Save report
      const report = await createReport.mutateAsync({
        title: `In-App Audit — ${today}`,
        status: result.status,
        counts: result.counts as any,
        content_md: result.markdown,
        created_by: profile?.id || null,
      });

      // Upload to storage
      const mdBlob = new Blob([result.markdown], { type: 'text/markdown' });
      const storagePath = `${today}/${report.id}/report.md`;
      await supabase.storage.from('audit-reports').upload(storagePath, mdBlob, { upsert: true });

      // Update job
      await updateJob.mutateAsync({
        id: job.id,
        status: 'succeeded',
        finished_at: new Date().toISOString(),
        audit_report_id: report.id,
      });

      toast.success(`Audit abgeschlossen: ${result.status}`);
    } catch (err: any) {
      toast.error(`Audit fehlgeschlagen: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">In-App Audit starten</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Prüft Manifest-Routen, Tile-Catalog-Konsistenz und Route-Health. Erzeugt einen Report.
          </p>
          <Button onClick={handleRunAudit} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Audit läuft...' : 'Run In-App Audit'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (jobs || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Jobs vorhanden.</p>
          ) : (
            <div className="grid gap-3">
              {(jobs || []).map(job => (
                <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant={JOB_STATUS_BADGE[job.status] || 'outline'}>{job.status}</Badge>
                    <span className="text-xs font-mono text-muted-foreground">{job.job_type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(job.created_at), 'dd.MM. HH:mm', { locale: de })}
                    </span>
                    {job.finished_at && job.started_at && (
                      <span>{Math.round((new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()) / 1000)}s</span>
                    )}
                    {job.audit_report_id && (
                      <span className="inline-flex items-center gap-0.5 text-primary">
                        Report <ExternalLink className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
