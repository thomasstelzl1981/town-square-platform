/**
 * Lead Desk — Zone 1 Operative Desk for MOD-10 (Leadmanager)
 * Shell + 3 Sub-Pages: Pool, Zuweisungen, Provisionen
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aggregateCommissions } from '@/engines/provision/engine';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Users, CheckCircle, CreditCard, Plus, Loader2 } from 'lucide-react';
import { PdfExportFooter } from '@/components/pdf';
import { useToast } from '@/hooks/use-toast';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import type { DeskKPI } from '@/components/admin/desks/OperativeDeskShell';
import { LeadPool } from '../lead-desk/LeadPool';
import { LeadAssignments, type LeadAssignment } from '../lead-desk/LeadAssignments';
import { LeadCommissions, type Commission, type CommissionStats } from '../lead-desk/LeadCommissions';

interface Lead {
  id: string;
  public_id: string | null;
  source: string;
  status: string;
  interest_type: string | null;
  zone1_pool: boolean;
  created_at: string;
  contact_name?: string;
  assigned_partner_name?: string;
}

export default function LeadDesk() {
  const { isPlatformAdmin } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [partnerOrgs, setPartnerOrgs] = useState<{ id: string; name: string }[]>([]);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', interest_type: '', notes: '' });

  const [leadStats, setLeadStats] = useState({ totalPool: 0, assigned: 0, pending: 0, converted: 0 });
  const [commissionStats, setCommissionStats] = useState<CommissionStats>({ pending: 0, approved: 0, invoiced: 0, paid: 0, totalPending: 0, totalPaid: 0 });

  useEffect(() => {
    if (isPlatformAdmin) fetchData();
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      const [leadsRes, assignmentsRes, orgsRes, contactsRes, commissionsRes, profilesRes] = await Promise.all([
        supabase.from('leads').select('*').eq('zone1_pool', true),
        supabase.from('lead_assignments').select('*'),
        supabase.from('organizations').select('id, name'),
        supabase.from('contacts').select('id, first_name, last_name'),
        supabase.from('commissions').select('*'),
        supabase.from('profiles').select('id, display_name, email'),
      ]);

      const leadsData = leadsRes.data || [];
      const assignmentsData = assignmentsRes.data || [];
      const orgs = orgsRes.data || [];
      const contacts = contactsRes.data || [];
      const commissionsData = commissionsRes.data || [];
      const profiles = profilesRes.data || [];
      setPartnerOrgs(orgs);

      const enrichedLeads = leadsData.map(lead => ({
        ...lead,
        contact_name: contacts.find(c => c.id === lead.contact_id)
          ? `${contacts.find(c => c.id === lead.contact_id)?.first_name} ${contacts.find(c => c.id === lead.contact_id)?.last_name}`
          : null,
        assigned_partner_name: orgs.find(o => o.id === lead.assigned_partner_id)?.name || null,
      }));

      const enrichedAssignments = assignmentsData.map(a => ({
        ...a,
        partner_name: orgs.find(o => o.id === a.partner_org_id)?.name || 'Unknown',
      }));

      const enrichedCommissions = commissionsData.map(c => ({
        ...c,
        tenant_name: orgs.find(o => o.id === c.tenant_id)?.name || 'Unknown',
        contact_name: contacts.find(ct => ct.id === c.contact_id)
          ? `${contacts.find(ct => ct.id === c.contact_id)?.first_name} ${contacts.find(ct => ct.id === c.contact_id)?.last_name}`
          : null,
        liable_name: c.liable_user_id
          ? profiles.find(p => p.id === c.liable_user_id)?.display_name || profiles.find(p => p.id === c.liable_user_id)?.email || '—'
          : undefined,
      }));

      setLeads(enrichedLeads);
      setAssignments(enrichedAssignments);
      setCommissions(enrichedCommissions);

      setLeadStats({
        totalPool: leadsData.length,
        assigned: leadsData.filter(l => l.assigned_partner_id).length,
        pending: leadsData.filter(l => l.status === 'new').length,
        converted: leadsData.filter(l => l.status === 'converted').length,
      });

      const commAgg = aggregateCommissions(
        commissionsData.map(c => ({ amount: Number(c.amount), status: c.status })),
        ['paid'],
        ['cancelled'],
      );
      setCommissionStats({
        pending: commissionsData.filter(c => c.status === 'pending').length,
        approved: commissionsData.filter(c => c.status === 'approved').length,
        invoiced: commissionsData.filter(c => c.status === 'invoiced').length,
        paid: commAgg.paidCount,
        totalPending: commAgg.pending,
        totalPaid: commAgg.paid,
      });
    } catch (error) {
      console.error('Error fetching lead desk data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLead() {
    if (!newLead.name.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('leads').insert({
        source: 'manual', status: 'new', zone1_pool: true,
        interest_type: newLead.interest_type || null,
        notes: newLead.notes || null,
        raw_data: { name: newLead.name, email: newLead.email, phone: newLead.phone },
      } as any);
      if (error) throw error;
      toast({ title: 'Lead erstellt', description: `Lead "${newLead.name}" wurde erfolgreich angelegt.` });
      setCreateDialogOpen(false);
      setNewLead({ name: '', email: '', phone: '', interest_type: '', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({ title: 'Fehler', description: 'Lead konnte nicht erstellt werden.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  function openAssignDialog(leadId: string) {
    setSelectedLeadId(leadId);
    setSelectedPartnerId('');
    setAssignDialogOpen(true);
  }

  async function handleAssignLead() {
    if (!selectedLeadId || !selectedPartnerId) return;
    setAssigning(true);
    try {
      const { error } = await supabase.from('lead_assignments').insert({
        lead_id: selectedLeadId, partner_org_id: selectedPartnerId,
        status: 'offered', offered_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
      await supabase.from('leads').update({
        status: 'assigned', assigned_partner_id: selectedPartnerId,
      } as any).eq('id', selectedLeadId);
      toast({ title: 'Lead zugewiesen', description: 'Lead wurde dem Partner angeboten.' });
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({ title: 'Fehler', description: 'Zuweisung fehlgeschlagen.', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  }

  if (!isPlatformAdmin) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  const kpis: DeskKPI[] = [
    { label: 'Pool Gesamt', value: leadStats.totalPool, icon: Target, color: 'text-primary' },
    { label: 'Offen', value: leadStats.pending, icon: Users },
    { label: 'Konvertiert', value: leadStats.converted, icon: CheckCircle, color: 'text-primary' },
    { label: 'Prov. ausstehend', value: commissionStats.pending, icon: CreditCard, color: 'text-amber-500', subtitle: formatCurrency(commissionStats.totalPending) },
  ];

  return (
    <OperativeDeskShell
      title="Lead Desk"
      subtitle="Lead-Pool-Governance · Zuweisungen · Provisionen"
      moduleCode="MOD-10"
      kpis={kpis}
      zoneFlow={{ z3Surface: 'Kaufy / SoT Website', z1Desk: 'Lead Desk', z2Manager: 'MOD-10 Leadmanager' }}
      headerActions={
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />Lead anlegen
        </Button>
      }
    >
      <div className="space-y-6" ref={contentRef}>
        <Tabs defaultValue="pool">
          <TabsList>
            <TabsTrigger value="pool">Lead Pool</TabsTrigger>
            <TabsTrigger value="assignments">Zuweisungen</TabsTrigger>
            <TabsTrigger value="commissions">Provisionen</TabsTrigger>
          </TabsList>

          <TabsContent value="pool" className="space-y-4">
            <LeadPool leads={leads} onCreateLead={() => setCreateDialogOpen(true)} onAssignLead={openAssignDialog} />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <LeadAssignments assignments={assignments} />
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <LeadCommissions commissions={commissions} stats={commissionStats} />
          </TabsContent>
        </Tabs>

        {/* Create Lead Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Lead manuell anlegen</DialogTitle>
              <DialogDescription>Erstellen Sie einen neuen Lead für den Pool.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="lead-name">Name *</Label>
                <Input id="lead-name" value={newLead.name} onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))} placeholder="Vor- und Nachname" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-email">E-Mail</Label>
                <Input id="lead-email" type="email" value={newLead.email} onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))} placeholder="email@beispiel.de" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-phone">Telefon</Label>
                <Input id="lead-phone" type="tel" value={newLead.phone} onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))} placeholder="+49..." />
              </div>
              <div className="space-y-2">
                <Label>Interesse-Typ</Label>
                <Select value={newLead.interest_type} onValueChange={(value) => setNewLead(prev => ({ ...prev, interest_type: value }))}>
                  <SelectTrigger><SelectValue placeholder="Auswählen…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Kauf</SelectItem>
                    <SelectItem value="sale">Verkauf</SelectItem>
                    <SelectItem value="financing">Finanzierung</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="rental">Vermietung</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notizen</Label>
                <Textarea value={newLead.notes} onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))} placeholder="Zusätzliche Informationen…" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleCreateLead} disabled={!newLead.name.trim() || creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Lead erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Lead Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lead zuweisen</DialogTitle>
              <DialogDescription>Wählen Sie eine Partner-Organisation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Partner-Organisation</Label>
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger><SelectValue placeholder="Partner auswählen…" /></SelectTrigger>
                  <SelectContent>
                    {partnerOrgs.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={handleAssignLead} disabled={!selectedPartnerId || assigning}>
                {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Zuweisen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PdfExportFooter contentRef={contentRef} documentTitle="Lead Desk" subtitle={`${leadStats.totalPool} Leads · ${commissionStats.pending} Provisionen ausstehend`} moduleName="Zone 1 Admin" />
      </div>
    </OperativeDeskShell>
  );
}
