/**
 * Deletion Inbox — Tabelle mit Filtern + Intake-Button
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ChevronRight, AlertTriangle } from 'lucide-react';
import type { DeletionRequest } from '../useComplianceCases';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW: { label: 'Neu', className: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  IDENTITY_REQUIRED: { label: 'ID prüfen', className: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  IN_REVIEW: { label: 'In Prüfung', className: 'bg-violet-500/10 text-violet-700 border-violet-200' },
  HOLD_LEGAL: { label: 'Legal Hold', className: 'bg-orange-500/10 text-orange-700 border-orange-200' },
  RESPONDED: { label: 'Beantwortet', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  CLOSED: { label: 'Geschlossen', className: 'bg-muted text-muted-foreground' },
  REJECTED: { label: 'Abgelehnt', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  // Legacy
  open: { label: 'Offen', className: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  scheduled: { label: 'Eingeplant', className: 'bg-violet-500/10 text-violet-700 border-violet-200' },
  executed: { label: 'Ausgeführt', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  closed: { label: 'Geschlossen', className: 'bg-muted text-muted-foreground' },
};

interface DeletionCaseListProps {
  requests: DeletionRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewRequest: () => void;
}

export function DeletionCaseList({ requests, selectedId, onSelect, onNewRequest }: DeletionCaseListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const filtered = statusFilter === 'ALL' ? requests : requests.filter(r => r.status === statusFilter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Status filtern" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Alle Status</SelectItem>
              <SelectItem value="NEW">Neu</SelectItem>
              <SelectItem value="IDENTITY_REQUIRED">ID prüfen</SelectItem>
              <SelectItem value="IN_REVIEW">In Prüfung</SelectItem>
              <SelectItem value="HOLD_LEGAL">Legal Hold</SelectItem>
              <SelectItem value="RESPONDED">Beantwortet</SelectItem>
              <SelectItem value="CLOSED">Geschlossen</SelectItem>
              <SelectItem value="REJECTED">Abgelehnt</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{filtered.length} Anträge</span>
        </div>
        <Button size="sm" onClick={onNewRequest}><Plus className="h-3 w-3 mr-1" /> Neuer Löschantrag</Button>
      </div>

      {filtered.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Anfragender</TableHead>
                <TableHead className="text-xs">Kanal</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Frist</TableHead>
                <TableHead className="text-xs">Hold</TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => {
                const cfg = STATUS_CONFIG[r.status] || { label: r.status, className: '' };
                const isOverdue = r.due_date && new Date(r.due_date) < new Date() && r.status !== 'CLOSED' && r.status !== 'REJECTED';
                const isSelected = selectedId === r.id;
                return (
                  <TableRow
                    key={r.id}
                    className={`cursor-pointer hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => onSelect(r.id)}
                  >
                    <TableCell className="text-sm">
                      <div>
                        <span className="font-medium">{r.requester_email}</span>
                        {r.requester_name && <span className="text-xs text-muted-foreground ml-1">({r.requester_name})</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{r.request_channel || '—'}</TableCell>
                    <TableCell><Badge className={cfg.className}>{cfg.label}</Badge></TableCell>
                    <TableCell className={`text-xs ${isOverdue ? 'text-destructive font-semibold' : ''}`}>
                      {r.due_date ? new Date(r.due_date).toLocaleDateString('de-DE') : '—'}
                      {isOverdue && ' ⚠️'}
                    </TableCell>
                    <TableCell>
                      {r.legal_hold_reason && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell><ChevronRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {statusFilter !== 'ALL' ? 'Keine Anträge mit diesem Status.' : 'Keine Löschanträge vorhanden.'}
        </div>
      )}
    </div>
  );
}
