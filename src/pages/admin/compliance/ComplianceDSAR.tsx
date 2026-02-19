/**
 * Tab 8: DSAR Requests — Auskunftsanfragen Art. 15 DSGVO
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UserSearch, ChevronDown, Save } from 'lucide-react';
import { LoadingState } from '@/components/shared';
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  const handleOpen = (r: typeof requests[0]) => {
    if (openId === r.id) {
      setOpenId(null);
    } else {
      setOpenId(r.id);
      setEditNotes(r.notes || '');
    }
  };

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
                <Collapsible key={r.id} open={openId === r.id} onOpenChange={() => handleOpen(r)}>
                  <div className="rounded-lg border">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/20">
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
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: r.id, status: 'in_progress' }); }}>Bearbeiten</Button>
                          )}
                          {r.status === 'in_progress' && (
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: r.id, status: 'delivered' }); }}>Zugestellt</Button>
                          )}
                          {r.status === 'delivered' && (
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: r.id, status: 'closed' }); }}>Schließen</Button>
                          )}
                          <ChevronDown className={`h-4 w-4 transition-transform ${openId === r.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-0 space-y-3 border-t">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Interne Notizen</label>
                          <Textarea
                            value={editNotes}
                            onChange={e => setEditNotes(e.target.value)}
                            placeholder="Bearbeitungsnotizen, Kommunikation, Export-Plan..."
                            className="min-h-[120px] text-sm mt-1"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => updateStatus.mutate({ id: r.id, status: r.status, notes: editNotes })}
                            disabled={updateStatus.isPending}
                          >
                            <Save className="h-3 w-3 mr-1" /> Notizen speichern
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
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
