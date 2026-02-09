import { useState } from 'react';
import { useAuditReports, useTogglePin } from './useAuditReports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Pin, PinOff, Search, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import AuditReportDetail from './AuditReportDetail';

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PASS: 'default',
  PASS_WITH_FIXES: 'secondary',
  FAIL: 'destructive',
};

export default function AuditReportsTab() {
  const { data: reports, isLoading } = useAuditReports();
  const togglePin = useTogglePin();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <AuditReportDetail reportId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const filtered = (reports || []).filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Suche..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="PASS">PASS</SelectItem>
            <SelectItem value="PASS_WITH_FIXES">PASS_WITH_FIXES</SelectItem>
            <SelectItem value="FAIL">FAIL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Keine Reports vorhanden.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(report => {
            const counts = report.counts as any || { p0: 0, p1: 0, p2: 0 };
            return (
              <Card key={report.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">{report.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(report.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant={STATUS_BADGE[report.status] || 'outline'}>{report.status}</Badge>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => togglePin.mutate({ id: report.id, pinned: !report.is_pinned })}
                      >
                        {report.is_pinned ? <Pin className="h-3.5 w-3.5 text-primary" /> : <PinOff className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-destructive font-medium">P0: {counts.p0}</span>
                    <span className="text-orange-500 font-medium">P1: {counts.p1}</span>
                    <span className="text-muted-foreground">P2: {counts.p2}</span>
                    {report.repo_ref && (
                      <span className="font-mono text-muted-foreground truncate max-w-[120px]">{report.repo_ref}</span>
                    )}
                    {report.pr_url && (
                      <a href={report.pr_url} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                        PR <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto" onClick={() => setSelectedId(report.id)}>
                    Öffnen
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
