/**
 * FreischaltungApplicationsTable — Table for pending/decided manager applications
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Clock, CheckCircle, XCircle, Eye, FileText, ShieldCheck, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ROLES_CATALOG, ROLE_EXTRA_TILES } from '@/constants/rolesMatrix';

export interface ManagerApplication {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  requested_role: string;
  qualification_data: Record<string, unknown> | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  source_brand: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  org_name?: string;
  user_email?: string;
  user_display_name?: string;
}

export interface ActiveManager {
  org_id: string;
  org_name: string;
  role: string;
  user_email?: string;
  activated_at?: string;
  client_count: number;
}

export function getRoleLabel(role: string): string {
  const found = ROLES_CATALOG.find(r => r.code === role || r.membershipRole === role);
  return found?.label || role;
}

export function getRoleModules(role: string): string {
  const extras = ROLE_EXTRA_TILES[role];
  return extras ? extras.join(' + ') : '—';
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft': return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Entwurf</Badge>;
    case 'submitted': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Eingereicht</Badge>;
    case 'in_review': return <Badge variant="secondary" className="border-primary/30"><Eye className="h-3 w-3 mr-1" />In Prüfung</Badge>;
    case 'approved': return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Genehmigt</Badge>;
    case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Abgelehnt</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

interface PendingTableProps {
  apps: ManagerApplication[];
  onSetInReview: (id: string) => void;
  onApprove: (app: ManagerApplication) => void;
  onReject: (app: ManagerApplication) => void;
}

export function PendingApplicationsTable({ apps, onSetInReview, onApprove, onReject }: PendingTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-amber-500" />Offene Manager-Bewerbungen</CardTitle>
        <CardDescription>{apps.length} Anträge warten auf Prüfung</CardDescription>
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          <div className="text-center py-12"><ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/30" /><p className="mt-3 text-muted-foreground">Keine offenen Anträge</p></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bewerber</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Gewünschte Rolle</TableHead>
                <TableHead>Modul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eingereicht</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map(app => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{app.applicant_name || app.user_display_name || app.user_email || '—'}</p>
                      <p className="text-xs text-muted-foreground">{app.applicant_email || app.user_email || '—'}</p>
                      {app.applicant_phone && <p className="text-xs text-muted-foreground">{app.applicant_phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{app.source_brand || '—'}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{getRoleLabel(app.requested_role)}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{getRoleModules(app.requested_role)}</TableCell>
                  <TableCell><StatusBadge status={app.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(app.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {app.status === 'submitted' && <Button variant="ghost" size="sm" onClick={() => onSetInReview(app.id)}><Eye className="h-4 w-4 mr-1" />Prüfen</Button>}
                    {(app.status === 'submitted' || app.status === 'in_review') && (
                      <>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700" onClick={() => onApprove(app)}><CheckCircle className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onReject(app)}><XCircle className="h-4 w-4" /></Button>
                      </>
                    )}
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

interface DecidedTableProps {
  apps: ManagerApplication[];
}

export function DecidedApplicationsTable({ apps }: DecidedTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entschiedene Anträge</CardTitle>
        <CardDescription>{apps.length} Anträge abgeschlossen</CardDescription>
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          <div className="text-center py-12"><FileText className="h-12 w-12 mx-auto text-muted-foreground/30" /><p className="mt-3 text-muted-foreground">Noch keine entschiedenen Anträge</p></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bewerber</TableHead><TableHead>Rolle</TableHead><TableHead>Status</TableHead><TableHead>Entschieden am</TableHead><TableHead>Grund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map(app => (
                <TableRow key={app.id}>
                  <TableCell><div><p className="font-medium">{app.user_display_name || app.user_email}</p><p className="text-xs text-muted-foreground">{app.org_name}</p></div></TableCell>
                  <TableCell><Badge variant="outline">{getRoleLabel(app.requested_role)}</Badge></TableCell>
                  <TableCell><StatusBadge status={app.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{app.reviewed_at ? format(new Date(app.reviewed_at), 'dd.MM.yyyy HH:mm', { locale: de }) : '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{app.rejection_reason || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

interface ActiveManagersTableProps {
  managers: ActiveManager[];
}

export function ActiveManagersTable({ managers }: ActiveManagersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><span className="h-5 w-5 text-emerald-500">👥</span>Aktive Manager-Tenants</CardTitle>
        <CardDescription>{managers.length} Partner-Organisationen mit Manager-Rolle</CardDescription>
      </CardHeader>
      <CardContent>
        {managers.length === 0 ? (
          <div className="text-center py-12"><p className="mt-3 text-muted-foreground">Noch keine aktiven Manager</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Organisation</TableHead><TableHead>Rolle</TableHead><TableHead>Aktiviert</TableHead><TableHead>Zugewiesene Kunden</TableHead></TableRow></TableHeader>
            <TableBody>
              {managers.map(mgr => (
                <TableRow key={mgr.org_id}>
                  <TableCell className="font-medium">{mgr.org_name}</TableCell>
                  <TableCell><Badge variant="outline">{getRoleLabel(mgr.role)}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{mgr.activated_at ? format(new Date(mgr.activated_at), 'dd.MM.yyyy', { locale: de }) : '—'}</TableCell>
                  <TableCell><Badge variant={mgr.client_count > 0 ? 'default' : 'secondary'}>{mgr.client_count} Kunden</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
