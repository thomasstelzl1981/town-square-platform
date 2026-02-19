/**
 * MOD-07: Status Tab
 * Shows widget bar for case selection + detail view for selected case.
 * Follows Manager-Module pattern with persistent widget bar at top.
 */
import { getActiveWidgetGlow } from '@/config/designManifest';
import { cn } from '@/lib/utils';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Clock, CheckCircle, Send, User, Building2,
  Loader2, Mail, AlertCircle, FileCheck, Landmark,
  ArrowRight, FileText, Trash2, Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import { toast } from 'sonner';

const DELETABLE_STATUSES = ['draft', 'collecting'];
const ARCHIVABLE_STATUSES = ['submitted', 'rejected', 'cancelled', 'completed'];
const REMOVABLE_STATUSES = [...DELETABLE_STATUSES, ...ARCHIVABLE_STATUSES];

// TimelineEvent interface and STATUS_PROGRESSION
interface TimelineEvent {
  id: string;
  type: 'created' | 'submitted' | 'delegated' | 'accepted' | 'in_processing' | 'bank_submitted' | 'needs_action' | 'completed';
  date: string;
  title: string;
  description?: string;
  isComplete: boolean;
}

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
  const queryClient = useQueryClient();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

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
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeOrganization?.id,
  });

  // Auto-select first request when data loads
  const effectiveSelectedId = useMemo(() => {
    if (selectedRequestId && requests?.some(r => r.id === selectedRequestId)) {
      return selectedRequestId;
    }
    return requests?.[0]?.id || null;
  }, [selectedRequestId, requests]);

  const selectedRequest = useMemo(
    () => requests?.find(r => r.id === effectiveSelectedId) || null,
    [requests, effectiveSelectedId]
  );

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

  // Get effective status (merge request + mandate + case)
  const getEffectiveStatus = (request: any): string => {
    const mandate = Array.isArray(request.mandate) ? request.mandate[0] : request.mandate;
    const futureRoomCase = mandate?.future_room_case?.[0] || mandate?.future_room_case;
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

  // Build timeline for a request
  const buildTimeline = (request: any): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    const mandate = Array.isArray(request.mandate) ? request.mandate[0] : request.mandate;
    const futureRoomCase = mandate?.future_room_case?.[0] || mandate?.future_room_case;

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

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (DELETABLE_STATUSES.includes(status)) {
        const { error } = await supabase
          .from('finance_requests')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('finance_requests')
          .update({ archived_at: new Date().toISOString() } as any)
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finance-requests-with-mandates'] });
      queryClient.invalidateQueries({ queryKey: ['finance-requests-list'] });
      if (selectedRequestId === variables.id) setSelectedRequestId(null);
      toast.success(DELETABLE_STATUSES.includes(variables.status) ? 'Entwurf gelöscht' : 'Anfrage archiviert');
    },
    onError: () => toast.error('Fehler beim Entfernen'),
  });

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
    <PageShell>
      {/* Widget Bar — one tile per finance request */}
      <WidgetGrid>
        {requests.map((req) => {
          const isActive = req.id === effectiveSelectedId;
          const status = getEffectiveStatus(req);
          const canRemove = REMOVABLE_STATUSES.includes(req.status);
          const isDraft = DELETABLE_STATUSES.includes(req.status);
          return (
            <WidgetCell key={req.id}>
              <Card
                className={cn(
                  `h-full cursor-pointer transition-all hover:shadow-md`,
                  getActiveWidgetGlow('primary'),
                  isActive ? 'ring-2 ring-primary' : ''
                )}
                onClick={() => setSelectedRequestId(req.id)}
              >
                <div className="flex flex-col h-full p-4 justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex items-center gap-1">
                        {canRemove && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="p-1 rounded hover:bg-destructive/10 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                title={isDraft ? 'Entwurf löschen' : 'Archivieren'}
                              >
                                {isDraft ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Archive className="h-3.5 w-3.5 text-muted-foreground" />}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{isDraft ? 'Entwurf löschen?' : 'Anfrage archivieren?'}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isDraft
                                    ? 'Dieser Entwurf wird unwiderruflich gelöscht.'
                                    : 'Die Anfrage wird aus der Übersicht entfernt.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  className={isDraft ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                                  onClick={() => deleteMutation.mutate({ id: req.id, status: req.status })}
                                >
                                  {isDraft ? 'Löschen' : 'Archivieren'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Badge variant={getStatusBadgeVariant(status)}>
                          {getStatusLabel(status)}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm truncate">
                      {req.public_id || `#${req.id.slice(0, 8)}`}
                    </h3>
                    {req.property && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {req.property.address}, {req.property.city}
                      </p>
                    )}
                    {!req.property && req.object_address && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {req.object_address}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {format(new Date(req.created_at), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
              </Card>
            </WidgetCell>
          );
        })}
      </WidgetGrid>

      {/* Detail Card — only the selected request */}
      {selectedRequest && (() => {
        const mandate = Array.isArray(selectedRequest.mandate) ? selectedRequest.mandate[0] : selectedRequest.mandate;
        const manager = mandate?.assigned_manager_id 
          ? managerProfiles?.[mandate.assigned_manager_id]
          : null;
        const timeline = buildTimeline(selectedRequest);
        const effectiveStatus = getEffectiveStatus(selectedRequest);
        const progressStep = getProgressStep(effectiveStatus);
        const progressPercent = (progressStep / 6) * 100;

        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  {selectedRequest.property 
                    ? `${selectedRequest.property.address}, ${selectedRequest.property.city}`
                    : `Anfrage ${selectedRequest.public_id || selectedRequest.id.slice(0, 8)}`
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

              {/* Manager Contact Card */}
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
      })()}
    </PageShell>
  );
}
