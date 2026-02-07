/**
 * FM Kommunikation — Message Log
 * 
 * Displays communication timeline with customers:
 * - Customer queries triggered via "Rückfrage an Kunden" in FMFallDetail
 * - Status change notes
 * - Audit trail of interactions
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, User, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
}

interface CommunicationEvent {
  id: string;
  caseId: string;
  publicId: string | null;
  customerName: string | null;
  type: 'query' | 'status_change' | 'note';
  content: string;
  createdAt: string;
  isCustomerAction?: boolean;
}

export default function FMKommunikation({ cases }: Props) {
  // Fetch audit events for FIN_ related events
  const { data: auditEvents, isLoading } = useQuery({
    queryKey: ['finance-communication-events', cases.map(c => c.id)],
    queryFn: async () => {
      if (cases.length === 0) return [];
      
      // Get request IDs from cases
      const requestIds = cases
        .map(c => c.finance_mandates?.finance_request_id)
        .filter(Boolean) as string[];
      
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

  // Build communication events from cases + audit
  const messages: CommunicationEvent[] = [];
  
  // Add events from notes on mandates
  cases.forEach(c => {
    const mandate = c.finance_mandates;
    if (mandate?.notes) {
      messages.push({
        id: `note-${c.id}`,
        caseId: c.id,
        publicId: mandate.public_id || null,
        customerName: mandate.object_address || null,
        type: 'note',
        content: mandate.notes,
        createdAt: c.updated_at || c.created_at,
      });
    }
    
    // Add status change events
    if (c.status === 'missing_docs') {
      messages.push({
        id: `query-${c.id}`,
        caseId: c.id,
        publicId: mandate?.public_id || null,
        customerName: mandate?.object_address || null,
        type: 'query',
        content: 'Rückfrage gesendet: Fehlende Dokumente angefordert',
        createdAt: c.updated_at || c.created_at,
        isCustomerAction: true,
      });
    }
  });

  // Sort by date
  messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Stats
  const pendingQueries = messages.filter(m => m.type === 'query' && m.isCustomerAction).length;
  const totalMessages = messages.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalMessages}</div>
                <div className="text-sm text-muted-foreground">Nachrichten gesamt</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingQueries}</div>
                <div className="text-sm text-muted-foreground">Offene Rückfragen</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent rounded-lg">
                <CheckCircle className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">{cases.filter(c => c.status === 'active').length}</div>
                <div className="text-sm text-muted-foreground">Aktive Fälle</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Kommunikationsverlauf
          </CardTitle>
          <CardDescription>
            Rückfragen, Statusänderungen und Notizen zu Ihren Fällen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Keine Nachrichten vorhanden</p>
              <p className="text-sm mt-2">
                Rückfragen an Kunden erscheinen hier automatisch, sobald Sie diese in der Fallbearbeitung stellen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const typeConfig = {
                  query: { icon: Send, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rückfrage' },
                  status_change: { icon: Clock, color: 'text-secondary-foreground', bg: 'bg-secondary', label: 'Status' },
                  note: { icon: User, color: 'text-primary', bg: 'bg-primary/10', label: 'Notiz' },
                }[msg.type];
                
                const Icon = typeConfig.icon;

                return (
                  <div key={msg.id} className="flex gap-3 p-4 rounded-lg border hover:border-primary/30 transition-colors">
                    <div className={`h-10 w-10 rounded-full ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">
                          {msg.publicId || `Fall ${msg.caseId.slice(0, 8)}`}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                        {msg.isCustomerAction && (
                          <Badge variant="secondary" className="text-xs">
                            Wartet auf Kunde
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(msg.createdAt), { 
                            addSuffix: true, 
                            locale: de 
                          })}
                        </span>
                      </div>
                      {msg.customerName && (
                        <p className="text-xs text-muted-foreground mb-1">{msg.customerName}</p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
