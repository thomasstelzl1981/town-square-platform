/**
 * MOD-07: Status Tab
 * Shows timeline of all requests and manager contact when assigned
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, CheckCircle, Send, User, Building2,
  Loader2, Mail, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  type: 'created' | 'submitted' | 'delegated' | 'accepted' | 'bank_submitted' | 'response';
  date: string;
  title: string;
  description?: string;
}

export default function StatusTab() {
  const { activeOrganization } = useAuth();

  // Fetch requests with mandates
  const { data: requests, isLoading } = useQuery({
    queryKey: ['finance-requests-with-mandates', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];

      const { data, error } = await supabase
        .from('finance_requests')
        .select(`
          *,
          property:properties(id, address, city),
          mandate:finance_mandates(
            id, status, created_at, delegated_at, accepted_at,
            assigned_manager_id
          )
        `)
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrganization?.id,
  });

  // Fetch manager profile when assigned
  const { data: managerProfiles } = useQuery({
    queryKey: ['manager-profiles', requests],
    queryFn: async () => {
      const managerIds = requests
        ?.flatMap(r => r.mandate)
        .filter(m => m?.assigned_manager_id)
        .map(m => m.assigned_manager_id) || [];

      if (managerIds.length === 0) return {};

      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', managerIds);

      const map: Record<string, typeof data[0]> = {};
      data?.forEach(p => { map[p.id] = p; });
      return map;
    },
    enabled: !!requests && requests.length > 0,
  });

  // Build timeline for a request
  const buildTimeline = (request: typeof requests[0]): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const mandate = Array.isArray(request.mandate) ? request.mandate[0] : request.mandate;

    events.push({
      id: `${request.id}-created`,
      type: 'created',
      date: request.created_at,
      title: 'Anfrage erstellt',
      description: request.property 
        ? `${request.property.address}, ${request.property.city}`
        : 'Ohne Objektzuordnung',
    });

    if (request.submitted_at) {
      events.push({
        id: `${request.id}-submitted`,
        type: 'submitted',
        date: request.submitted_at,
        title: 'Anfrage eingereicht',
        description: 'Zur Bearbeitung weitergeleitet',
      });
    }

    if (mandate?.delegated_at) {
      events.push({
        id: `${request.id}-delegated`,
        type: 'delegated',
        date: mandate.delegated_at,
        title: 'Manager zugewiesen',
        description: 'Warten auf Annahme',
      });
    }

    if (mandate?.accepted_at) {
      events.push({
        id: `${request.id}-accepted`,
        type: 'accepted',
        date: mandate.accepted_at,
        title: 'Manager hat angenommen',
        description: 'Bearbeitung läuft',
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            Noch keine Finanzierungsanfragen
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Erstellen Sie eine Anfrage im Tab "Anfrage"
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {requests.map(request => {
        const mandate = Array.isArray(request.mandate) ? request.mandate[0] : request.mandate;
        const manager = mandate?.assigned_manager_id 
          ? managerProfiles?.[mandate.assigned_manager_id]
          : null;
        const timeline = buildTimeline(request);

        return (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  {request.property 
                    ? `${request.property.address}, ${request.property.city}`
                    : `Anfrage ${request.public_id || request.id.slice(0, 8)}`
                  }
                </CardTitle>
                <Badge variant={request.status === 'draft' ? 'secondary' : 'default'}>
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Manager Contact Card */}
              {manager && mandate?.status === 'accepted' && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(manager.display_name || manager.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold">
                        Ihr Finanzierungsmanager
                      </div>
                      <div className="text-lg">
                        {manager.display_name || manager.email.split('@')[0]}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                      {manager.email && (
                        <a 
                          href={`mailto:${manager.email}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-4 w-4" />
                          {manager.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting for manager */}
              {mandate && !mandate.accepted_at && mandate.status === 'delegated' && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium text-amber-800">Warten auf Manager</div>
                    <div className="text-sm text-amber-700">
                      Ein Finanzierungsmanager wurde zugewiesen und prüft Ihre Anfrage
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Zeitverlauf</h4>
                <div className="space-y-4">
                  {timeline.map((event, idx) => {
                    const icons: Record<string, React.ElementType> = {
                      created: Clock,
                      submitted: Send,
                      delegated: User,
                      accepted: CheckCircle,
                    };
                    const Icon = icons[event.type] || Clock;

                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="relative">
                          <div className={`p-2 rounded-full ${
                            idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {idx < timeline.length - 1 && (
                            <div className="absolute left-1/2 top-10 bottom-0 w-px bg-border -translate-x-1/2 h-8" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground">{event.description}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.date), 'dd. MMMM yyyy, HH:mm', { locale: de })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
