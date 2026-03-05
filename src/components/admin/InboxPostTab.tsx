/**
 * R-3: Posteingang Tab extracted from Inbox.tsx
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inbox as InboxIcon, Eye, Route, XCircle, Archive, Send } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { InboundItem, Organization } from './inboxTypes';
import { getStatusBadge, getOrgName } from './inboxHelpers';

interface InboxPostTabProps {
  items: InboundItem[];
  organizations: Organization[];
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onViewItem: (item: InboundItem) => void;
  onRouteItem: (item: InboundItem) => void;
  onUpdateStatus: (itemId: string, status: string) => void;
}

export default function InboxPostTab({
  items, organizations, statusFilter, onStatusFilterChange,
  onViewItem, onRouteItem, onUpdateStatus,
}: InboxPostTabProps) {
  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Status:</Label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="pending">Offen</SelectItem>
                  <SelectItem value="assigned">Zugestellt</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                  <SelectItem value="rejected">Abgelehnt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eingehende Post</CardTitle>
          <CardDescription>{filteredItems.length} Einträge</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine Einträge</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Uhrzeit</TableHead>
                  <TableHead>Empfänger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.id.slice(0, 8)}</TableCell>
                    <TableCell>{format(new Date(item.created_at), 'dd.MM.yyyy', { locale: de })}</TableCell>
                    <TableCell>{format(new Date(item.created_at), 'HH:mm', { locale: de })}</TableCell>
                    <TableCell>{getOrgName(item.assigned_tenant_id, organizations)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => onViewItem(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => onRouteItem(item)} title="Routen / Zuweisen">
                            <Route className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onUpdateStatus(item.id, 'rejected')}>
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {item.status === 'assigned' && !item.routed_to_zone2_at && (
                        <Button variant="ghost" size="sm" onClick={() => onUpdateStatus(item.id, 'archived')}>
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      {item.routed_to_zone2_at && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Send className="h-3 w-3" />
                          Zone 2
                        </Badge>
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
