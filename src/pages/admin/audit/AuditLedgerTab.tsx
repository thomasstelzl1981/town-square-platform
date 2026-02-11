import { useState } from 'react';
import { useAuditLedger, type LedgerFilters } from './useAuditLedger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2, RefreshCw, ChevronDown, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const EVENT_TYPES = [
  'document.uploaded',
  'document.signed_url.view',
  'document.signed_url.download',
  'access_grant.created',
  'access_grant.revoked',
  'inbound.email.received',
  'outbound.email.sent',
  'inbound.webhook.received',
  'listing.published',
  'listing.unpublished',
  'tenant.reset.started',
  'tenant.reset.completed',
  'data.purge.executed',
];

const DIRECTIONS = ['ingress', 'egress', 'mutate', 'delete'] as const;
const ZONES = ['Z1', 'Z2', 'Z3', 'EXTERN'] as const;

function DirectionIcon({ direction }: { direction: string }) {
  switch (direction) {
    case 'ingress': return <ArrowDownLeft className="h-3.5 w-3.5 text-primary" />;
    case 'egress': return <ArrowUpRight className="h-3.5 w-3.5 text-accent-foreground" />;
    case 'mutate': return <Pencil className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'delete': return <Trash2 className="h-3.5 w-3.5 text-destructive" />;
    default: return null;
  }
}

function ZoneBadge({ zone }: { zone: string }) {
  const variant = zone === 'Z1' ? 'destructive' : zone === 'EXTERN' ? 'outline' : 'secondary';
  return <Badge variant={variant} className="text-xs font-mono">{zone}</Badge>;
}

function SourceBadge({ source }: { source: string }) {
  return <Badge variant="outline" className="text-xs">{source}</Badge>;
}

export default function AuditLedgerTab() {
  const { entries, loading, filters, setFilters, hasMore, loadMore, totalCount, refresh } = useAuditLedger();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const updateFilter = (key: keyof LedgerFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '__all__' ? undefined : value,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
            <Badge variant="secondary" className="ml-auto">{totalCount} Einträge</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Select value={filters.eventType || '__all__'} onValueChange={v => updateFilter('eventType', v)}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle Events</SelectItem>
                {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.direction || '__all__'} onValueChange={v => updateFilter('direction', v)}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Richtung" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle</SelectItem>
                {DIRECTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filters.zone || '__all__'} onValueChange={v => updateFilter('zone', v)}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Alle Zonen</SelectItem>
                {ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Von"
              value={filters.dateFrom || ''}
              onChange={e => updateFilter('dateFrom', e.target.value)}
              className="text-xs"
            />

            <Input
              type="date"
              placeholder="Bis"
              value={filters.dateTo || ''}
              onChange={e => updateFilter('dateTo', e.target.value)}
              className="text-xs"
            />

            <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Aktualisieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Zeitpunkt</TableHead>
                <TableHead className="w-[60px]">Zone</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="w-[40px]">Dir</TableHead>
                <TableHead className="w-[80px]">Quelle</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <Collapsible key={entry.id} asChild open={expandedRow === entry.id}>
                  <>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                    >
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(new Date(entry.created_at), 'dd.MM.yy HH:mm:ss', { locale: de })}
                      </TableCell>
                      <TableCell><ZoneBadge zone={entry.zone} /></TableCell>
                      <TableCell className="text-xs font-mono">{entry.event_type}</TableCell>
                      <TableCell><DirectionIcon direction={entry.direction} /></TableCell>
                      <TableCell><SourceBadge source={entry.source} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.entity_type && (
                          <span>{entry.entity_type}{entry.entity_id ? ` · ${entry.entity_id.slice(0, 8)}…` : ''}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedRow === entry.id ? 'rotate-180' : ''}`} />
                        </CollapsibleTrigger>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-3">
                          <pre className="text-xs font-mono whitespace-pre-wrap max-h-48 overflow-auto">
                            {JSON.stringify(entry.payload, null, 2)}
                          </pre>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            {entry.actor_user_id && <span>Actor: {entry.actor_user_id.slice(0, 8)}…</span>}
                            {entry.ip_hash && <span>IP: {entry.ip_hash.slice(0, 8)}…</span>}
                            {entry.tenant_id && <span>Tenant: {entry.tenant_id.slice(0, 8)}…</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
              {entries.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Keine Ledger-Einträge gefunden
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Load More */}
      {hasMore && entries.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
            {loading ? 'Laden…' : 'Weitere laden'}
          </Button>
        </div>
      )}
    </div>
  );
}
