/**
 * NcoreLeadPool — Lead-Pool tab for Ncore Desk
 * Shows all leads from ncore_projekt + ncore_kooperation sources
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, UserPlus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-700',
  contacted: 'bg-yellow-500/10 text-yellow-700',
  qualified: 'bg-green-500/10 text-green-700',
  converted: 'bg-primary/10 text-primary',
  lost: 'bg-destructive/10 text-destructive',
};

export default function NcoreLeadPool() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLead, setDetailLead] = useState<any | null>(null);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [assignTarget, setAssignTarget] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    const [leadsRes, orgsRes] = await Promise.all([
      supabase.from('leads').select('*').in('source', ['ncore_projekt', 'ncore_kooperation']).order('created_at', { ascending: false }),
      supabase.from('organizations').select('id, name'),
    ]);
    setLeads(leadsRes.data || []);
    setOrgs(orgsRes.data || []);
    setLoading(false);
  }

  async function handleAssign() {
    if (!detailLead || !assignTarget) return;
    setAssigning(true);
    const { error } = await supabase.from('leads').update({
      assigned_partner_id: assignTarget,
      status: 'contacted',
    } as any).eq('id', detailLead.id);
    setAssigning(false);
    if (error) {
      toast({ title: 'Fehler bei Zuweisung', variant: 'destructive' });
    } else {
      toast({ title: 'Lead zugewiesen' });
      setDetailLead(null);
      setAssignTarget('');
      fetchLeads();
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lead-Pool — Ncore Business Consulting</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Noch keine Leads eingegangen.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zugewiesen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(lead.created_at), 'dd.MM.yy HH:mm')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lead.source === 'ncore_kooperation' ? 'Kooperation' : 'Projekt'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{(lead.raw_data as any)?.name || '–'}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[lead.status] || ''}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{orgs.find(o => o.id === lead.assigned_partner_id)?.name || '–'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setDetailLead(lead); setAssignTarget(lead.assigned_partner_id || ''); }}>
                        <Eye className="h-4 w-4 mr-1" /> Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailLead} onOpenChange={open => !open && setDetailLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead-Details</DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Typ:</span> {detailLead.source === 'ncore_kooperation' ? 'Kooperation' : 'Projekt'}</div>
                <div><span className="text-muted-foreground">Status:</span> {detailLead.status}</div>
                <div><span className="text-muted-foreground">Name:</span> {(detailLead.raw_data as any)?.name}</div>
                <div><span className="text-muted-foreground">E-Mail:</span> {(detailLead.raw_data as any)?.email}</div>
                <div><span className="text-muted-foreground">Telefon:</span> {(detailLead.raw_data as any)?.phone || '–'}</div>
                <div><span className="text-muted-foreground">Firma:</span> {(detailLead.raw_data as any)?.company || '–'}</div>
              </div>
              {detailLead.notes && <div><span className="text-muted-foreground">Nachricht:</span><p className="mt-1 bg-muted/50 rounded p-2">{detailLead.notes}</p></div>}
              <div className="pt-2 border-t">
                <label className="text-xs text-muted-foreground block mb-1">Zuweisen an:</label>
                <Select value={assignTarget} onValueChange={setAssignTarget}>
                  <SelectTrigger><SelectValue placeholder="Organisation wählen" /></SelectTrigger>
                  <SelectContent>{orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleAssign} disabled={!assignTarget || assigning}>
              {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
              Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
