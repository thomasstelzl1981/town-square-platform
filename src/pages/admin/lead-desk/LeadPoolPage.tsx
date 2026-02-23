/**
 * LeadPoolPage — Wrapper for LeadPool with data fetching + dialogs
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { LeadPool } from './LeadPool';

export default function LeadPoolPage() {
  const { isPlatformAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [partnerOrgs, setPartnerOrgs] = useState<{ id: string; name: string }[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', interest_type: '', notes: '' });

  useEffect(() => {
    if (isPlatformAdmin) fetchData();
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      const [leadsRes, orgsRes, contactsRes] = await Promise.all([
        supabase.from('leads').select('*').eq('zone1_pool', true),
        supabase.from('organizations').select('id, name'),
        supabase.from('contacts').select('id, first_name, last_name'),
      ]);
      const contacts = contactsRes.data || [];
      const orgs = orgsRes.data || [];
      setPartnerOrgs(orgs);
      setLeads((leadsRes.data || []).map(lead => ({
        ...lead,
        contact_name: contacts.find(c => c.id === lead.contact_id)
          ? `${contacts.find(c => c.id === lead.contact_id)?.first_name} ${contacts.find(c => c.id === lead.contact_id)?.last_name}`
          : null,
        assigned_partner_name: orgs.find(o => o.id === lead.assigned_partner_id)?.name || null,
      })));
    } catch (err) {
      console.error('LeadPool fetch error:', err);
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
      toast({ title: 'Lead erstellt' });
      setCreateDialogOpen(false);
      setNewLead({ name: '', email: '', phone: '', interest_type: '', notes: '' });
      fetchData();
    } catch (err) {
      console.error('Create lead error:', err);
      toast({ title: 'Fehler', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  async function handleAssignLead() {
    if (!selectedLeadId || !selectedPartnerId) return;
    setAssigning(true);
    try {
      await supabase.from('lead_assignments').insert({
        lead_id: selectedLeadId, partner_org_id: selectedPartnerId,
        status: 'offered', offered_at: new Date().toISOString(),
      } as any);
      await supabase.from('leads').update({ status: 'assigned', assigned_partner_id: selectedPartnerId } as any).eq('id', selectedLeadId);
      toast({ title: 'Lead zugewiesen' });
      setAssignDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Assign lead error:', err);
      toast({ title: 'Fehler', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Lead anlegen</Button>
      </div>

      <LeadPool leads={leads} onCreateLead={() => setCreateDialogOpen(true)} onAssignLead={(id) => { setSelectedLeadId(id); setSelectedPartnerId(''); setAssignDialogOpen(true); }} />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lead manuell anlegen</DialogTitle>
            <DialogDescription>Erstellen Sie einen neuen Lead für den Pool.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} placeholder="Vor- und Nachname" /></div>
            <div className="space-y-2"><Label>E-Mail</Label><Input type="email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Telefon</Label><Input type="tel" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Interesse-Typ</Label>
              <Select value={newLead.interest_type} onValueChange={v => setNewLead(p => ({ ...p, interest_type: v }))}>
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
            <div className="space-y-2"><Label>Notizen</Label><Textarea value={newLead.notes} onChange={e => setNewLead(p => ({ ...p, notes: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleCreateLead} disabled={!newLead.name.trim() || creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead zuweisen</DialogTitle>
            <DialogDescription>Wählen Sie eine Partner-Organisation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Partner-Organisation</Label>
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger><SelectValue placeholder="Partner auswählen…" /></SelectTrigger>
              <SelectContent>
                {partnerOrgs.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleAssignLead} disabled={!selectedPartnerId || assigning}>
              {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
