/**
 * LeadPool — Tab 1: Lead Pool Tabelle
 * Zeigt alle Leads im Z1 Pool mit Zuweisungs-Aktionen.
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Target, Eye, UserPlus, Plus } from 'lucide-react';
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

interface LeadPoolProps {
  leads: Lead[];
  onCreateLead: () => void;
  onAssignLead: (leadId: string) => void;
}

function getLeadStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    new: { label: 'Neu', variant: 'default' },
    contacted: { label: 'Kontaktiert', variant: 'secondary' },
    qualified: { label: 'Qualifiziert', variant: 'secondary' },
    converted: { label: 'Konvertiert', variant: 'default' },
    lost: { label: 'Verloren', variant: 'destructive' },
  };
  const m = map[status];
  return m ? <Badge variant={m.variant}>{m.label}</Badge> : <Badge variant="outline">{status}</Badge>;
}

export function LeadPool({ leads, onCreateLead, onAssignLead }: LeadPoolProps) {
  return (
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
            <Button variant="outline" className="mt-4 gap-2" onClick={onCreateLead}>
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
                    <Button variant="ghost" size="sm" onClick={() => onAssignLead(lead.id)} title="Lead zuweisen"><UserPlus className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
