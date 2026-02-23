/**
 * FinanceDeskInboxPage — Lazy-loaded wrapper for FinanceDeskInbox with data + assign dialog
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { FinanceDeskInbox } from './FinanceDeskInbox';

export default function FinanceDeskInboxPage() {
  const { isPlatformAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [partnerOrgs, setPartnerOrgs] = useState<{ id: string; name: string }[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  useEffect(() => {
    if (!isPlatformAdmin) return;
    (async () => {
      try {
        const [leadsRes, orgsRes, contactsRes] = await Promise.all([
          supabase.from('leads').select('*'),
          supabase.from('organizations').select('id, name'),
          supabase.from('contacts').select('id, first_name, last_name'),
        ]);
        const orgs = orgsRes.data || [];
        const contacts = contactsRes.data || [];
        setPartnerOrgs(orgs);
        setLeads((leadsRes.data || []).map(lead => ({
          ...lead,
          contact_name: contacts.find(c => c.id === lead.contact_id) ? `${contacts.find(c => c.id === lead.contact_id)?.first_name} ${contacts.find(c => c.id === lead.contact_id)?.last_name}` : null,
          assigned_partner_name: orgs.find(o => o.id === lead.assigned_partner_id)?.name || null,
        })));
      } catch (err) {
        console.error('FinanceDeskInbox fetch:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPlatformAdmin]);

  async function handleAssign() {
    if (!selectedLeadId || !selectedPartnerId) return;
    setAssigning(true);
    try {
      await supabase.from('leads').update({ status: 'assigned', assigned_partner_id: selectedPartnerId } as any).eq('id', selectedLeadId);
      toast({ title: 'Zugewiesen' });
      setAssignDialogOpen(false);
    } catch (err) {
      console.error('Assign error:', err);
      toast({ title: 'Fehler', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <FinanceDeskInbox leads={leads} onAssign={(id) => { setSelectedLeadId(id); setSelectedPartnerId(''); setAssignDialogOpen(true); }} />
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beratungsanfrage zuweisen</DialogTitle>
            <DialogDescription>Wählen Sie einen Berater.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Berater / Partner</Label>
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger><SelectValue placeholder="Berater auswählen…" /></SelectTrigger>
              <SelectContent>{partnerOrgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleAssign} disabled={!selectedPartnerId || assigning}>
              {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
