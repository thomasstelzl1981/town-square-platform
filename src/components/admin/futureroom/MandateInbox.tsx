import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Inbox, Search, User, Building2, Clock, 
  CheckCircle2, Send, AlertCircle, Loader2,
  ArrowRight, Filter
} from 'lucide-react';
import { useFinanceMandates, useUpdateMandateStatus } from '@/hooks/useFinanceMandate';
import { DelegateManagerDialog } from './DelegateManagerDialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MandateStatus } from '@/types/finance';

// Status configuration with 'closed' added per FROZEN spec
const statusConfig: Record<MandateStatus | 'closed', { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'Neu', variant: 'default' },
  triage: { label: 'In Prüfung', variant: 'secondary' },
  delegated: { label: 'Zugewiesen', variant: 'outline' },
  accepted: { label: 'Angenommen', variant: 'default' },
  rejected: { label: 'Abgelehnt', variant: 'destructive' },
  closed: { label: 'Abgeschlossen', variant: 'secondary' },
};

export function MandateInbox() {
  const { data: mandates, isLoading, refetch } = useFinanceMandates();
  const updateStatus = useUpdateMandateStatus();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredMandates = React.useMemo(() => {
    if (!mandates) return [];
    
    return mandates.filter(mandate => {
      // Status filter
      if (statusFilter !== 'all' && mandate.status !== statusFilter) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const request = mandate.finance_requests as any;
        const applicant = request?.applicant_profiles?.[0];
        
        const searchFields = [
          mandate.public_id,
          request?.public_id,
          applicant?.first_name,
          applicant?.last_name,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(query)) return false;
      }
      
      return true;
    });
  }, [mandates, searchQuery, statusFilter]);

  const handleStatusChange = async (mandateId: string, status: MandateStatus) => {
    await updateStatus.mutateAsync({ mandateId, status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Mandate-Eingang
          </h2>
          <p className="text-muted-foreground">
            {mandates?.length || 0} Finanzierungsanfragen insgesamt
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Name oder ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="new">Neu</SelectItem>
            <SelectItem value="triage">In Prüfung</SelectItem>
            <SelectItem value="delegated">Zugewiesen</SelectItem>
            <SelectItem value="accepted">Angenommen</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mandate Cards */}
      {filteredMandates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Keine Mandate gefunden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMandates.map((mandate) => {
            const request = mandate.finance_requests as any;
            const applicant = request?.applicant_profiles?.[0];
            const status = statusConfig[mandate.status as MandateStatus] || statusConfig.new;
            
            return (
              <Card key={mandate.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm">{mandate.public_id || request?.public_id}</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {mandate.priority > 0 && (
                            <Badge variant="destructive" className="text-xs">Priorität</Badge>
                          )}
                        </div>
                        <p className="font-medium">
                          {applicant?.first_name && applicant?.last_name
                            ? `${applicant.first_name} ${applicant.last_name}`
                            : 'Name nicht angegeben'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(mandate.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </span>
                          {applicant?.loan_amount_requested && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(applicant.loan_amount_requested)}
                            </span>
                          )}
                          {applicant?.completion_score && (
                            <span className="flex items-center gap-1">
                              {applicant.completion_score >= 80 ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-yellow-500" />
                              )}
                              {applicant.completion_score}% vollständig
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      {mandate.status === 'new' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(mandate.id, 'triage')}
                            disabled={updateStatus.isPending}
                          >
                            Prüfen
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(mandate.id, 'rejected')}
                            disabled={updateStatus.isPending}
                          >
                            Ablehnen
                          </Button>
                        </>
                      )}
                      {mandate.status === 'triage' && (
                        <DelegateManagerDialog 
                          mandateId={mandate.id}
                          onDelegated={() => refetch()}
                        />
                      )}
                      {mandate.status === 'delegated' && (
                        <Badge variant="secondary">
                          Wartet auf Annahme
                        </Badge>
                      )}
                      {mandate.status === 'accepted' && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aktiv
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
