/**
 * Tab 8: DSAR Requests — Auskunftsanfragen Art. 15 DSGVO
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserSearch } from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/shared';
import { useDSARRequests } from './useComplianceCases';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-700 border-amber-200',
  verifying: 'bg-blue-500/10 text-blue-700 border-blue-200',
  in_progress: 'bg-violet-500/10 text-violet-700 border-violet-200',
  delivered: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  closed: 'bg-muted text-muted-foreground',
};

export function ComplianceDSAR() {
  const { requests, isLoading, updateStatus } = useDSARRequests();

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserSearch className="h-5 w-5" /> DSAR Anfragen (Art. 15 DSGVO)
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
                      {r.request_type} · {new Date(r.created_at).toLocaleDateString('de-DE')}
                      {r.due_date && ` · Frist: ${new Date(r.due_date).toLocaleDateString('de-DE')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[r.status] || ''}>{r.status}</Badge>
                    {r.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: 'in_progress' })}>Bearbeiten</Button>
                    )}
                    {r.status === 'in_progress' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: 'delivered' })}>Zugestellt</Button>
                    )}
                    {r.status === 'delivered' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: r.id, status: 'closed' })}>Schließen</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">Keine DSAR-Anfragen vorhanden.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
