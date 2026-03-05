/**
 * TenancyHistoricalLeases — Collapsible list of terminated/ended leases
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { History, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { LeaseWithContact } from './tenancyTypes';
import { formatCurrency } from './tenancyTypes';

interface TenancyHistoricalLeasesProps {
  leases: LeaseWithContact[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'terminated': return <Badge variant="outline">Beendet</Badge>;
    case 'ended': return <Badge variant="outline">Beendet</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '–';
  return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
};

export function TenancyHistoricalLeases({ leases }: TenancyHistoricalLeasesProps) {
  const [open, setOpen] = useState(false);

  if (leases.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <History className="h-3.5 w-3.5" />
            Historische Verträge ({leases.length})
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {leases.map(lease => (
          <div key={lease.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs">
            <div>
              <p className="font-medium text-muted-foreground">
                {lease.tenant_contact?.last_name}, {lease.tenant_contact?.first_name}
              </p>
              <p className="text-muted-foreground">
                {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(lease.status)}
              <p className="text-muted-foreground mt-1">{formatCurrency(lease.monthly_rent)}</p>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
