/**
 * R-3: Mandates Tab extracted from Inbox.tsx
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Eye, Route } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { PostserviceMandate, Organization } from './inboxTypes';
import { getOrgName, getMandateStatusBadge } from './inboxHelpers';

interface InboxMandatesTabProps {
  mandates: PostserviceMandate[];
  organizations: Organization[];
  onViewMandate: (mandate: PostserviceMandate) => void;
  onCreateRuleFromMandate: (mandateId: string, tenantId: string) => void;
}

export default function InboxMandatesTab({ mandates, organizations, onViewMandate, onCreateRuleFromMandate }: InboxMandatesTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Postservice-Aufträge</CardTitle>
          <CardDescription>Nachsendeaufträge aus Zone 2 — Mandate verwalten und Routing einrichten</CardDescription>
        </CardHeader>
        <CardContent>
          {mandates.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Aufträge vorhanden</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Postfach-Nr.</TableHead>
                  <TableHead>Eingereicht am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mandates.map(mandate => (
                  <TableRow key={mandate.id}>
                    <TableCell className="font-medium">{getOrgName(mandate.tenant_id, organizations)}</TableCell>
                    <TableCell><Badge variant="outline">Nachsendeauftrag</Badge></TableCell>
                    <TableCell>{getMandateStatusBadge(mandate.status)}</TableCell>
                    <TableCell className="font-mono text-xs">{mandate.tenant_id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell>{format(new Date(mandate.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => onViewMandate(mandate)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {mandate.status === 'active' && (
                        <Button variant="ghost" size="sm" title="Routing-Regel anlegen" onClick={() => onCreateRuleFromMandate(mandate.id, mandate.tenant_id)}>
                          <Route className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
