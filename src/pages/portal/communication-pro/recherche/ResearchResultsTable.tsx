/**
 * ResearchResultsTable — Full-width responsive results table with bulk actions
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, UserPlus, AlertTriangle } from 'lucide-react';
import { useResearchResults, type ResearchResult } from '@/hooks/useResearchResults';
import { useResearchImport } from '@/hooks/useResearchImport';
import { toast } from 'sonner';

interface Props {
  orderId: string;
}

export function ResearchResultsTable({ orderId }: Props) {
  const { data: results = [], isLoading } = useResearchResults(orderId);
  const importMutation = useResearchImport();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const importable = results.filter(r => r.status === 'candidate' || r.status === 'accepted');
    setSelected(new Set(importable.map(r => r.id)));
  };

  const handleImport = async (policy: 'skip' | 'update' = 'skip') => {
    if (!selected.size) return;
    try {
      const result = await importMutation.mutateAsync({
        orderId,
        resultIds: Array.from(selected),
        duplicatePolicy: policy,
      });
      toast.success(`${result.importedCount} Kontakte übernommen, ${result.skippedCount} übersprungen`);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(`Import fehlgeschlagen: ${e.message}`);
    }
  };

  const handleCSVExport = () => {
    const headers = ['Name', 'Firma', 'Rolle', 'Ort', 'E-Mail', 'Telefon', 'Quelle', 'Confidence', 'Status'];
    const rows = results.map(r => [
      r.full_name || '', r.company_name || '', r.role || '', r.location || '',
      r.email || '', r.phone || '', r.source_provider, r.confidence_score, r.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recherche-ergebnisse-${orderId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Ergebnisse werden geladen…</div>;
  }

  if (!results.length) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        Noch keine Ergebnisse vorhanden.
      </div>
    );
  }

  const needsReview = results.filter(r => r.confidence_score < 60 || !r.email);

  return (
    <div className="space-y-3">
      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border rounded-lg p-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">{selected.size} ausgewählt</span>
          <Button size="sm" onClick={() => handleImport('skip')} disabled={importMutation.isPending}>
            <UserPlus className="h-4 w-4 mr-1" />
            Ins Kontaktbuch
          </Button>
          <Button size="sm" variant="outline" onClick={handleCSVExport}>
            <Download className="h-4 w-4 mr-1" />
            CSV Export
          </Button>
        </div>
      )}

      {/* Needs Review Hint */}
      {needsReview.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{needsReview.length} Treffer benötigen manuelle Prüfung (fehlende E-Mail oder niedrige Confidence)</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left w-8">
                <Checkbox
                  checked={selected.size === results.filter(r => r.status !== 'imported').length && selected.size > 0}
                  onCheckedChange={checked => checked ? selectAll() : setSelected(new Set())}
                />
              </th>
              <th className="p-2 text-left font-medium">Name</th>
              <th className="p-2 text-left font-medium">Firma</th>
              <th className="p-2 text-left font-medium hidden md:table-cell">Rolle</th>
              <th className="p-2 text-left font-medium hidden lg:table-cell">Ort</th>
              <th className="p-2 text-left font-medium">E-Mail</th>
              <th className="p-2 text-left font-medium hidden md:table-cell">Telefon</th>
              <th className="p-2 text-left font-medium hidden lg:table-cell">Quelle</th>
              <th className="p-2 text-center font-medium w-16">Score</th>
              <th className="p-2 text-center font-medium w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-2">
                  <Checkbox
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggleSelect(r.id)}
                    disabled={r.status === 'imported'}
                  />
                </td>
                <td className="p-2 font-medium">{r.full_name || '—'}</td>
                <td className="p-2 text-muted-foreground">{r.company_name || '—'}</td>
                <td className="p-2 text-muted-foreground hidden md:table-cell">{r.role || '—'}</td>
                <td className="p-2 text-muted-foreground hidden lg:table-cell">{r.location || '—'}</td>
                <td className="p-2">
                  {r.email ? (
                    <span className="text-xs">{r.email}</span>
                  ) : (
                    <span className="text-xs text-amber-500">fehlt</span>
                  )}
                </td>
                <td className="p-2 text-muted-foreground hidden md:table-cell text-xs">{r.phone || '—'}</td>
                <td className="p-2 hidden lg:table-cell">
                  <Badge variant="outline" className="text-xs">{r.source_provider}</Badge>
                </td>
                <td className="p-2 text-center">
                  <ConfidenceBadge score={r.confidence_score} />
                </td>
                <td className="p-2 text-center">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-500';
  return <span className={`text-xs font-semibold ${color}`}>{score}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    candidate: { label: 'Neu', variant: 'outline' },
    accepted: { label: 'OK', variant: 'secondary' },
    rejected: { label: '✗', variant: 'outline' },
    imported: { label: '✓ Import', variant: 'default' },
  };
  const c = config[status] || config.candidate;
  return <Badge variant={c.variant} className="text-xs">{c.label}</Badge>;
}
