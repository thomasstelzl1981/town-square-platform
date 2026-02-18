/**
 * Finance Desk — Inbox Tab
 * Zeigt alle eingehenden Finanzberatungs-Anfragen (Leads mit finance-relevantem interest_type).
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Inbox, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

interface FinanceDeskInboxProps {
  leads: Lead[];
  onAssign: (leadId: string) => void;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Neu', variant: 'default' },
  contacted: { label: 'Kontaktiert', variant: 'secondary' },
  qualified: { label: 'Qualifiziert', variant: 'outline' },
  assigned: { label: 'Zugewiesen', variant: 'secondary' },
  converted: { label: 'Konvertiert', variant: 'outline' },
  lost: { label: 'Verloren', variant: 'destructive' },
};

export function FinanceDeskInbox({ leads, onAssign }: FinanceDeskInboxProps) {
  const inboxLeads = leads.filter(l => l.status === 'new' || l.status === 'contacted');

  if (inboxLeads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">Keine offenen Anfragen im Inbox.</p>
          <p className="text-xs text-muted-foreground mt-1">Neue Beratungsanfragen erscheinen hier automatisch.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Inbox className="h-4 w-4 text-primary" />
          Eingehende Beratungsanfragen ({inboxLeads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead>Interesse</TableHead>
              <TableHead>Quelle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inboxLeads.map((lead) => {
              const badge = STATUS_BADGES[lead.status] || { label: lead.status, variant: 'outline' as const };
              return (
                <TableRow key={lead.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(lead.created_at), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell className="font-medium">{lead.contact_name || lead.public_id || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{lead.interest_type || 'Allgemein'}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{lead.source}</TableCell>
                  <TableCell>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => onAssign(lead.id)} className="gap-1">
                      Zuweisen <ArrowRight className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
