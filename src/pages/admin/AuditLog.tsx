import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, FileText, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { PdfExportFooter } from '@/components/pdf';

type AuditEvent = Tables<'audit_events'>;
type Organization = Tables<'organizations'>;

const EVENT_TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  'parent_access_blocked_changed': { label: 'Zugriff geändert', variant: 'default' },
  'membership_created': { label: 'Mitgliedschaft erstellt', variant: 'default' },
  'membership_deleted': { label: 'Mitgliedschaft gelöscht', variant: 'destructive' },
  'delegation_created': { label: 'Delegation erstellt', variant: 'default' },
  'delegation_revoked': { label: 'Delegation widerrufen', variant: 'destructive' },
  'document_accessed': { label: 'Dokument geöffnet', variant: 'secondary' },
  'share_link_created': { label: 'Link erstellt', variant: 'default' },
  'access_grant_created': { label: 'Zugriff gewährt', variant: 'default' },
  'access_grant_revoked': { label: 'Zugriff widerrufen', variant: 'destructive' },
};

export default function AuditLog() {
  const { isPlatformAdmin } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  
  // Detail dialog
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, orgsRes] = await Promise.all([
        supabase
          .from('audit_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('organizations').select('*').order('name'),
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (orgsRes.error) throw orgsRes.error;

      setEvents(eventsRes.data || []);
      setOrganizations(orgsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Audit-Daten');
    } finally {
      setLoading(false);
    }
  }

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return '—';
    return organizations.find(o => o.id === orgId)?.name || orgId.slice(0, 8) + '...';
  };

  const getEventLabel = (eventType: string) => {
    return EVENT_TYPE_LABELS[eventType] || { label: eventType, variant: 'outline' as const };
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    // Event type filter
    if (eventTypeFilter !== 'all' && event.event_type !== eventTypeFilter) return false;
    
    // Org filter
    if (orgFilter !== 'all' && event.target_org_id !== orgFilter) return false;
    
    // Search in payload
    if (searchTerm) {
      const payloadStr = JSON.stringify(event.payload).toLowerCase();
      const eventTypeStr = event.event_type.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      if (!payloadStr.includes(searchLower) && !eventTypeStr.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });

  // Get unique event types from data
  const uniqueEventTypes = [...new Set(events.map(e => e.event_type))];

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            Systemweites Ereignisprotokoll aller sicherheitsrelevanten Aktionen
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suche in Ereignissen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Event-Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Ereignisse</SelectItem>
                {uniqueEventTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {getEventLabel(type).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Organisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Organisationen</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ereignisse</CardTitle>
          <CardDescription>
            {filteredEvents.length} von {events.length} Ereignissen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Ereignisse gefunden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Ereignis</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Benutzer</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const eventInfo = getEventLabel(event.event_type);
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm">
                        <div className="font-medium">
                          {format(new Date(event.created_at), 'dd.MM.yyyy', { locale: de })}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {format(new Date(event.created_at), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={eventInfo.variant}>
                          {eventInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getOrgName(event.target_org_id)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {event.actor_user_id ? event.actor_user_id.slice(0, 8) + '...' : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ereignis-Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ereignis-Typ</p>
                  <Badge variant={getEventLabel(selectedEvent.event_type).variant} className="mt-1">
                    {getEventLabel(selectedEvent.event_type).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zeitpunkt</p>
                  <p className="mt-1">
                    {format(new Date(selectedEvent.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organisation</p>
                  <p className="mt-1">{getOrgName(selectedEvent.target_org_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Benutzer</p>
                  <p className="mt-1 font-mono text-sm">
                    {selectedEvent.actor_user_id || '—'}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Payload</p>
                <ScrollArea className="h-[200px] border rounded-md p-3 bg-muted/30">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event ID</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {selectedEvent.id}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Export */}
      <PdfExportFooter
        contentRef={contentRef}
        options={{
          title: 'Audit Log',
          subtitle: `${filteredEvents.length} Ereignisse`,
          module: 'Zone 1 Admin',
          metadata: {
            'Ereignisse': filteredEvents.length.toString(),
          }
        }}
      />
    </div>
  );
}
