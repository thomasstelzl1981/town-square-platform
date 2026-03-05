/**
 * R-3: Inbox.tsx — Orchestrator (refactored from 976 → ~180 lines)
 * Sub-components: InboxStatsGrid, InboxPostTab, InboxRulesTab, InboxMandatesTab, InboxDialogs
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { InboundItem, RoutingRule, PostserviceMandate, Organization } from '@/components/admin/inboxTypes';
import { getOrgName } from '@/components/admin/inboxHelpers';
import InboxStatsGrid from '@/components/admin/InboxStatsGrid';
import InboxPostTab from '@/components/admin/InboxPostTab';
import InboxRulesTab from '@/components/admin/InboxRulesTab';
import InboxMandatesTab from '@/components/admin/InboxMandatesTab';
import { AssignDialog, ViewItemDialog, RuleDialog, MandateDetailDialog } from '@/components/admin/InboxDialogs';

const SYSTEM_INBOX_EMAIL = 'posteingang@inbound.systemofatown.com';
const matchRoutingRule = (_tid: string, _rules: any[]) => null as any;
const routeToZone2 = async (_id: string, _tid: string, _mid?: string | null) => ({ success: false, error: 'Deprecated' });

export default function InboxPage() {
  const { isPlatformAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InboundItem[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [mandates, setMandates] = useState<PostserviceMandate[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Assignment dialog state
  const [assignItem, setAssignItem] = useState<InboundItem | null>(null);
  const [assignTenantId, setAssignTenantId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // View dialog
  const [viewItem, setViewItem] = useState<InboundItem | null>(null);

  // Rule dialog state
  const [ruleDialog, setRuleDialog] = useState<{ mode: 'create' | 'edit'; rule?: RoutingRule } | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleTargetTenant, setRuleTargetTenant] = useState('');
  const [ruleMandateId, setRuleMandateId] = useState('');
  const [ruleActive, setRuleActive] = useState(true);
  const [rulePriority, setRulePriority] = useState(10);
  const [savingRule, setSavingRule] = useState(false);

  // Mandate dialog state
  const [viewMandate, setViewMandate] = useState<PostserviceMandate | null>(null);
  const [mandateNotes, setMandateNotes] = useState('');
  const [mandateStatus, setMandateStatus] = useState('');
  const [savingMandate, setSavingMandate] = useState(false);

  useEffect(() => { if (isPlatformAdmin) fetchData(); }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true); setError(null);
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
      setItems(itemsRes.data || []); setRules(rulesRes.data || []);
      setOrganizations(orgsRes.data || []); setMandates(mandatesRes.data || []);
    } catch (err: unknown) { setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden'); }
    finally { setLoading(false); }
  }

  const orgName = (tid: string | null) => getOrgName(tid, organizations);

  const handleAssign = async () => {
    if (!assignItem || !assignTenantId) return;
    setAssigning(true);
    try {
      const { error } = await supabase.from('inbound_items').update({ status: 'assigned', assigned_tenant_id: assignTenantId, assigned_by: user?.id, assigned_at: new Date().toISOString(), notes: assignNotes || null }).eq('id', assignItem.id);
      if (error) throw error;
      setAssignItem(null); fetchData(); toast.success('Zugewiesen');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setAssigning(false); }
  };

  const handleRoute = async (item: InboundItem) => {
    const tid = item.assigned_tenant_id || (item.recipient_info as any)?.tenant_id;
    if (tid) {
      const rule = matchRoutingRule(tid, rules as any);
      if (rule) {
        const result = await routeToZone2(item.id, tid, rule.mandate_id);
        if (result.success) { toast.success('Post zugestellt an ' + orgName(tid)); fetchData(); return; }
        else { toast.error(result.error || 'Routing fehlgeschlagen'); return; }
      }
    }
    setAssignItem(item); setAssignTenantId(item.assigned_tenant_id || ''); setAssignNotes(item.notes || '');
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try { const { error } = await supabase.from('inbound_items').update({ status: newStatus } as any).eq('id', itemId); if (error) throw error; fetchData(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : String(err)); }
  };

  const openCreateRule = (mandateId?: string, tenantId?: string) => {
    setRuleName(mandateId ? `Postservice ${orgName(tenantId || '')}` : ''); setRuleTargetTenant(tenantId || '');
    setRuleMandateId(mandateId || ''); setRuleActive(true); setRulePriority(10); setRuleDialog({ mode: 'create' });
  };

  const openEditRule = (rule: RoutingRule) => {
    setRuleName(rule.name); setRuleTargetTenant(rule.target_tenant_id || ''); setRuleMandateId(rule.mandate_id || '');
    setRuleActive(rule.is_active); setRulePriority(rule.priority); setRuleDialog({ mode: 'edit', rule });
  };

  const handleSaveRule = async () => {
    if (!ruleName || !ruleTargetTenant) return; setSavingRule(true);
    try {
      const payload = { name: ruleName, is_active: ruleActive, priority: rulePriority, target_tenant_id: ruleTargetTenant, mandate_id: ruleMandateId || null, target_module: 'MOD-03', match_conditions: { tenant_id: ruleTargetTenant }, action_type: 'zone2_delivery', action_config: { target_module: 'MOD-03', target_route: '/portal/dms/posteingang' } };
      if (ruleDialog?.mode === 'edit' && ruleDialog.rule) { const { error } = await supabase.from('inbound_routing_rules').update(payload).eq('id', ruleDialog.rule.id); if (error) throw error; toast.success('Regel aktualisiert'); }
      else { const { error } = await supabase.from('inbound_routing_rules').insert(payload); if (error) throw error; toast.success('Regel erstellt'); }
      setRuleDialog(null); fetchData();
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : String(err)); }
    finally { setSavingRule(false); }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try { const { error } = await supabase.from('inbound_routing_rules').delete().eq('id', ruleId); if (error) throw error; toast.success('Regel gelöscht'); fetchData(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : String(err)); }
  };

  const openMandate = (m: PostserviceMandate) => { setViewMandate(m); setMandateNotes(m.notes || ''); setMandateStatus(m.status); };

  const handleSaveMandate = async () => {
    if (!viewMandate) return; setSavingMandate(true);
    try { const { error } = await supabase.from('postservice_mandates').update({ status: mandateStatus, notes: mandateNotes || null }).eq('id', viewMandate.id); if (error) throw error; toast.success('Mandat aktualisiert'); setViewMandate(null); fetchData(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : String(err)); }
    finally { setSavingMandate(false); }
  };

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const assignedCount = items.filter(i => i.status === 'assigned').length;
  const openMandates = mandates.filter(m => m.status === 'requested').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post & Dokumente</h1>
        <p className="text-muted-foreground">Eingehende Post verwalten, Routing-Regeln pflegen und Postservice-Aufträge bearbeiten</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">System-Posteingang:</span>
          <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">{SYSTEM_INBOX_EMAIL}</code>
        </div>
      </div>

      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <InboxStatsGrid pendingCount={pendingCount} assignedCount={assignedCount} activeRulesCount={rules.filter(r => r.is_active).length} openMandates={openMandates} />

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Posteingang{pendingCount > 0 && <Badge variant="secondary" className="ml-2 text-xs">{pendingCount}</Badge>}</TabsTrigger>
          <TabsTrigger value="rules">Routing-Regeln</TabsTrigger>
          <TabsTrigger value="mandates">Aufträge{openMandates > 0 && <Badge variant="secondary" className="ml-2 text-xs">{openMandates}</Badge>}</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox"><InboxPostTab items={items} organizations={organizations} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} onViewItem={setViewItem} onRouteItem={handleRoute} onUpdateStatus={handleUpdateStatus} /></TabsContent>
        <TabsContent value="rules"><InboxRulesTab rules={rules} organizations={organizations} onCreateRule={() => openCreateRule()} onEditRule={openEditRule} onDeleteRule={handleDeleteRule} /></TabsContent>
        <TabsContent value="mandates"><InboxMandatesTab mandates={mandates} organizations={organizations} onViewMandate={openMandate} onCreateRuleFromMandate={(mid, tid) => openCreateRule(mid, tid)} /></TabsContent>
      </Tabs>

      <AssignDialog item={assignItem} organizations={organizations} tenantId={assignTenantId} notes={assignNotes} assigning={assigning} onTenantChange={setAssignTenantId} onNotesChange={setAssignNotes} onAssign={handleAssign} onClose={() => setAssignItem(null)} />
      <ViewItemDialog item={viewItem} organizations={organizations} onClose={() => setViewItem(null)} />
      <RuleDialog ruleDialog={ruleDialog} organizations={organizations} mandates={mandates} ruleName={ruleName} ruleTargetTenant={ruleTargetTenant} ruleMandateId={ruleMandateId} ruleActive={ruleActive} rulePriority={rulePriority} savingRule={savingRule} onNameChange={setRuleName} onTargetTenantChange={setRuleTargetTenant} onMandateIdChange={setRuleMandateId} onActiveChange={setRuleActive} onPriorityChange={setRulePriority} onSave={handleSaveRule} onClose={() => setRuleDialog(null)} getOrgName={orgName} />
      <MandateDetailDialog mandate={viewMandate} organizations={organizations} mandateNotes={mandateNotes} mandateStatus={mandateStatus} savingMandate={savingMandate} onNotesChange={setMandateNotes} onStatusChange={setMandateStatus} onSave={handleSaveMandate} onClose={() => setViewMandate(null)} onCreateRule={openCreateRule} />
    </div>
  );
}
