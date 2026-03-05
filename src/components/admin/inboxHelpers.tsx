/**
 * R-3: Extracted helpers from Inbox.tsx (Admin Zone 1)
 */
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Archive, XCircle } from 'lucide-react';
import type { Organization } from './inboxTypes';

export const getOrgName = (tenantId: string | null, organizations: Organization[]) => {
  if (!tenantId) return '—';
  return organizations.find(o => o.id === tenantId)?.name || tenantId.slice(0, 8) + '...';
};

export const getStatusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
    pending: { variant: 'secondary', label: 'Offen', icon: <Clock className="h-3 w-3" /> },
    assigned: { variant: 'default', label: 'Zugestellt', icon: <CheckCircle className="h-3 w-3" /> },
    archived: { variant: 'outline', label: 'Archiviert', icon: <Archive className="h-3 w-3" /> },
    rejected: { variant: 'destructive', label: 'Abgelehnt', icon: <XCircle className="h-3 w-3" /> },
  };
  const s = map[status] || { variant: 'outline' as const, label: status, icon: null };
  return (
    <Badge variant={s.variant} className="gap-1">
      {s.icon}
      {s.label}
    </Badge>
  );
};

export const getMandateStatusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    requested: { variant: 'secondary', label: 'Eingereicht' },
    setup_in_progress: { variant: 'outline', label: 'In Bearbeitung' },
    active: { variant: 'default', label: 'Aktiv' },
    paused: { variant: 'outline', label: 'Pausiert' },
    cancelled: { variant: 'destructive', label: 'Widerrufen' },
  };
  const s = map[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
};
