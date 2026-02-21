import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Inbox as InboxIcon,
  Mail,
  FileText,
  Upload,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Filter,
  Plus,
  Send,
  ClipboardList,
  Pencil,
  Trash2,
  Route,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
// postRouting removed — Admin Inbox is deprecated (dead code, kept for reference)
const SYSTEM_INBOX_EMAIL = 'posteingang@inbound.systemofatown.com';
const matchRoutingRule = (_tid: string, _rules: any[]) => null as any;
const routeToZone2 = async (_id: string, _tid: string, _mid?: string | null) => ({ success: false, error: 'Deprecated' });

interface InboundItem {
  id: string;
  source: string;
  external_id: string | null;
  sender_info: unknown;
  recipient_info: unknown;
  file_name: string | null;
  file_path: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  metadata: unknown;
  status: string;
  assigned_tenant_id: string | null;
  assigned_contact_id: string | null;
  assigned_property_id: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  notes: string | null;
  created_at: string;
  mandate_id: string | null;
  routed_to_zone2_at: string | null;
}

interface RoutingRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  match_conditions: unknown;
  action_type: string;
  action_config: unknown;
  created_at: string;
  mandate_id: string | null;
  target_tenant_id: string | null;
  target_module: string | null;
}

interface PostserviceMandate {
  id: string;
  tenant_id: string;
  requested_by_user_id: string;
  type: string;
  status: string;
  contract_terms: unknown;
  payload_json: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function InboxPage() {
  const { isPlatformAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InboundItem[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [mandates, setMandates] = useState<PostserviceMandate[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Assignment dialog
  const [assignItem, setAssignItem] = useState<InboundItem | null>(null);
  const [assignTenantId, setAssignTenantId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // View dialog
  const [viewItem, setViewItem] = useState<InboundItem | null>(null);

  // Routing rule dialog
  const [ruleDialog, setRuleDialog] = useState<{ mode: 'create' | 'edit'; rule?: RoutingRule } | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleTargetTenant, setRuleTargetTenant] = useState('');
  const [ruleMandateId, setRuleMandateId] = useState('');
  const [ruleActive, setRuleActive] = useState(true);
  const [rulePriority, setRulePriority] = useState(10);
  const [savingRule, setSavingRule] = useState(false);

  // Mandate detail dialog
  const [viewMandate, setViewMandate] = useState<PostserviceMandate | null>(null);
  const [mandateNotes, setMandateNotes] = useState('');
  const [mandateStatus, setMandateStatus] = useState('');
  const [savingMandate, setSavingMandate] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin) fetchData();
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, rulesRes, orgsRes, mandatesRes] = await Promise.all([
        supabase.from('inbound_items').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('inbound_routing_rules').select('*').order('priority', { ascending: false }),
        supabase.from('organizations').select('id, name').order('name'),
        supabase.from('postservice_mandates').select('*').order('created_at', { ascending: false }),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (rulesRes.error) throw rulesRes.error;
      if (orgsRes.error) throw orgsRes.error;
      if (mandatesRes.error) throw mandatesRes.error;

      setItems(itemsRes.data || []);
      setRules(rulesRes.data || []);
      setOrganizations(orgsRes.data || []);
      setMandates(mandatesRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  const getOrgName = (tenantId: string | null) => {
    if (!tenantId) return '—';
    return organizations.find(o => o.id === tenantId)?.name || tenantId.slice(0, 8) + '...';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', label: 'Offen', icon: <Clock className="h-3 w-3" /> },
      assigned: { variant: 'default', label: 'Zugestellt', icon: <CheckCircle className="h-3 w-3" /> },
      archived: { variant: 'outline', label: 'Archiviert', icon: <Archive className="h-3 w-3" /> },
      rejected: { variant: 'destructive', label: 'Abgelehnt', icon: <XCircle className="h-3 w-3" /> },
    };
    const s = map[status] || { variant: 'outline' as const, label: status, icon: null };
    return (
      <Badge variant={s.variant} className="gap-1">
        {s.icon}
        {s.label}
      </Badge>
    );
  };

  const getMandateStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      requested: { variant: 'secondary', label: 'Eingereicht' },
      setup_in_progress: { variant: 'outline', label: 'In Bearbeitung' },
      active: { variant: 'default', label: 'Aktiv' },
      paused: { variant: 'outline', label: 'Pausiert' },
      cancelled: { variant: 'destructive', label: 'Widerrufen' },
    };
    const s = map[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  // --- Handlers ---

  const handleAssign = async () => {
    if (!assignItem || !assignTenantId) return;
    setAssigning(true);
    try {
      const { error } = await supabase
        .from('inbound_items')
        .update({
          status: 'assigned',
          assigned_tenant_id: assignTenantId,
          assigned_by: user?.id,
          assigned_at: new Date().toISOString(),
          notes: assignNotes || null,
        })
        .eq('id', assignItem.id);
      if (error) throw error;
      setAssignItem(null);
      fetchData();
      toast.success('Zugewiesen');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleRoute = async (item: InboundItem) => {
    // Try automatic routing via rules
    const recipientTenantId = item.assigned_tenant_id || 
      (item.recipient_info as any)?.tenant_id;

    if (recipientTenantId) {
      const rule = matchRoutingRule(recipientTenantId, rules as any);
      if (rule) {
        const result = await routeToZone2(item.id, recipientTenantId, rule.mandate_id);
        if (result.success) {
          toast.success('Post zugestellt an ' + getOrgName(recipientTenantId));
          fetchData();
          return;
        } else {
          toast.error(result.error || 'Routing fehlgeschlagen');
          return;
        }
      }
    }
    // Fallback: open assign dialog
    setAssignItem(item);
    setAssignTenantId(item.assigned_tenant_id || '');
    setAssignNotes(item.notes || '');
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('inbound_items').update({ status: newStatus } as any).eq('id', itemId);
      if (error) throw error;
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Rule CRUD
  const openCreateRule = (mandateId?: string, tenantId?: string) => {
    setRuleName(mandateId ? `Postservice ${getOrgName(tenantId || '')}` : '');
    setRuleTargetTenant(tenantId || '');
    setRuleMandateId(mandateId || '');
    setRuleActive(true);
    setRulePriority(10);
    setRuleDialog({ mode: 'create' });
  };

  const openEditRule = (rule: RoutingRule) => {
    setRuleName(rule.name);
    setRuleTargetTenant(rule.target_tenant_id || '');
    setRuleMandateId(rule.mandate_id || '');
    setRuleActive(rule.is_active);
    setRulePriority(rule.priority);
    setRuleDialog({ mode: 'edit', rule });
  };

  const handleSaveRule = async () => {
    if (!ruleName || !ruleTargetTenant) return;
    setSavingRule(true);
    try {
      const payload = {
        name: ruleName,
        is_active: ruleActive,
        priority: rulePriority,
        target_tenant_id: ruleTargetTenant,
        mandate_id: ruleMandateId || null,
        target_module: 'MOD-03',
        match_conditions: { tenant_id: ruleTargetTenant },
        action_type: 'zone2_delivery',
        action_config: { target_module: 'MOD-03', target_route: '/portal/dms/posteingang' },
      };

      if (ruleDialog?.mode === 'edit' && ruleDialog.rule) {
        const { error } = await supabase.from('inbound_routing_rules').update(payload).eq('id', ruleDialog.rule.id);
        if (error) throw error;
        toast.success('Regel aktualisiert');
      } else {
        const { error } = await supabase.from('inbound_routing_rules').insert(payload);
        if (error) throw error;
        toast.success('Regel erstellt');
      }
      setRuleDialog(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase.from('inbound_routing_rules').delete().eq('id', ruleId);
      if (error) throw error;
      toast.success('Regel gelöscht');
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  // Mandate management
  const openMandate = (mandate: PostserviceMandate) => {
    setViewMandate(mandate);
    setMandateNotes(mandate.notes || '');
    setMandateStatus(mandate.status);
  };

  const handleSaveMandate = async () => {
    if (!viewMandate) return;
    setSavingMandate(true);
    try {
      const { error } = await supabase
        .from('postservice_mandates')
        .update({ status: mandateStatus, notes: mandateNotes || null })
        .eq('id', viewMandate.id);
      if (error) throw error;
      toast.success('Mandat aktualisiert');
      setViewMandate(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingMandate(false);
    }
  };

  // --- Render ---

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const assignedCount = items.filter(i => i.status === 'assigned').length;
  const openMandates = mandates.filter(m => m.status === 'requested').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post & Dokumente</h1>
        <p className="text-muted-foreground">
          Eingehende Post verwalten, Routing-Regeln pflegen und Postservice-Aufträge bearbeiten
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">System-Posteingang:</span>
          <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">{SYSTEM_INBOX_EMAIL}</code>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zugestellt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{assignedCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Routing-Regeln</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</span>
              <span className="text-muted-foreground text-sm">aktiv</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offene Aufträge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{openMandates}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">
            Posteingang
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Routing-Regeln</TabsTrigger>
          <TabsTrigger value="mandates">
            Aufträge
            {openMandates > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{openMandates}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ======================== TAB: POSTEINGANG ======================== */}
        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Status:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="pending">Offen</SelectItem>
                      <SelectItem value="assigned">Zugestellt</SelectItem>
                      <SelectItem value="archived">Archiviert</SelectItem>
                      <SelectItem value="rejected">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eingehende Post</CardTitle>
              <CardDescription>{filteredItems.length} Einträge</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Einträge</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Uhrzeit</TableHead>
                      <TableHead>Empfänger</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">
                          {item.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.created_at), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.created_at), 'HH:mm', { locale: de })}
                        </TableCell>
                        <TableCell>
                          {getOrgName(item.assigned_tenant_id)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewItem(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRoute(item)}
                                title="Routen / Zuweisen"
                              >
                                <Route className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(item.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {item.status === 'assigned' && !item.routed_to_zone2_at && (
                            <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(item.id, 'archived')}>
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          {item.routed_to_zone2_at && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Send className="h-3 w-3" />
                              Zone 2
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== TAB: ROUTING-REGELN ======================== */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <div />
            <Button size="sm" onClick={() => openCreateRule()}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Regel
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Routing-Regeln</CardTitle>
              <CardDescription>
                Bestimmen, wohin eingehende Post automatisch zugestellt wird
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <Filter className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Routing-Regeln vorhanden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Ziel-Tenant</TableHead>
                      <TableHead>Mandat</TableHead>
                      <TableHead>Priorität</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            {rule.description && (
                              <p className="text-sm text-muted-foreground">{rule.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getOrgName(rule.target_tenant_id)}</TableCell>
                        <TableCell>
                          {rule.mandate_id ? (
                            <Badge variant="outline" className="text-xs">Verknüpft</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditRule(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================== TAB: AUFTRÄGE ======================== */}
        <TabsContent value="mandates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Postservice-Aufträge</CardTitle>
              <CardDescription>
                Nachsendeaufträge aus Zone 2 — Mandate verwalten und Routing einrichten
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mandates.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Aufträge vorhanden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Postfach-Nr.</TableHead>
                      <TableHead>Eingereicht am</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mandates.map(mandate => (
                      <TableRow key={mandate.id}>
                        <TableCell className="font-medium">
                          {getOrgName(mandate.tenant_id)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Nachsendeauftrag</Badge>
                        </TableCell>
                        <TableCell>{getMandateStatusBadge(mandate.status)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {mandate.tenant_id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {format(new Date(mandate.created_at), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openMandate(mandate)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {mandate.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Routing-Regel anlegen"
                              onClick={() => openCreateRule(mandate.id, mandate.tenant_id)}
                            >
                              <Route className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ======================== DIALOGE ======================== */}

      {/* Assignment Dialog */}
      <Dialog open={!!assignItem} onOpenChange={() => setAssignItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post zuweisen</DialogTitle>
            <DialogDescription>Weisen Sie dieses Dokument einem Tenant zu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Datei</Label>
              <p className="text-sm text-muted-foreground">{assignItem?.file_name || 'Unbekannt'}</p>
            </div>
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select value={assignTenantId} onValueChange={setAssignTenantId}>
                <SelectTrigger><SelectValue placeholder="Tenant auswählen" /></SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notizen (optional)</Label>
              <Textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignItem(null)}>Abbrechen</Button>
            <Button onClick={handleAssign} disabled={assigning || !assignTenantId}>
              {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dokument-Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dateiname</p>
                  <p className="mt-1">{viewItem.file_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(viewItem.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quelle</p>
                  <p className="mt-1 capitalize">{viewItem.source}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empfänger</p>
                  <p className="mt-1">{getOrgName(viewItem.assigned_tenant_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eingegangen</p>
                  <p className="mt-1">{format(new Date(viewItem.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
                {viewItem.routed_to_zone2_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Zugestellt (Zone 2)</p>
                    <p className="mt-1">{format(new Date(viewItem.routed_to_zone2_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{viewItem.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={!!ruleDialog} onOpenChange={() => setRuleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ruleDialog?.mode === 'edit' ? 'Regel bearbeiten' : 'Neue Routing-Regel'}</DialogTitle>
            <DialogDescription>Bestimmt, an welchen Tenant eingehende Post zugestellt wird.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="z.B. Postservice Müller GmbH" />
            </div>
            <div className="space-y-2">
              <Label>Ziel-Tenant</Label>
              <Select value={ruleTargetTenant} onValueChange={setRuleTargetTenant}>
                <SelectTrigger><SelectValue placeholder="Tenant auswählen" /></SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mandat (optional)</Label>
              <Select value={ruleMandateId} onValueChange={setRuleMandateId}>
                <SelectTrigger><SelectValue placeholder="Kein Mandat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kein Mandat</SelectItem>
                  {mandates.filter(m => m.status !== 'cancelled').map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {getOrgName(m.tenant_id)} — {m.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorität</Label>
              <Input type="number" value={rulePriority} onChange={(e) => setRulePriority(Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktiv</Label>
              <Switch checked={ruleActive} onCheckedChange={setRuleActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialog(null)}>Abbrechen</Button>
            <Button onClick={handleSaveRule} disabled={savingRule || !ruleName || !ruleTargetTenant}>
              {savingRule && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {ruleDialog?.mode === 'edit' ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mandate Detail Dialog */}
      <Dialog open={!!viewMandate} onOpenChange={() => setViewMandate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Auftrag bearbeiten</DialogTitle>
            <DialogDescription>Nachsendeauftrag verwalten und Status ändern</DialogDescription>
          </DialogHeader>
          {viewMandate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tenant</p>
                  <p className="mt-1 font-medium">{getOrgName(viewMandate.tenant_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Postfach-Nr.</p>
                  <p className="mt-1 font-mono">{viewMandate.tenant_id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Eingereicht am</p>
                  <p className="mt-1">{format(new Date(viewMandate.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                  <p className="mt-1 text-sm">
                    {(viewMandate.payload_json as any)?.address || '—'}, {(viewMandate.payload_json as any)?.postal_code} {(viewMandate.payload_json as any)?.city}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium mb-1">Vertragsbedingungen</div>
                <div className="text-muted-foreground space-y-1">
                  <div>• Laufzeit: {(viewMandate.contract_terms as any)?.duration_months || 12} Monate</div>
                  <div>• {(viewMandate.contract_terms as any)?.monthly_credits || 30} Credits / Monat</div>
                  <div>• Abrechnung: Jährlich im Voraus (360 Credits)</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={mandateStatus} onValueChange={setMandateStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Eingereicht</SelectItem>
                    <SelectItem value="setup_in_progress">In Bearbeitung</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="paused">Pausiert</SelectItem>
                    <SelectItem value="cancelled">Widerrufen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin-Notizen</Label>
                <Textarea
                  value={mandateNotes}
                  onChange={(e) => setMandateNotes(e.target.value)}
                  placeholder="Notizen zur Einrichtung..."
                  rows={3}
                />
              </div>

              {mandateStatus === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setViewMandate(null);
                    openCreateRule(viewMandate.id, viewMandate.tenant_id);
                  }}
                >
                  <Route className="h-4 w-4 mr-2" />
                  Routing-Regel anlegen
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMandate(null)}>Abbrechen</Button>
            <Button onClick={handleSaveMandate} disabled={savingMandate}>
              {savingMandate && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
