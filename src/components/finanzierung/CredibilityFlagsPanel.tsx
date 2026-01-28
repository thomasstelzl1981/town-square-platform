import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, AlertCircle, Info, CheckCircle2, 
  X, Loader2, FileText 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CredibilityFlag, FlagSeverity } from '@/types/finance';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CredibilityFlagsPanelProps {
  applicantProfileId: string;
  tenantId: string;
}

const severityConfig: Record<FlagSeverity, { icon: React.ReactNode; color: string; label: string }> = {
  info: { icon: <Info className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600', label: 'Info' },
  warn: { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-600', label: 'Warnung' },
  block: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-500/10 text-red-600', label: 'Blockierend' },
};

const flagTypeLabels: Record<string, string> = {
  income_mismatch: 'Einkommensabweichung',
  missing_doc: 'Dokument fehlt',
  expired_doc: 'Dokument abgelaufen',
  period_gap: 'Zeitraumlücke',
  employer_mismatch: 'Arbeitgeberabweichung',
};

export function CredibilityFlagsPanel({ applicantProfileId, tenantId }: CredibilityFlagsPanelProps) {
  const queryClient = useQueryClient();
  const [resolveDialogOpen, setResolveDialogOpen] = React.useState(false);
  const [selectedFlag, setSelectedFlag] = React.useState<CredibilityFlag | null>(null);
  const [resolutionNote, setResolutionNote] = React.useState('');

  const { data: flags, isLoading } = useQuery({
    queryKey: ['credibility-flags', applicantProfileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credibility_flags')
        .select('*')
        .eq('applicant_profile_id', applicantProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CredibilityFlag[];
    },
    enabled: !!applicantProfileId,
  });

  const resolveFlag = useMutation({
    mutationFn: async ({ flagId, note }: { flagId: string; note: string }) => {
      const { error } = await supabase
        .from('credibility_flags')
        .update({
          resolved: true,
          resolution_note: note,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', flagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credibility-flags'] });
      toast.success('Flag als gelöst markiert');
      setResolveDialogOpen(false);
      setSelectedFlag(null);
      setResolutionNote('');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const handleResolve = (flag: CredibilityFlag) => {
    setSelectedFlag(flag);
    setResolveDialogOpen(true);
  };

  const handleConfirmResolve = () => {
    if (selectedFlag) {
      resolveFlag.mutate({ flagId: selectedFlag.id, note: resolutionNote });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const unresolvedFlags = flags?.filter(f => !f.resolved) || [];
  const resolvedFlags = flags?.filter(f => f.resolved) || [];

  if (unresolvedFlags.length === 0 && resolvedFlags.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Keine Auffälligkeiten erkannt</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Alle Angaben sind konsistent. Es wurden keine Unstimmigkeiten gefunden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Bonitätswächter
          </CardTitle>
          <CardDescription>
            Automatisch erkannte Unstimmigkeiten in den Unterlagen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Unresolved Flags */}
          {unresolvedFlags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Offen ({unresolvedFlags.length})</h4>
              {unresolvedFlags.map((flag) => {
                const config = severityConfig[flag.severity as FlagSeverity] || severityConfig.warn;
                return (
                  <div
                    key={flag.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {flagTypeLabels[flag.flag_type] || flag.flag_type}
                          </span>
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                        </div>
                        {flag.field_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Feld: {flag.field_name}
                          </p>
                        )}
                        {flag.declared_value && flag.detected_value && (
                          <p className="text-sm mt-1">
                            <span className="text-muted-foreground">Angegeben:</span>{' '}
                            <span className="font-mono">{flag.declared_value}</span>
                            {' → '}
                            <span className="text-muted-foreground">Erkannt:</span>{' '}
                            <span className="font-mono">{flag.detected_value}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(flag)}
                    >
                      Lösen
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Resolved Flags */}
          {resolvedFlags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Gelöst ({resolvedFlags.length})</h4>
              {resolvedFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-muted/50 opacity-60"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <span className="font-medium">
                      {flagTypeLabels[flag.flag_type] || flag.flag_type}
                    </span>
                    {flag.resolution_note && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {flag.resolution_note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag als gelöst markieren</DialogTitle>
            <DialogDescription>
              Beschreiben Sie kurz, wie das Problem gelöst wurde.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Lösung / Anmerkung..."
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirmResolve} disabled={resolveFlag.isPending}>
              {resolveFlag.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Als gelöst markieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
