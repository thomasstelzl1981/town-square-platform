/**
 * Tab 9: Deletion Requests — Löschanträge Art. 17 DSGVO
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import { useDeletionRequests } from './useComplianceCases';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-700 border-amber-200',
  verifying: 'bg-blue-500/10 text-blue-700 border-blue-200',
  scheduled: 'bg-violet-500/10 text-violet-700 border-violet-200',
  executed: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  closed: 'bg-muted text-muted-foreground',
};

export function ComplianceDeletion() {
  const { requests, isLoading, updateStatus } = useDeletionRequests();

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Löschanträge (Art. 17 DSGVO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{r.requester_email}</p>
                    <p className="text-xs text-muted-foreground">
                      Erstellt: {new Date(r.created_at).toLocaleDateString('de-DE')}
                      {r.executed_at && ` · Gelöscht: ${new Date(r.executed_at).toLocaleDateString('de-DE')}`}
                    </p>
                    {r.legal_hold_reason && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" /> Legal Hold: {r.legal_hold_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[r.status] || ''}>{r.status}</Badge>
                    {r.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: 'scheduled' })}>Einplanen</Button>
                    )}
                    {r.status === 'scheduled' && (
                      <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: r.id, status: 'executed' })}>Ausführen</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">Keine Löschanträge vorhanden.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
