/**
 * AcquiaryAudit — Event Timeline / Audit Log
 * 
 * Shows all mandate events for governance oversight
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ClipboardList, Loader2, Search, User, FileText, 
  Users, Mail, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import { useAllAcqMandateEvents } from '@/hooks/useAcqMandate';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const EVENT_TYPE_CONFIG: Record<string, { icon: any; label: string; variant: string }> = {
  created: { icon: FileText, label: 'Erstellt', variant: 'outline' },
  submitted: { icon: CheckCircle2, label: 'Eingereicht', variant: 'secondary' },
  assigned: { icon: Users, label: 'Zugewiesen', variant: 'default' },
  accepted: { icon: CheckCircle2, label: 'Angenommen', variant: 'default' },
  split_confirmed: { icon: CheckCircle2, label: 'Split bestätigt', variant: 'default' },
  status_changed: { icon: Clock, label: 'Status geändert', variant: 'outline' },
  email_sent: { icon: Mail, label: 'E-Mail gesendet', variant: 'outline' },
  email_received: { icon: Mail, label: 'E-Mail empfangen', variant: 'outline' },
  offer_created: { icon: FileText, label: 'Angebot erstellt', variant: 'outline' },
  analysis_completed: { icon: CheckCircle2, label: 'Analyse abgeschlossen', variant: 'secondary' },
};

export default function AcquiaryAudit() {
  const { data: events, isLoading } = useAllAcqMandateEvents();
  const [search, setSearch] = React.useState('');

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    if (!search) return events;
    const searchLower = search.toLowerCase();
    return events.filter(e => 
      e.event_type?.toLowerCase().includes(searchLower) ||
      (e.payload as any)?.message?.toLowerCase().includes(searchLower)
    );
  }, [events, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Events durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Events</h3>
              <p className="text-muted-foreground">
                {search ? 'Keine Events gefunden.' : 'Es wurden noch keine Mandate-Events aufgezeichnet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            
            {filteredEvents.map((event, index) => {
              const config = EVENT_TYPE_CONFIG[event.event_type] || {
                icon: Clock,
                label: event.event_type,
                variant: 'outline'
              };
              const Icon = config.icon;
              
              return (
                <div key={event.id} className="relative pl-14 pb-6">
                  {/* Timeline dot */}
                  <div className="absolute left-4 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <Icon className="h-3 w-3 text-primary" />
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={config.variant as any}>
                              {config.label}
                            </Badge>
                            <span className="font-mono text-sm text-muted-foreground">
                              {/* TODO: Show mandate code */}
                            </span>
                          </div>
                          {(event.payload as any)?.message && (
                            <p className="text-sm mt-1">
                              {(event.payload as any).message}
                            </p>
                          )}
                          {(event.payload as any)?.old_status && (event.payload as any)?.new_status && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Status: {(event.payload as any).old_status} → {(event.payload as any).new_status}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{format(new Date(event.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                          <div>{formatDistanceToNow(new Date(event.created_at), { locale: de, addSuffix: true })}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
