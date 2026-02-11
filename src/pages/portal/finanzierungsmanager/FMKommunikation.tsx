/**
 * FM Kommunikation — Clean communication timeline, no counters
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
}

interface CommunicationEvent {
  id: string;
  caseId: string;
  publicId: string | null;
  type: 'query' | 'status_change' | 'note';
  content: string;
  createdAt: string;
  isCustomerAction?: boolean;
}

export default function FMKommunikation({ cases }: Props) {
  const { data: auditEvents, isLoading } = useQuery({
    queryKey: ['finance-communication-events', cases.map(c => c.id)],
    queryFn: async () => {
      if (cases.length === 0) return [];
      const requestIds = cases.map(c => c.finance_mandates?.finance_request_id).filter(Boolean) as string[];
      if (requestIds.length === 0) return [];
      const { data } = await supabase
        .from('audit_events')
        .select('*')
        .in('event_type', ['FIN_SUBMIT', 'FIN_STATUS_CHANGE', 'FIN_CUSTOMER_QUERY'])
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: cases.length > 0,
  });

  const messages: CommunicationEvent[] = [];
  cases.forEach(c => {
    const mandate = c.finance_mandates;
    if (mandate?.notes) {
      messages.push({
        id: `note-${c.id}`, caseId: c.id, publicId: mandate.public_id || null,
        type: 'note', content: mandate.notes, createdAt: c.updated_at || c.created_at,
      });
    }
    if (c.status === 'missing_docs') {
      messages.push({
        id: `query-${c.id}`, caseId: c.id, publicId: mandate?.public_id || null,
        type: 'query', content: 'Rückfrage: Fehlende Dokumente',
        createdAt: c.updated_at || c.created_at, isCustomerAction: true,
      });
    }
  });
  messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading) {
    return <PageShell><div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  return (
    <PageShell>
      <ModulePageHeader title="KOMMUNIKATION" description="Rückfragen, Statusänderungen und Nachrichten zu Ihren Fällen." />

      <Card className="glass-card">
        <CardContent className="p-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Keine Nachrichten vorhanden</p>
              <p className="text-xs mt-1">Rückfragen erscheinen hier automatisch.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(msg => {
                const cfg = {
                  query: { icon: Send, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rückfrage' },
                  status_change: { icon: Clock, color: 'text-secondary-foreground', bg: 'bg-secondary', label: 'Status' },
                  note: { icon: User, color: 'text-primary', bg: 'bg-primary/10', label: 'Notiz' },
                }[msg.type];
                const Icon = cfg.icon;
                return (
                  <div key={msg.id} className="flex gap-3 py-2 px-3 rounded-md border hover:border-primary/30 transition-colors">
                    <div className={`h-7 w-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{msg.publicId || msg.caseId.slice(0, 8)}</span>
                        <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                        {msg.isCustomerAction && <Badge variant="secondary" className="text-[10px]">Wartet</Badge>}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: de })}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
