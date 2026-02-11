/**
 * FM Fälle — Clean Case List with Pipeline Filters
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FolderOpen, Search, Loader2, Plus, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import type { FutureRoomCase } from '@/types/finance';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

function getNextAction(status: string): string {
  switch (status) {
    case 'delegated':
    case 'assigned': return 'Annehmen';
    case 'accepted': return 'Bearbeitung starten';
    case 'editing':
    case 'in_processing':
    case 'active': return 'Daten vervollständigen';
    case 'needs_customer_action': return 'Rückfrage prüfen';
    case 'ready_for_submission':
    case 'ready_to_submit': return 'Einreichen';
    case 'submitted_to_bank': return 'Bank-Rückmeldung';
    case 'completed': return '—';
    case 'rejected': return '—';
    default: return 'Öffnen';
  }
}

const FILTER_CHIPS = [
  { key: 'all', label: 'Alle' },
  { key: 'delegated', label: 'Delegiert' },
  { key: 'editing', label: 'In Bearbeitung' },
  { key: 'needs_customer_action', label: 'Rückfrage' },
  { key: 'ready_for_submission', label: 'Ready' },
  { key: 'submitted_to_bank', label: 'Eingereicht' },
  { key: 'completed', label: 'Abgeschlossen' },
] as const;

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default function FMFaelle({ cases, isLoading }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const filteredCases = cases.filter(c => {
    const mandate = c.finance_mandates;
    const request = mandate?.finance_requests;
    const applicant = request?.applicant_profiles?.[0];
    const status = getRequestStatus(c);
    const searchLower = search.toLowerCase();

    // Status filter
    if (activeFilter !== 'all') {
      const statusMatch = activeFilter === 'editing'
        ? ['editing', 'in_processing', 'active'].includes(status)
        : activeFilter === 'delegated'
        ? ['delegated', 'assigned'].includes(status)
        : activeFilter === 'ready_for_submission'
        ? ['ready_for_submission', 'ready_to_submit'].includes(status)
        : activeFilter === 'submitted_to_bank'
        ? ['submitted_to_bank'].includes(status) || !!c.submitted_to_bank_at
        : status === activeFilter;
      if (!statusMatch) return false;
    }

    // Text search
    return (
      !search ||
      mandate?.public_id?.toLowerCase().includes(searchLower) ||
      applicant?.first_name?.toLowerCase().includes(searchLower) ||
      applicant?.last_name?.toLowerCase().includes(searchLower) ||
      applicant?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <PageShell>
      <ModulePageHeader
        title="FÄLLE"
        description="Alle Finanzierungsfälle — filtern, bearbeiten und einreichen."
        actions={
          <Button size="sm" onClick={() => navigate('/portal/finanzierung')}>
            <Plus className="h-4 w-4 mr-1" />
            Eigenen Fall anlegen
          </Button>
        }
      />

      {/* Filter Chips + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_CHIPS.map(chip => (
            <Button
              key={chip.key}
              variant={activeFilter === chip.key ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 rounded-full"
              onClick={() => setActiveFilter(chip.key)}
            >
              {chip.label}
            </Button>
          ))}
        </div>
        <div className="relative w-48 ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
      </div>

      {/* Case Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">{search ? 'Keine Ergebnisse' : 'Keine Fälle vorhanden'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Antragsteller</TableHead>
                  <TableHead className="text-xs">Betrag</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Nächste Aktion</TableHead>
                  <TableHead className="text-xs">Alter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((c) => {
                  const mandate = c.finance_mandates;
                  const request = mandate?.finance_requests;
                  const applicant = request?.applicant_profiles?.[0];
                  const status = getRequestStatus(c);

                  return (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`${request?.id || c.id}`)}>
                      <TableCell className="font-mono text-xs py-2">
                        {mandate?.public_id || c.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        {applicant?.first_name && applicant?.last_name
                          ? `${applicant.first_name} ${applicant.last_name}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm py-2">
                        {applicant?.loan_amount_requested
                          ? eurFormat.format(applicant.loan_amount_requested)
                          : '—'}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={getStatusBadgeVariant(status)} className="text-[10px]">
                          {getStatusLabel(status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          {getNextAction(status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-2">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: false, locale: de })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
