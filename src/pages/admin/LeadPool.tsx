/**
 * LeadPool — Zone 1 lead management orchestrator
 * R-22 Refactoring: 560 → ~140 lines
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus } from 'lucide-react';
import { PdfExportFooter } from '@/components/pdf';
import { useToast } from '@/hooks/use-toast';
import {
  LeadPoolStats, LeadPoolTable, LeadAssignmentsTable,
  LeadCreateDialog, LeadAssignDialog,
} from '@/components/admin/leadpool';

export default function LeadPool() {
  const { isPlatformAdmin } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [partnerOrgs, setPartnerOrgs] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState({ totalPool: 0, assigned: 0, pending: 0, converted: 0 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', interest_type: '', notes: '' });

  useEffect(() => { if (isPlatformAdmin) fetchData(); }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      const [leadsRes, assignmentsRes, orgsRes, contactsRes] = await Promise.all([
        supabase.from('leads').select('*').eq('zone1_pool', true),
        supabase.from('lead_assignments').select('*'),
        supabase.from('organizations').select('id, name'),
        supabase.from('contacts').select('id, first_name, last_name'),
      ]);
      const orgs = orgsRes.data || []; const contacts = contactsRes.data || [];
      setPartnerOrgs(orgs);
      const leadsData = leadsRes.data || [];
      setLeads(leadsData.map(l => ({ ...l, contact_name: contacts.find(c => c.id === l.contact_id) ? `${contacts.find(c => c.id === l.contact_id)?.first_name} ${contacts.find(c => c.id === l.contact_id)?.last_name}` : null, assigned_partner_name: orgs.find(o => o.id === l.assigned_partner_id)?.name || null })));
      setAssignments((assignmentsRes.data || []).map(a => ({ ...a, partner_name: orgs.find(o => o.id === a.partner_org_id)?.name || 'Unknown' })));
      setStats({ totalPool: leadsData.length, assigned: leadsData.filter(l => l.assigned_partner_id).length, pending: leadsData.filter(l => l.status === 'new').length, converted: leadsData.filter(l => l.status === 'converted').length });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleCreateLead() {
    if (!newLead.name.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('leads').insert({ source: 'manual', status: 'new', zone1_pool: true, interest_type: newLead.interest_type || null, notes: newLead.notes || null, raw_data: { name: newLead.name, email: newLead.email, phone: newLead.phone } } as any);
      if (error) throw error;
      toast({ title: 'Lead erstellt' }); setCreateDialogOpen(false); setNewLead({ name: '', email: '', phone: '', interest_type: '', notes: '' }); fetchData();
    } catch (e) { toast({ title: 'Fehler', variant: 'destructive' }); }
    finally { setCreating(false); }
  }

  async function handleAssignLead() {
    if (!selectedLeadId || !selectedPartnerId) return;
    setAssigning(true);
    try {
      await supabase.from('lead_assignments').insert({ lead_id: selectedLeadId, partner_org_id: selectedPartnerId, status: 'offered', offered_at: new Date().toISOString() } as any);
      await supabase.from('leads').update({ status: 'assigned', assigned_partner_id: selectedPartnerId } as any).eq('id', selectedLeadId);
      toast({ title: 'Lead zugewiesen' }); setAssignDialogOpen(false); fetchData();
    } catch (e) { toast({ title: 'Fehler', variant: 'destructive' }); }
    finally { setAssigning(false); }
  }

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold uppercase">Lead Pool (Zone 1)</h1><p className="text-muted-foreground">Zentrale Lead-Verwaltung und Partner-Zuweisung</p></div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Lead anlegen</Button>
      </div>

      <LeadPoolStats {...stats} />

      <Tabs defaultValue="pool">
        <TabsList><TabsTrigger value="pool">Lead Pool</TabsTrigger><TabsTrigger value="assignments">Zuweisungen</TabsTrigger></TabsList>
        <TabsContent value="pool" className="space-y-4"><LeadPoolTable leads={leads} onAssign={(id) => { setSelectedLeadId(id); setSelectedPartnerId(''); setAssignDialogOpen(true); }} onCreate={() => setCreateDialogOpen(true)} /></TabsContent>
        <TabsContent value="assignments" className="space-y-4"><LeadAssignmentsTable assignments={assignments} /></TabsContent>
      </Tabs>

      <LeadCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} newLead={newLead} onUpdate={(u) => setNewLead(p => ({ ...p, ...u }))} onCreate={handleCreateLead} creating={creating} />
      <LeadAssignDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} partnerOrgs={partnerOrgs} selectedPartnerId={selectedPartnerId} onSelectPartner={setSelectedPartnerId} onAssign={handleAssignLead} assigning={assigning} />
      <PdfExportFooter contentRef={contentRef} documentTitle="Lead Pool" subtitle={`${stats.totalPool} Leads im Pool`} moduleName="Zone 1 Admin" />
    </div>
  );
}
