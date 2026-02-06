import { Badge } from '@/components/ui/badge';
import { ServiceCaseStatus } from '@/hooks/useServiceCases';

const STATUS_CONFIG: Record<ServiceCaseStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Entwurf', variant: 'secondary' },
  scope_pending: { label: 'Leistung ausstehend', variant: 'outline' },
  scope_draft: { label: 'Leistung in Arbeit', variant: 'outline' },
  scope_finalized: { label: 'Leistung fertig', variant: 'default' },
  ready_to_send: { label: 'Versandbereit', variant: 'default' },
  sent: { label: 'Versendet', variant: 'default' },
  offers_received: { label: 'Angebote eingegangen', variant: 'default' },
  under_review: { label: 'In Prüfung', variant: 'secondary' },
  awarded: { label: 'Vergeben', variant: 'default' },
  in_progress: { label: 'In Ausführung', variant: 'default' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
  cancelled: { label: 'Abgebrochen', variant: 'destructive' },
};

interface ServiceCaseStatusBadgeProps {
  status: ServiceCaseStatus;
  className?: string;
}

export function ServiceCaseStatusBadge({ status, className }: ServiceCaseStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, variant: 'outline' as const };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
