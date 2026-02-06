/**
 * MOD-07: Status Tab
 * Shows timeline of all requests and manager contact when assigned
 * 
 * Features:
 * - Status timeline with all events
 * - Manager contact card (visible after assignment, not just acceptance)
 * - Status mirroring from MOD-11 (FutureRoomCase)
 * - Live status updates
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, CheckCircle, Send, User, Building2,
  Loader2, Mail, AlertCircle, FileCheck, Landmark,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';

interface TimelineEvent {
  id: string;
  type: 'created' | 'submitted' | 'delegated' | 'accepted' | 'in_processing' | 'bank_submitted' | 'needs_action' | 'completed';
  date: string;
  title: string;
  description?: string;
  isComplete: boolean;
}

// Status progression for visual indicator
const STATUS_PROGRESSION = [
  { key: 'draft', label: 'Entwurf', step: 1 },
  { key: 'submitted_to_zone1', label: 'Eingereicht', step: 2 },
  { key: 'assigned', label: 'Zugewiesen', step: 3 },
  { key: 'in_processing', label: 'In Bearbeitung', step: 4 },
  { key: 'bank_submitted', label: 'Bei Bank', step: 5 },
  { key: 'completed', label: 'Abgeschlossen', step: 6 },
];

function getProgressStep(status: string): number {
  const found = STATUS_PROGRESSION.find(s => s.key === status);
  if (found) return found.step;
  
  // Map other statuses
  if (status === 'collecting' || status === 'ready') return 1;
  if (status === 'submitted' || status === 'new' || status === 'triage') return 2;
  if (status === 'delegated') return 3;
  if (status === 'accepted' || status === 'active') return 4;
  if (status === 'needs_customer_action' || status === 'missing_docs') return 4;
  if (status === 'waiting_for_bank') return 5;
  if (status === 'rejected' || status === 'cancelled') return 6;
  
  return 1;
}

export default function StatusTab() {
  const { activeOrganization } = useAuth();

  // Fetch requests with mandates AND future_room_cases for status mirroring
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
            assigned_manager_id,
            future_room_case:future_room_cases(
              id, status, submitted_to_bank_at, bank_response, first_action_at
            )
          )
        `)
        .eq('tenant_id', activeOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrganization?.id,
  });

  // Fetch manager profiles when assigned
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

      const map: Record<string, { id: string; display_name: string | null; email: string | null }> = {};
      data?.forEach(p => { map[p.id] = p; });
      return map;
    },
    enabled: !!requests && requests.length > 0,
  });

  // Build timeline for a request
  const buildTimeline = (request: any): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const mandate = Array.isArray(request.mandate) ? request.mandate[0] : request.mandate;
    const futureRoomCase = mandate?.future_room_case?.[0] || mandate?.future_room_case;

    // 1. Created
    events.push({
      id: `${request.id}-created`,
      type: 'created',
      date: request.created_at,
      title: 'Anfrage erstellt',
      description: request.property 
        ? `${request.property.address}, ${request.property.city}`
        : 'Ohne Objektzuordnung',
      isComplete: true,
    });

    // 2. Submitted
    if (request.submitted_at) {
      events.push({
        id: `${request.id}-submitted`,
        type: 'submitted',
        date: request.submitted_at,
        title: 'Anfrage eingereicht',
        description: 'Zur Bearbeitung weitergeleitet',
        isComplete: true,
      });
    }

    // 3. Delegated/Assigned
    if (mandate?.delegated_at) {
      events.push({
        id: `${request.id}-delegated`,
        type: 'delegated',
        date: mandate.delegated_at,
        title: 'Manager zugewiesen',
        description: mandate.accepted_at ? 'Manager hat Anfrage angenommen' : 'Warten auf Annahme',
        isComplete: !!mandate.accepted_at,
      });
    }

    // 4. Accepted
    if (mandate?.accepted_at) {
      events.push({
        id: `${request.id}-accepted`,
        type: 'accepted',
        date: mandate.accepted_at,
        title: 'Manager hat angenommen',
        description: 'Bearbeitung läuft',
        isComplete: true,
      });
    }

    // 5. MOD-11 Status Events (from future_room_cases)
    if (futureRoomCase?.first_action_at) {
      events.push({
        id: `${request.id}-in_processing`,
        type: 'in_processing',
        date: futureRoomCase.first_action_at,
        title: 'In Bearbeitung',
        description: 'Manager prüft Ihre Unterlagen',
        isComplete: true,
      });
    }

    if (futureRoomCase?.submitted_to_bank_at) {
      events.push({
        id: `${request.id}-bank_submitted`,
        type: 'bank_submitted',
        date: futureRoomCase.submitted_to_bank_at,
        title: 'Bei Bank eingereicht',
        description: 'Warten auf Bankentscheidung',
        isComplete: true,
      });
    }

    if (futureRoomCase?.bank_response) {
      events.push({
        id: `${request.id}-completed`,
        type: 'completed',
        date: new Date().toISOString(),
        title: 'Rückmeldung erhalten',
        description: futureRoomCase.bank_response,
        isComplete: true,
      });
    }

    // Sort by date descending (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get effective status (merge request + mandate + case)
  const getEffectiveStatus = (request: any): string => {
    const mandate = Array.isArray(request.mandate) ? request.mandate[0] : request.mandate;
    const futureRoomCase = mandate?.future_room_case?.[0] || mandate?.future_room_case;

    // Priority: FutureRoomCase > Mandate > Request
    if (futureRoomCase?.status) {
      if (futureRoomCase.status === 'submitted') return 'bank_submitted';
      if (futureRoomCase.status === 'active') return 'in_processing';
      if (futureRoomCase.status === 'missing_docs') return 'needs_customer_action';
      return futureRoomCase.status;
    }

    if (mandate?.status) {
      if (mandate.status === 'accepted') return 'in_processing';
      return mandate.status;
    }

    return request.status;
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
        const effectiveStatus = getEffectiveStatus(request);
        const progressStep = getProgressStep(effectiveStatus);
        const progressPercent = (progressStep / 6) * 100;

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
                <Badge variant={getStatusBadgeVariant(effectiveStatus)}>
                  {getStatusLabel(effectiveStatus)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fortschritt</span>
                  <span>{STATUS_PROGRESSION.find(s => s.step === progressStep)?.label || effectiveStatus}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex justify-between text-xs">
                  {STATUS_PROGRESSION.map((step, idx) => (
                    <span 
                      key={step.key}
                      className={progressStep >= step.step ? 'text-primary font-medium' : 'text-muted-foreground'}
                    >
                      {idx === 0 || idx === STATUS_PROGRESSION.length - 1 ? step.label : '•'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Manager Contact Card - Show after assignment (not just acceptance) */}
              {manager && mandate?.assigned_manager_id && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(manager.display_name || manager.email || '??').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        Ihr Finanzierungsmanager
                        {mandate.accepted_at ? (
                          <Badge variant="default" className="text-xs">Aktiv</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Zugewiesen</Badge>
                        )}
                      </div>
                      <div className="text-lg">
                        {manager.display_name || manager.email?.split('@')[0] || 'Manager'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                      {manager.email && (
                        <a 
                          href={`mailto:${manager.email}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          {manager.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting for manager acceptance */}
              {mandate && !mandate.accepted_at && mandate.assigned_manager_id && (
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium">Warten auf Manager</div>
                    <div className="text-sm text-muted-foreground">
                      Ein Finanzierungsmanager wurde zugewiesen und prüft Ihre Anfrage
                    </div>
                  </div>
                </div>
              )}

              {/* Needs Customer Action Alert */}
              {effectiveStatus === 'needs_customer_action' && (
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <div className="font-medium text-destructive">Aktion erforderlich</div>
                    <div className="text-sm text-destructive/80">
                      Bitte ergänzen Sie fehlende Unterlagen oder Informationen
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-destructive" />
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
                      in_processing: FileCheck,
                      bank_submitted: Landmark,
                      needs_action: AlertCircle,
                      completed: CheckCircle,
                    };
                    const Icon = icons[event.type] || Clock;

                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="relative">
                          <div className={`p-2 rounded-full ${
                            idx === 0 
                              ? 'bg-primary text-primary-foreground' 
                              : event.isComplete 
                                ? 'bg-muted text-muted-foreground' 
                                : 'bg-muted/50 text-muted-foreground/50'
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
