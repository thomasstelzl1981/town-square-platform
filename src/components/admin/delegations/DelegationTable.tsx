/**
 * DelegationTable — Table with filter for Delegations page
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, XCircle, Link2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AVAILABLE_SCOPES } from '@/components/admin/ScopePicker';
import type { Tables, Enums } from '@/integrations/supabase/types';

type OrgDelegation = Tables<'org_delegations'>;
type DelegationStatus = Enums<'delegation_status'>;

const STATUS_LABELS: Record<string, string> = { active: 'Aktiv', revoked: 'Widerrufen', expired: 'Abgelaufen' };

const getStatusVariant = (status: DelegationStatus) => {
  switch (status) { case 'active': return 'default'; case 'revoked': return 'destructive'; case 'expired': return 'secondary'; default: return 'outline'; }
};

const getScopeLabel = (v: string) => AVAILABLE_SCOPES.find(s => s.value === v)?.label || v;

const formatScopes = (scopes: any) => {
  if (!Array.isArray(scopes)) return JSON.stringify(scopes);
  if (scopes.length === 0) return 'Keine';
  return scopes.slice(0, 2).map(s => getScopeLabel(s)).join(', ') + (scopes.length > 2 ? ` +${scopes.length - 2}` : '');
};

interface Props {
  delegations: OrgDelegation[];
  loading: boolean;
  getOrgName: (id: string) => string;
  onView: (d: OrgDelegation) => void;
  onRevoke: (d: OrgDelegation) => void;
}

export function DelegationTable({ delegations, loading, getOrgName, onView, onRevoke }: Props) {
  const [statusFilter, setStatusFilter] = useState<DelegationStatus | 'all'>('all');
  const filtered = delegations.filter(d => statusFilter === 'all' || d.status === statusFilter);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Alle Delegierungen</CardTitle>
            <CardDescription>{filtered.length} von {delegations.length} Delegationen</CardDescription>
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as DelegationStatus | 'all')}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status-Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="revoked">Widerrufen</SelectItem>
              <SelectItem value="expired">Abgelaufen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">{delegations.length === 0 ? 'Keine Delegierungen gefunden' : 'Keine Treffer für Filter'}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delegat → Ziel</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erteilt</TableHead>
                <TableHead>Ablauf</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getOrgName(d.delegate_org_id)}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{getOrgName(d.target_org_id)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]"><span className="text-sm text-muted-foreground truncate block">{formatScopes(d.scopes)}</span></TableCell>
                  <TableCell><Badge variant={getStatusVariant(d.status)}>{STATUS_LABELS[d.status] || d.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(d.granted_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{d.expires_at ? format(new Date(d.expires_at), 'dd.MM.yyyy', { locale: de }) : '—'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onView(d)}><Eye className="h-4 w-4" /></Button>
                    {d.status === 'active' && <Button variant="ghost" size="sm" onClick={() => onRevoke(d)}><XCircle className="h-4 w-4 text-destructive" /></Button>}
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
