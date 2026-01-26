import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Building2,
  Loader2,
  Eye,
  UserPlus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
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

      // Enrich leads with contact names
      const enrichedLeads = leadsData.map(lead => ({
        ...lead,
        contact_name: contacts.find(c => c.id === lead.contact_id)
          ? `${contacts.find(c => c.id === lead.contact_id)?.first_name} ${contacts.find(c => c.id === lead.contact_id)?.last_name}`
          : null,
        assigned_partner_name: orgs.find(o => o.id === lead.assigned_partner_id)?.name || null,
      }));

      // Enrich assignments with partner names
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
        return <Badge className="bg-blue-500">Qualifiziert</Badge>;
      case 'converted':
        return <Badge className="bg-green-500">Konvertiert</Badge>;
      case 'lost':
        return <Badge variant="destructive">Verloren</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lead Pool (Zone 1)</h1>
        <p className="text-muted-foreground">
          Zentrale Lead-Verwaltung und Partner-Zuweisung
        </p>
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
              <UserPlus className="h-4 w-4 text-blue-500" />
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
              <Users className="h-4 w-4 text-yellow-500" />
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
              <CheckCircle className="h-4 w-4 text-green-500" />
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
                            <span className="text-green-600">{format(new Date(a.accepted_at), 'dd.MM.yyyy', { locale: de })}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {a.rejected_at ? (
                            <span className="text-red-600">{format(new Date(a.rejected_at), 'dd.MM.yyyy', { locale: de })}</span>
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
    </div>
  );
}
