/**
 * Finance Desk — Zone-1 Operative Desk für private Finanzberatung
 * 
 * 5-Tab-Struktur: Dashboard, Inbox, Zuweisung, Fälle, Monitor
 * Flow: Z3 (Website) → Z1 (Finance Desk) → Z2 (Manager-Account)
 */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Landmark, Users, Video, Shield, Building2,
  HeartHandshake, TrendingUp, ArrowRight, Inbox,
  Loader2, Briefcase, BarChart3
} from 'lucide-react';
import { OperativeDeskShell } from '@/components/admin/desks/OperativeDeskShell';
import type { DeskKPI } from '@/components/admin/desks/OperativeDeskShell';
import { PdfExportFooter } from '@/components/pdf';
import { useToast } from '@/hooks/use-toast';
import { FinanceDeskInbox } from '../finance-desk/FinanceDeskInbox';
import { FinanceDeskFaelle } from '../finance-desk/FinanceDeskFaelle';
import { FinanceDeskMonitor } from '../finance-desk/FinanceDeskMonitor';

const BERATUNGSFELDER = [
  { icon: Landmark, label: 'Stiftungen', desc: 'Stiftungsgründung & -verwaltung' },
  { icon: Shield, label: 'Vermögensschutz', desc: 'Asset Protection & Strukturierung' },
  { icon: HeartHandshake, label: 'Generationenvermögen', desc: 'Generationsübergreifender Vermögenserhalt' },
  { icon: Building2, label: 'Gewerbliche Versicherungen', desc: 'Betriebliche Versicherungskonzepte' },
  { icon: TrendingUp, label: 'Finanzierungen', desc: 'Privat- & Investitionsfinanzierungen' },
];

interface Lead {
  id: string;
  public_id: string | null;
  source: string;
  status: string;
  interest_type: string | null;
  created_at: string;
  contact_name?: string | null;
  assigned_partner_name?: string | null;
  notes?: string | null;
}

export default function FinanceDesk() {
  const { isPlatformAdmin } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partnerOrgs, setPartnerOrgs] = useState<{ id: string; name: string }[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  useEffect(() => {
    if (isPlatformAdmin) fetchData();
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      const [leadsRes, orgsRes, contactsRes] = await Promise.all([
        supabase.from('leads').select('*'),
        supabase.from('organizations').select('id, name'),
        supabase.from('contacts').select('id, first_name, last_name'),
      ]);

      const leadsData = leadsRes.data || [];
      const orgs = orgsRes.data || [];
      const contacts = contactsRes.data || [];
      setPartnerOrgs(orgs);

      const enrichedLeads = leadsData.map(lead => ({
        ...lead,
        contact_name: contacts.find(c => c.id === lead.contact_id)
          ? `${contacts.find(c => c.id === lead.contact_id)?.first_name} ${contacts.find(c => c.id === lead.contact_id)?.last_name}`
          : null,
        assigned_partner_name: orgs.find(o => o.id === lead.assigned_partner_id)?.name || null,
      }));

      setLeads(enrichedLeads);
    } catch (error) {
      console.error('Error fetching finance desk data:', error);
    } finally {
      setLoading(false);
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
      await supabase.from('leads').update({
        status: 'assigned',
        assigned_partner_id: selectedPartnerId,
      } as any).eq('id', selectedLeadId);
      toast({ title: 'Zugewiesen', description: 'Beratungsanfrage wurde dem Berater zugewiesen.' });
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

  const stats = {
    total: leads.length,
    newCount: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    assigned: leads.filter(l => l.status === 'assigned').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  const kpis: DeskKPI[] = [
    { label: 'Offene Anfragen', value: stats.newCount, icon: Inbox, color: 'text-amber-500' },
    { label: 'Kontaktiert', value: stats.contacted, icon: Users, color: 'text-primary' },
    { label: 'Qualifiziert', value: stats.qualified, icon: Video, color: 'text-emerald-500' },
    { label: 'Abgeschlossen', value: stats.converted + stats.lost, icon: Shield, color: 'text-muted-foreground' },
  ];

  return (
    <OperativeDeskShell
      title="Finance Desk"
      subtitle="Private Finanzberatung — Inbox · Zuweisung · Fälle · Monitor"
      moduleCode="MOD-18"
      zoneFlow={{
        z3Surface: 'Website / Portal',
        z1Desk: 'Finance Desk',
        z2Manager: 'Finanzberater (Manager)',
      }}
      kpis={kpis}
    >
      <div className="space-y-6" ref={contentRef}>
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="faelle">Fälle</TabsTrigger>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Beratungsangebot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Video className="h-5 w-5 text-primary" />
                  Persönliche Finanzberatung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nutzer können über das Portal oder die Website eine persönliche Finanzberatung per
                  Videotermin anfragen. Eingehende Leads erscheinen im Inbox und können an Berater
                  zugewiesen werden.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BERATUNGSFELDER.map((feld) => (
                    <div key={feld.label} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <feld.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{feld.label}</p>
                        <p className="text-xs text-muted-foreground">{feld.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="shrink-0">Lead-Flow</Badge>
                  <span>Anfrage via Website/Portal</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <span>Finance Desk (Triage)</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <span>Zuweisung an Berater</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <span>Videoberatung</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inbox" className="space-y-4">
            <FinanceDeskInbox leads={leads} onAssign={openAssignDialog} />
          </TabsContent>

          <TabsContent value="faelle" className="space-y-4">
            <FinanceDeskFaelle leads={leads} />
          </TabsContent>

          <TabsContent value="monitor" className="space-y-4">
            <FinanceDeskMonitor stats={stats} />
          </TabsContent>
        </Tabs>

        {/* Assign Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Beratungsanfrage zuweisen</DialogTitle>
              <DialogDescription>Wählen Sie einen Berater oder Partner-Organisation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Berater / Partner</Label>
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger><SelectValue placeholder="Berater auswählen…" /></SelectTrigger>
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

        <PdfExportFooter contentRef={contentRef} documentTitle="Finance Desk" subtitle={`${stats.total} Leads · ${stats.newCount} offen`} moduleName="Zone 1 Admin" />
      </div>
    </OperativeDeskShell>
  );
}
