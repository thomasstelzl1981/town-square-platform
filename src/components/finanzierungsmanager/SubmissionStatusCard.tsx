/**
 * SubmissionStatusCard — Kachel 3: Submission-Log mit Statuswechsel
 * Extracted from FMEinreichung.tsx (R-1)
 */
import { Check, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SubmissionStatusCardProps {
  selectedId: string | null;
  submissionLogs: any[];
  handleUpdateLogStatus: (logId: string, newStatus: string) => Promise<void>;
  handleSelectBank: (logId: string) => Promise<void>;
  handleArchiveCase: () => Promise<void>;
}

export function SubmissionStatusCard({
  selectedId, submissionLogs, handleUpdateLogStatus, handleSelectBank, handleArchiveCase,
}: SubmissionStatusCardProps) {
  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2 border-b bg-muted/20">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Check className="h-4 w-4" /> 3. Status & Ergebnis
          </h3>
        </div>
        {!selectedId || submissionLogs.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Bank / Kanal</TableHead>
                <TableHead className="text-xs">Eingereicht</TableHead>
                <TableHead className="text-xs">Kanal</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-[140px]">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  {selectedId ? 'Noch keine Einreichungen vorhanden.' : 'Bitte wählen Sie oben eine Akte aus.'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Bank / Kanal</TableHead>
                  <TableHead className="text-xs">Eingereicht</TableHead>
                  <TableHead className="text-xs">Kanal</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-[140px]">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionLogs.map(log => (
                  <TableRow key={log.id} className={cn(log.is_selected && 'bg-primary/5')}>
                    <TableCell className="text-sm font-medium">
                      {log.finance_bank_contacts?.bank_name || log.external_software_name || '—'}
                      {log.is_selected && <Badge className="ml-2 text-[10px]" variant="default">Ausgewählt</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.submitted_at ? new Date(log.submitted_at).toLocaleDateString('de-DE') : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">{log.channel === 'email' ? 'E-Mail' : 'Extern'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={log.status} onValueChange={(val) => handleUpdateLogStatus(log.id, val)}>
                        <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sent">Gesendet</SelectItem>
                          <SelectItem value="waiting">Warte auf Antwort</SelectItem>
                          <SelectItem value="follow_up">Nachfrage</SelectItem>
                          <SelectItem value="approved">Zusage</SelectItem>
                          <SelectItem value="rejected">Absage</SelectItem>
                          <SelectItem value="handed_over">Übergeben</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {!log.is_selected && log.status === 'approved' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSelectBank(log.id)}>Auswählen</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {submissionLogs.some((l: any) => l.is_selected) && (
              <div className="px-4 py-3 border-t flex justify-end">
                <Button onClick={handleArchiveCase} className="text-xs">
                  <Archive className="h-3.5 w-3.5 mr-1" /> Fall abschließen → Archiv
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
