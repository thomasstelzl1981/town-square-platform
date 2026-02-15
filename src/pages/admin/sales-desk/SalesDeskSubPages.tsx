/**
 * SalesDesk Sub-Pages — Inbox, Partner, Audit
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Inbox, Users2, FileText, Clock } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Inbox Tab ───────────────────────────────────────────────────────────────
export function InboxTab() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['sales-desk-inbox'],
    queryFn: async () => {
      // Future: fetch from a sales_desk_messages or notifications table
      return [] as any[];
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Sales Desk Inbox</h2>
      {isLoading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Laden...</CardContent></Card>
      ) : !messages?.length ? (
        <EmptyState
          icon={Inbox}
          title="Posteingang leer"
          description="Eingehende Nachrichten, Listing-Anfragen und Vertriebsbenachrichtigungen werden hier angezeigt"
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Betreff</TableHead>
                <TableHead>Von</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.subject}</TableCell>
                  <TableCell>{m.from}</TableCell>
                  <TableCell className="text-muted-foreground">{m.date}</TableCell>
                  <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ─── Partner Tab ─────────────────────────────────────────────────────────────
export function PartnerTab() {
  const { data: partners, isLoading } = useQuery({
    queryKey: ['sales-desk-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, created_at')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Partner-Verwaltung</h2>
      {isLoading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Laden...</CardContent></Card>
      ) : !partners?.length ? (
        <EmptyState
          icon={Users2}
          title="Keine Partner"
          description="Vertriebspartner-Organisationen werden hier aufgelistet"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vertriebspartner</CardTitle>
            <CardDescription>{partners.length} Organisationen im System</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Registriert</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.slice(0, 50).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString('de-DE')}</TableCell>
                    <TableCell className="text-center"><Badge variant="default">Aktiv</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Audit Tab ───────────────────────────────────────────────────────────────
export function AuditTab() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['sales-desk-audit'],
    queryFn: async () => {
      // Future: fetch from an audit_log or activity_log table
      return [] as any[];
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold uppercase">Audit Log</h2>
      {isLoading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Laden...</CardContent></Card>
      ) : !logs?.length ? (
        <EmptyState
          icon={FileText}
          title="Keine Audit-Einträge"
          description="Prüfpfad-Einträge für Listing-Änderungen, Freigaben und Sperrungen werden hier protokolliert"
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktion</TableHead>
                <TableHead>Benutzer</TableHead>
                <TableHead>Objekt</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell>{l.action}</TableCell>
                  <TableCell>{l.user}</TableCell>
                  <TableCell>{l.target}</TableCell>
                  <TableCell className="text-muted-foreground">{l.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
