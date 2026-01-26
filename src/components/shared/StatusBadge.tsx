import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'muted';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const statusVariantMap: Record<string, StatusVariant> = {
  // Generic
  active: 'success',
  aktiv: 'success',
  completed: 'success',
  abgeschlossen: 'success',
  approved: 'success',
  genehmigt: 'success',
  verified: 'success',
  verifiziert: 'success',
  paid: 'success',
  bezahlt: 'success',
  
  pending: 'warning',
  ausstehend: 'warning',
  in_progress: 'warning',
  in_bearbeitung: 'warning',
  review: 'warning',
  prüfung: 'warning',
  draft: 'warning',
  entwurf: 'warning',
  
  inactive: 'muted',
  inaktiv: 'muted',
  archived: 'muted',
  archiviert: 'muted',
  cancelled: 'muted',
  abgebrochen: 'muted',
  
  error: 'error',
  fehler: 'error',
  rejected: 'error',
  abgelehnt: 'error',
  failed: 'error',
  fehlgeschlagen: 'error',
  overdue: 'error',
  überfällig: 'error',
  
  new: 'info',
  neu: 'info',
  open: 'info',
  offen: 'info',
};

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-status-success/10 text-status-success border-status-success/20',
  warning: 'bg-status-warn/10 text-status-warn border-status-warn/20',
  error: 'bg-status-error/10 text-status-error border-status-error/20',
  info: 'bg-status-info/10 text-status-info border-status-info/20',
  default: 'bg-primary/10 text-primary border-primary/20',
  muted: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolvedVariant = variant || statusVariantMap[status.toLowerCase()] || 'default';
  
  return (
    <Badge
      variant="outline"
      className={cn(variantStyles[resolvedVariant], 'font-medium', className)}
    >
      {status}
    </Badge>
  );
}

// Dot indicator for compact status display
interface StatusDotProps {
  variant: StatusVariant;
  className?: string;
}

export function StatusDot({ variant, className }: StatusDotProps) {
  const dotColors: Record<StatusVariant, string> = {
    success: 'bg-status-success',
    warning: 'bg-status-warn',
    error: 'bg-status-error',
    info: 'bg-status-info',
    default: 'bg-primary',
    muted: 'bg-muted-foreground',
  };

  return (
    <span className={cn('inline-block h-2 w-2 rounded-full', dotColors[variant], className)} />
  );
}
