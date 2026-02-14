/**
 * Lead Desk — Zone 1 Operative Desk for MOD-10 (Leadmanager)
 * Consolidates: Lead Pool + Zuweisungen + Provisionen
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Target, Users, Loader2, Eye, UserPlus, CheckCircle, Plus,
  Receipt, Clock, Euro, CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { PdfExportFooter } from '@/components/pdf';
import { useToast } from '@/hooks/use-toast';

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

interface LeadAssignment {
  id: string;
  lead_id: string;
  partner_org_id: string;
  partner_name?: string;
  status: string;
  offered_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
}

interface Commission {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  pipeline_id: string;
  contact_name?: string;
  amount: number;
  percentage: number | null;
  status: string;
  invoiced_at: string | null;
  paid_at: string | null;
  created_at: string;
  commission_type?: string | null;
  liable_user_id?: string | null;
  liable_name?: string;
  liable_role?: string | null;
  gross_commission?: number | null;
  platform_fee?: number | null;
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
  const [commissionStats, setCommissionStats] = useState({ pending: 0, approved: 0, invoiced: 0, paid: 0, totalPending: 0, totalPaid: 0 });

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

      const pendingC = commissionsData.filter(c => c.status === 'pending');
      const paidC = commissionsData.filter(c => c.status === 'paid');
      setCommissionStats({
        pending: pendingC.length,
        approved: commissionsData.filter(c => c.status === 'approved').length,
        invoiced: commissionsData.filter(c => c.status === 'invoiced').length,
        paid: paidC.length,
        totalPending: pendingC.reduce((sum, c) => sum + Number(c.amount), 0),
        totalPaid: paidC.reduce((sum, c) => sum + Number(c.amount), 0),
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

  const getLeadStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      new: { label: 'Neu', variant: 'default' },
      contacted: { label: 'Kontaktiert', variant: 'secondary' },
      qualified: { label: 'Qualifiziert', variant: 'secondary' },
      converted: { label: 'Konvertiert', variant: 'default' },
      lost: { label: 'Verloren', variant: 'destructive' },
    };
    const m = map[status];
    return m ? <Badge variant={m.variant}>{m.label}</Badge> : <Badge variant="outline">{status}</Badge>;
  };

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
      case 'approved': return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Genehmigt</Badge>;
      case 'invoiced': return <Badge className="bg-yellow-500"><Receipt className="h-3 w-3 mr-1" />Fakturiert</Badge>;
      case 'paid': return <Badge className="bg-green-500"><Euro className="h-3 w-3 mr-1" />Bezahlt</Badge>;
      case 'cancelled': return <Badge variant="destructive">Storniert</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Desk</h1>
          <p className="text-muted-foreground text-sm">Lead-Pool-Governance · Zuweisungen · Provisionen</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">MOD-10</Badge>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Lead anlegen
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pool Gesamt</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><span className="text-2xl font-bold">{leadStats.totalPool}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Offen</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-2xl font-bold">{leadStats.pending}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Konvertiert</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><span className="text-2xl font-bold">{leadStats.converted}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Prov. ausstehend</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-amber-500" /><span className="text-2xl font-bold">{commissionStats.pending}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(commissionStats.totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pool">
        <TabsList>
          <TabsTrigger value="pool">Lead Pool</TabsTrigger>
          <TabsTrigger value="assignments">Zuweisungen</TabsTrigger>
          <TabsTrigger value="commissions">Provisionen</TabsTrigger>
        </TabsList>

        {/* TAB 1: Lead Pool */}
        <TabsContent value="pool" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leads im Pool</CardTitle>
              <CardDescription>{leads.length} Leads zur Zuweisung verfügbar</CardDescription>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Leads im Pool</p>
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4" />Ersten Lead anlegen
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Quelle</TableHead>
                      <TableHead>Interesse</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zugewiesen an</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-mono text-xs">{lead.public_id || lead.id.slice(0, 8)}</TableCell>
                        <TableCell><Badge variant="outline">{lead.source}</Badge></TableCell>
                        <TableCell>{lead.interest_type || '—'}</TableCell>
                        <TableCell>{lead.contact_name || '—'}</TableCell>
                        <TableCell>{getLeadStatusBadge(lead.status)}</TableCell>
                        <TableCell>{lead.assigned_partner_name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(lead.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => openAssignDialog(lead.id)} title="Lead zuweisen"><UserPlus className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Zuweisungen */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lead-Zuweisungen</CardTitle>
              <CardDescription>{assignments.length} Zuweisungen im System</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Zuweisungen</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead ID</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Angeboten</TableHead>
                      <TableHead>Akzeptiert</TableHead>
                      <TableHead>Abgelehnt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs">{a.lead_id.slice(0, 8)}</TableCell>
                        <TableCell>{a.partner_name}</TableCell>
                        <TableCell>
                          <Badge variant={a.accepted_at ? 'default' : a.rejected_at ? 'destructive' : 'secondary'}>
                            {a.accepted_at ? 'Akzeptiert' : a.rejected_at ? 'Abgelehnt' : 'Ausstehend'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{format(new Date(a.offered_at), 'dd.MM.yyyy HH:mm', { locale: de })}</TableCell>
                        <TableCell>{a.accepted_at ? <span className="text-primary">{format(new Date(a.accepted_at), 'dd.MM.yyyy', { locale: de })}</span> : '—'}</TableCell>
                        <TableCell>{a.rejected_at ? <span className="text-destructive">{format(new Date(a.rejected_at), 'dd.MM.yyyy', { locale: de })}</span> : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Provisionen */}
        <TabsContent value="commissions" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ausstehend</CardTitle></CardHeader>
              <CardContent><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-500" /><span className="text-2xl font-bold">{commissionStats.pending}</span></div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Genehmigt</CardTitle></CardHeader>
              <CardContent><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{commissionStats.approved}</span></div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fakturiert</CardTitle></CardHeader>
              <CardContent><div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-yellow-500" /><span className="text-2xl font-bold">{commissionStats.invoiced}</span></div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bezahlt</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2"><Euro className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold">{commissionStats.paid}</span></div>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(commissionStats.totalPaid)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Provisionen</CardTitle>
              <CardDescription>{commissions.length} Provisionen im System</CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Provisionen</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Typ</TableHead>
                      <TableHead>Partner / Zahlungspfl.</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead className="text-right">Brutto</TableHead>
                      <TableHead className="text-right">Plattform (30%)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fakturiert</TableHead>
                      <TableHead>Bezahlt</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map(c => {
                      const typeLabels: Record<string, string> = { finance: 'Finanzierung', acquisition: 'Akquise', sales: 'Verkauf', lead: 'Lead' };
                      const roleLabels: Record<string, string> = { owner: 'Eigentümer', finance_manager: 'Finance Mgr.', akquise_manager: 'Akquise Mgr.', vertriebspartner: 'Vertriebsp.' };
                      return (
                        <TableRow key={c.id}>
                          <TableCell><Badge variant="outline" className="text-xs">{typeLabels[c.commission_type || ''] || c.commission_type || '—'}</Badge></TableCell>
                          <TableCell>
                            <div className="font-medium">{c.liable_name || c.tenant_name}</div>
                            {c.liable_role && <span className="text-xs text-muted-foreground">{roleLabels[c.liable_role] || c.liable_role}</span>}
                          </TableCell>
                          <TableCell>{c.contact_name || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{c.gross_commission ? formatCurrency(c.gross_commission) : formatCurrency(c.amount)}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">{c.platform_fee ? formatCurrency(c.platform_fee) : '—'}</TableCell>
                          <TableCell>{getCommissionStatusBadge(c.status)}</TableCell>
                          <TableCell className="text-muted-foreground">{c.invoiced_at ? format(new Date(c.invoiced_at), 'dd.MM.yyyy', { locale: de }) : '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{c.paid_at ? format(new Date(c.paid_at), 'dd.MM.yyyy', { locale: de }) : '—'}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            {c.status === 'pending' && <Button variant="ghost" size="sm" className="text-primary"><CheckCircle className="h-4 w-4" /></Button>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
  );
}
