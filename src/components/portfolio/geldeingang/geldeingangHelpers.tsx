/**
 * R-10: Helpers for GeldeingangTab
 */
import { Badge } from '@/components/ui/badge';
import type { GeldeingangLease, GeldeingangRentPayment } from './geldeingangTypes';

export const fmtEur = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

export function getWarmmiete(lease: GeldeingangLease): number {
  if (lease.rent_cold_eur && (lease.nk_advance_eur || lease.heating_advance_eur)) {
    return (lease.rent_cold_eur || 0) + (lease.nk_advance_eur || 0) + (lease.heating_advance_eur || 0);
  }
  return lease.monthly_rent;
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'paid': return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Bezahlt</Badge>;
    case 'partial': return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Teilweise</Badge>;
    case 'overdue': return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">Überfällig</Badge>;
    default: return <Badge variant="outline" className="text-muted-foreground">Offen</Badge>;
  }
}

export function getSourceBadge(payment: GeldeingangRentPayment | undefined) {
  if (!payment) return null;
  const note = payment.notes?.toLowerCase() || '';
  if (note.includes('auto_match') || note.includes('auto-match'))
    return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">Auto</Badge>;
  if (note.includes('manual_override') || note.includes('manuell'))
    return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">Manuell</Badge>;
  return <Badge variant="outline" className="text-xs">Eingabe</Badge>;
}

export const MATCH_STEPS = [
  'Kontodaten laden…',
  'Transaktionen prüfen…',
  'Mietzahlungen abgleichen…',
  'Rückstände prüfen…',
  'Ergebnis aufbereiten…',
];
