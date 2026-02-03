/**
 * FM Fälle — Case List
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FolderOpen, Search, Loader2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  incomplete: 'Unvollständig',
  ready_to_submit: 'Bereit',
  submitted_to_zone1: 'Eingereicht',
  assigned: 'Zugewiesen',
  in_processing: 'In Bearbeitung',
  needs_customer_action: 'Wartet auf Kunde',
  completed: 'Abgeschlossen',
  rejected: 'Abgelehnt',
  active: 'Aktiv',
};

export default function FMFaelle({ cases, isLoading }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredCases = cases.filter(c => {
    const mandate = c.finance_mandates;
    const request = mandate?.finance_requests;
    const applicant = request?.applicant_profiles?.[0];
    const searchLower = search.toLowerCase();
    
    return (
      !search ||
      mandate?.public_id?.toLowerCase().includes(searchLower) ||
      applicant?.first_name?.toLowerCase().includes(searchLower) ||
      applicant?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Alle Fälle
            </CardTitle>
            <CardDescription>
              Ihre zugewiesenen Finanzierungsanfragen
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCases.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{search ? 'Keine Ergebnisse gefunden' : 'Keine Fälle vorhanden'}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Antragsteller</TableHead>
                <TableHead>Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alter</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((c) => {
                const mandate = c.finance_mandates;
                const request = mandate?.finance_requests;
                const applicant = request?.applicant_profiles?.[0];
                const requestStatus = request?.status || c.status;

                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm">
                      {mandate?.public_id || c.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {applicant?.first_name && applicant?.last_name
                        ? `${applicant.first_name} ${applicant.last_name}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {applicant?.loan_amount_requested
                        ? new Intl.NumberFormat('de-DE', { 
                            style: 'currency', 
                            currency: 'EUR',
                            maximumFractionDigits: 0
                          }).format(applicant.loan_amount_requested)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={requestStatus === 'needs_customer_action' ? 'destructive' : 'secondary'}>
                        {STATUS_LABELS[requestStatus] || requestStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { 
                        addSuffix: false, 
                        locale: de 
                      })}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigate(`${request?.id || c.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Öffnen
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
