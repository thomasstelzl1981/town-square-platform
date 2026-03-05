/**
 * AgreementsConsentLog — Consent log table for Agreements page
 */
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface UserConsent {
  id: string; user_id: string; tenant_id: string | null; template_id: string;
  template_version: number; status: 'accepted' | 'declined' | 'withdrawn';
  consented_at: string; ip_address: string | null; created_at: string;
}

interface Props {
  consents: UserConsent[];
  getTemplateName: (id: string) => string;
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'accepted': return 'default';
    case 'declined': return 'destructive';
    case 'withdrawn': return 'secondary';
    default: return 'outline';
  }
};

export function AgreementsConsentLog({ consents, getTemplateName }: Props) {
  return (
    <div className="space-y-4">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Consent-Logs sind unveränderlich und dienen als Audit-Trail für rechtliche Nachvollziehbarkeit.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Consent-Protokoll</CardTitle>
          <CardDescription>Letzte 200 protokollierte Zustimmungen</CardDescription>
        </CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Zustimmungen protokolliert</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Vorlage</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consents.map(consent => (
                  <TableRow key={consent.id}>
                    <TableCell className="text-sm">{format(new Date(consent.consented_at), 'dd.MM.yyyy HH:mm', { locale: de })}</TableCell>
                    <TableCell>{getTemplateName(consent.template_id)}</TableCell>
                    <TableCell><Badge variant="outline">v{consent.template_version}</Badge></TableCell>
                    <TableCell><Badge variant={getStatusVariant(consent.status)}>{consent.status}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{consent.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{consent.ip_address || '—'}</TableCell>
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
