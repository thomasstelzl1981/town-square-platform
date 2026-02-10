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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Target, 
  Users, 
  Loader2,
  Eye,
  UserPlus,
  CheckCircle,
  Plus,
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

export default function LeadPool() {
  const { isPlatformAdmin } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    interest_type: '',
    notes: '',
  });
  const [stats, setStats] = useState({
    totalPool: 0,
    assigned: 0,
    pending: 0,
    converted: 0,
  });

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      const [leadsRes, assignmentsRes, orgsRes, contactsRes] = await Promise.all([
        supabase.from('leads').select('*').eq('zone1_pool', true),
        supabase.from('lead_assignments').select('*'),
        supabase.from('organizations').select('id, name'),
        supabase.from('contacts').select('id, first_name, last_name'),
      ]);

      const leadsData = leadsRes.data || [];
      const assignmentsData = assignmentsRes.data || [];
      const orgs = orgsRes.data || [];
      const contacts = contactsRes.data || [];

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

      setLeads(enrichedLeads);
      setAssignments(enrichedAssignments);

      setStats({
        totalPool: leadsData.length,
        assigned: leadsData.filter(l => l.assigned_partner_id).length,
        pending: leadsData.filter(l => l.status === 'new').length,
        converted: leadsData.filter(l => l.status === 'converted').length,
      });
    } catch (error) {
      console.error('Error fetching lead pool data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLead() {
    if (!newLead.name.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('leads').insert({
        source: 'manual',
        status: 'new',
        zone1_pool: true,
        interest_type: newLead.interest_type || null,
        notes: newLead.notes || null,
        raw_data: {
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
        },
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default">Neu</Badge>;
      case 'contacted':
        return <Badge variant="secondary">Kontaktiert</Badge>;
      case 'qualified':
        return <Badge variant="secondary">Qualifiziert</Badge>;
      case 'converted':
        return <Badge variant="default">Konvertiert</Badge>;
      case 'lost':
        return <Badge variant="destructive">Verloren</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" ref={contentRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase">Lead Pool (Zone 1)</h1>
          <p className="text-muted-foreground">
            Zentrale Lead-Verwaltung und Partner-Zuweisung
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Lead anlegen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pool Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.totalPool}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zugewiesen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.assigned}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Offen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Konvertiert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.converted}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pool">
        <TabsList>
          <TabsTrigger value="pool">Lead Pool</TabsTrigger>
          <TabsTrigger value="assignments">Zuweisungen</TabsTrigger>
        </TabsList>

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
                    <Plus className="h-4 w-4" />
                    Ersten Lead anlegen
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
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>{lead.interest_type || '—'}</TableCell>
                        <TableCell>{lead.contact_name || '—'}</TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>{lead.assigned_partner_name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(lead.created_at), 'dd.MM.yyyy', { locale: de })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <UserPlus className="h-4 w-4" />
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
                          <Badge variant={
                            a.accepted_at ? 'default' : 
                            a.rejected_at ? 'destructive' : 
                            'secondary'
                          }>
                            {a.accepted_at ? 'Akzeptiert' : a.rejected_at ? 'Abgelehnt' : 'Ausstehend'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(a.offered_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </TableCell>
                        <TableCell>
                          {a.accepted_at ? (
                            <span className="text-primary">{format(new Date(a.accepted_at), 'dd.MM.yyyy', { locale: de })}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {a.rejected_at ? (
                            <span className="text-destructive">{format(new Date(a.rejected_at), 'dd.MM.yyyy', { locale: de })}</span>
                          ) : '—'}
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

      {/* Create Lead Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lead manuell anlegen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Lead für den Pool. Der Lead kann anschließend einem Partner zugewiesen werden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Name *</Label>
              <Input
                id="lead-name"
                value={newLead.name}
                onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Vor- und Nachname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email">E-Mail</Label>
              <Input
                id="lead-email"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@beispiel.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefon</Label>
              <Input
                id="lead-phone"
                type="tel"
                value={newLead.phone}
                onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+49..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-interest">Interesse-Typ</Label>
              <Select
                value={newLead.interest_type}
                onValueChange={(value) => setNewLead(prev => ({ ...prev, interest_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen…" />
                </SelectTrigger>
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
              <Label htmlFor="lead-notes">Notizen</Label>
              <Textarea
                id="lead-notes"
                value={newLead.notes}
                onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Zusätzliche Informationen…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateLead} disabled={!newLead.name.trim() || creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lead erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Export */}
      <PdfExportFooter
        contentRef={contentRef}
        documentTitle="Lead Pool"
        subtitle={`${stats.totalPool} Leads im Pool`}
        moduleName="Zone 1 Admin"
      />
    </div>
  );
}
