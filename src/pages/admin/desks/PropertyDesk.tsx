/**
 * Property Desk — Zone 1 Operative Desk for TLC (Tenancy Lifecycle Controller)
 * 
 * Governance: Mietverhältnis-Monitoring · TLC-Events · Leases · Mahnwesen · Process Health
 * Zone-Flow: Z2 (MOD-04 Immobilien) → Z1 (Property Desk) → Z2 (MOD-20 Miety)
 */
import { Suspense, useMemo } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Home, AlertTriangle, CheckCircle, FileWarning, Activity, ClipboardList } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import type { DeskKPI } from '@/components/admin/desks/OperativeDeskShell';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLeaseLifecycle } from '@/hooks/useLeaseLifecycle';
import { useProcessHealth } from '@/hooks/useProcessHealth';

const TABS = [
  { value: 'dashboard', label: 'Dashboard', path: '' },
  { value: 'tlc-monitor', label: 'TLC Monitor', path: 'tlc-monitor' },
  { value: 'leases', label: 'Leases', path: 'leases' },
  { value: 'mahnwesen', label: 'Mahnwesen', path: 'mahnwesen' },
  { value: 'health', label: 'Process Health', path: 'health' },
];

function Loading() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
}

// ─── Dashboard Tab ───────────────────────────────────────────────────────────
function PropertyDashboard() {
  const { events, tasks, criticalEvents, openTasks, loading } = useLeaseLifecycle();

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Critical Events Alert */}
      {criticalEvents.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {criticalEvents.length} Kritische Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalEvents.slice(0, 5).map(evt => (
                <div key={evt.id} className="flex items-start gap-3 text-sm">
                  <Badge variant="destructive" className="text-xs shrink-0">{evt.severity}</Badge>
                  <div>
                    <p className="font-medium">{evt.title}</p>
                    {evt.description && <p className="text-muted-foreground text-xs">{evt.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Letzte Lifecycle-Events
          </CardTitle>
          <CardDescription>{events.length} Events geladen</CardDescription>
        </CardHeader>
        <CardContent>
          {!events.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine Lifecycle-Events vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 10).map(evt => (
                  <TableRow key={evt.id}>
                    <TableCell className="font-medium">{evt.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{evt.phase}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={evt.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                        {evt.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {evt.resolved_at ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">Offen</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(evt.created_at).toLocaleDateString('de-DE')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Open Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Offene Aufgaben
          </CardTitle>
          <CardDescription>{openTasks.length} offene Tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {!openTasks.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine offenen Aufgaben</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aufgabe</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fällig</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openTasks.slice(0, 10).map(task => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{task.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('de-DE') : '–'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TLC Monitor Tab ─────────────────────────────────────────────────────────
function TLCMonitorTab() {
  const { events, tasks, loading, unresolvedEvents } = useLeaseLifecycle();

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Unresolved Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ungelöste Events ({unresolvedEvents.length})</CardTitle>
          <CardDescription>Lifecycle-Events die noch bearbeitet werden müssen</CardDescription>
        </CardHeader>
        <CardContent>
          {!unresolvedEvents.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Alle Events gelöst ✓</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Erstellt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unresolvedEvents.map(evt => (
                  <TableRow key={evt.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{evt.title}</p>
                        {evt.description && <p className="text-xs text-muted-foreground">{evt.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{evt.event_type}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{evt.phase}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={evt.severity === 'critical' || evt.severity === 'action_required' ? 'destructive' : 'secondary'} className="text-xs">
                        {evt.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(evt.created_at).toLocaleDateString('de-DE')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!tasks.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine Tasks vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aufgabe</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fällig</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="font-mono text-xs">{task.task_type}</TableCell>
                    <TableCell>
                      <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{task.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('de-DE') : '–'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Leases Tab ──────────────────────────────────────────────────────────────
function LeasesTab() {
  const { data: leases, isLoading } = useQuery({
    queryKey: ['property-desk-leases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases' as never)
        .select('*' as never)
        .order('created_at' as never, { ascending: false })
        .limit(100) as unknown as { data: any[]; error: any };
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Loading />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alle Mietverträge</CardTitle>
        <CardDescription>{leases?.length ?? 0} Verträge im System</CardDescription>
      </CardHeader>
      <CardContent>
        {!leases?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Keine Mietverträge vorhanden</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mieter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Beginn</TableHead>
                <TableHead>Ende</TableHead>
                <TableHead>Miete (€)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.tenant_name || l.renter_name || '–'}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {l.status || 'draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {l.start_date ? new Date(l.start_date).toLocaleDateString('de-DE') : '–'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {l.end_date ? new Date(l.end_date).toLocaleDateString('de-DE') : 'unbefristet'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {l.rent_amount_cents ? `${(l.rent_amount_cents / 100).toFixed(2)}` : l.base_rent ? `${l.base_rent}` : '–'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Mahnwesen Tab ───────────────────────────────────────────────────────────
function MahnwesenTab() {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['property-desk-dunning'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenancy_dunning_configs' as never)
        .select('*' as never)
        .order('created_at' as never, { ascending: false }) as unknown as { data: any[]; error: any };
      if (error) throw error;
      return data ?? [];
    },
  });

  const { events } = useLeaseLifecycle();
  const dunningEvents = events.filter(e => e.event_type.includes('dunning') || e.event_type.includes('payment'));

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Mahnkonfigurationen
          </CardTitle>
          <CardDescription>{configs?.length ?? 0} aktive Mahnstufen-Konfigurationen</CardDescription>
        </CardHeader>
        <CardContent>
          {!configs?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine Mahnkonfigurationen vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stufe</TableHead>
                  <TableHead>Verzug (Tage)</TableHead>
                  <TableHead>Aktion</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">Stufe {c.level ?? c.dunning_level ?? '–'}</TableCell>
                    <TableCell>{c.days_overdue ?? c.grace_days ?? '–'}</TableCell>
                    <TableCell className="text-sm">{c.action_type ?? c.action ?? '–'}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_active !== false ? 'default' : 'secondary'} className="text-xs">
                        {c.is_active !== false ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dunning-related Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zahlungs- & Mahn-Events</CardTitle>
          <CardDescription>{dunningEvents.length} relevante Events</CardDescription>
        </CardHeader>
        <CardContent>
          {!dunningEvents.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Keine Zahlungs-Events vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dunningEvents.slice(0, 20).map(evt => (
                  <TableRow key={evt.id}>
                    <TableCell className="font-medium">{evt.title}</TableCell>
                    <TableCell className="font-mono text-xs">{evt.event_type}</TableCell>
                    <TableCell>
                      <Badge variant={evt.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                        {evt.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(evt.created_at).toLocaleDateString('de-DE')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Process Health Tab ──────────────────────────────────────────────────────
function ProcessHealthTab() {
  const { data: logs, isLoading } = useProcessHealth(50);
  const tlcLogs = (logs ?? []).filter(l => l.system === 'tlc');

  if (isLoading) return <Loading />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-5 w-5" />
          TLC Process Health
        </CardTitle>
        <CardDescription>{tlcLogs.length} CRON-Läufe protokolliert</CardDescription>
      </CardHeader>
      <CardContent>
        {!tlcLogs.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Keine TLC-Prozessdaten vorhanden</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Geprüft</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KI-Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tlcLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {new Date(log.run_date).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell className="text-center">{log.cases_checked}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={log.issues_found > 0 ? 'destructive' : 'secondary'} className="text-xs">
                      {log.issues_found}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{log.events_created}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {log.ai_summary || '–'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Desk Component ─────────────────────────────────────────────────────
export default function PropertyDesk() {
  const location = useLocation();
  const subPath = location.pathname.replace(/^\/admin\/property-desk\/?/, '').split('/')[0] || '';
  const activeTab = TABS.find(t => t.path === subPath)?.value || 'dashboard';

  const { events, tasks, criticalEvents, openTasks } = useLeaseLifecycle();

  const kpis: DeskKPI[] = useMemo(() => {
    // Count active leases from events context
    const activeLeaseIds = new Set(events.map(e => e.lease_id).filter(Boolean));
    return [
      { label: 'Aktive Leases', value: activeLeaseIds.size, icon: Home, color: 'text-primary', subtitle: 'Systemweit' },
      { label: 'Offene Tasks', value: openTasks.length, icon: ClipboardList, color: 'text-amber-500', subtitle: `${tasks.length} gesamt` },
      { label: 'Kritische Events', value: criticalEvents.length, icon: AlertTriangle, color: 'text-destructive' },
      { label: 'Events (gesamt)', value: events.length, icon: Activity, color: 'text-muted-foreground' },
    ];
  }, [events, tasks, criticalEvents, openTasks]);

  const navigation = (
    <Tabs value={activeTab} className="w-full">
      <TabsList>
        {TABS.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link to={`/admin/property-desk/${tab.path}`}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return (
    <OperativeDeskShell
      title="Property Desk"
      subtitle="Mietverhältnis-Monitoring · TLC-Events · Leases · Mahnwesen · Process Health"
      moduleCode="MOD-04"
      kpis={kpis}
      navigation={navigation}
      zoneFlow={{ z3Surface: 'Immobilien-Portale', z1Desk: 'Property Desk', z2Manager: 'MOD-04 Immobilien / MOD-20 Miety' }}
    >
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<PropertyDashboard />} />
          <Route path="tlc-monitor" element={<TLCMonitorTab />} />
          <Route path="leases" element={<LeasesTab />} />
          <Route path="mahnwesen" element={<MahnwesenTab />} />
          <Route path="health" element={<ProcessHealthTab />} />
          <Route path="*" element={<Navigate to="/admin/property-desk" replace />} />
        </Routes>
      </Suspense>
    </OperativeDeskShell>
  );
}
