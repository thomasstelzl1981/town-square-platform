/**
 * LeadCommissions — Tab 3: Provisionen
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Clock, CheckCircle, Euro, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface Commission {
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

export interface CommissionStats {
  pending: number;
  approved: number;
  invoiced: number;
  paid: number;
  totalPending: number;
  totalPaid: number;
}

interface LeadCommissionsProps {
  commissions: Commission[];
  stats: CommissionStats;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

function getCommissionStatusBadge(status: string) {
  switch (status) {
    case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>;
    case 'approved': return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Genehmigt</Badge>;
    case 'invoiced': return <Badge className="bg-yellow-500"><Receipt className="h-3 w-3 mr-1" />Fakturiert</Badge>;
    case 'paid': return <Badge className="bg-green-500"><Euro className="h-3 w-3 mr-1" />Bezahlt</Badge>;
    case 'cancelled': return <Badge variant="destructive">Storniert</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export function LeadCommissions({ commissions, stats }: LeadCommissionsProps) {
  return (
    <div className="space-y-4">
      {/* Commission KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ausstehend</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-500" /><span className="text-2xl font-bold">{stats.pending}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Genehmigt</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{stats.approved}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fakturiert</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-yellow-500" /><span className="text-2xl font-bold">{stats.invoiced}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bezahlt</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2"><Euro className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold">{stats.paid}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(stats.totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Table */}
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
    </div>
  );
}
