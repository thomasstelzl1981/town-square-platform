/**
 * TenancyLeaseCard — Inline-editable card for a single lease
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { isDemoId } from '@/engines/demoData/engine';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { calculateDepositInterest } from '@/engines/tenancyLifecycle/engine';
import type { LeaseWithContact, LeaseEdits, LetterType } from './tenancyTypes';
import {
  LEASE_TYPES, DEPOSIT_STATUSES, RENT_MODELS,
  calculateWarmRent, getField,
} from './tenancyTypes';

interface TenancyLeaseCardProps {
  lease: LeaseWithContact;
  edits: LeaseEdits;
  onUpdateField: (leaseId: string, field: string, value: string) => void;
  onDelete: (leaseId: string) => void;
  onActivate: (leaseId: string) => void;
  onOpenLetter: (lease: LeaseWithContact, type: LetterType) => void;
  deletingLeaseId: string | null;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active': return <Badge variant="default">Aktiv</Badge>;
    case 'draft': return <Badge variant="secondary">Entwurf</Badge>;
    case 'notice_given': return <Badge variant="destructive">Gekündigt</Badge>;
    case 'terminated': return <Badge variant="outline">Beendet</Badge>;
    case 'ended': return <Badge variant="outline">Beendet</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export function TenancyLeaseCard({
  lease, edits, onUpdateField, onDelete, onActivate, onOpenLetter, deletingLeaseId,
}: TenancyLeaseCardProps) {
  const cold = getField(lease, edits, 'rent_cold_eur');
  const nk = getField(lease, edits, 'nk_advance_eur');
  const heating = getField(lease, edits, 'heating_advance_eur');
  const warmRent = calculateWarmRent(cold, nk, heating);

  return (
    <Card className="relative group">
      {!isDemoId(lease.id) && (
        <WidgetDeleteOverlay
          title={lease.tenant_contact ? `${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}` : 'Mietvertrag'}
          onConfirmDelete={() => onDelete(lease.id)}
          isDeleting={deletingLeaseId === lease.id}
        />
      )}
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {lease.tenant_contact
              ? `${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}`
              : 'Kein Mieter'}
          </CardTitle>
          {getStatusBadge(lease.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        {/* Row 1: Vertragsart + Mietmodell */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vertragsart</Label>
            <Select value={getField(lease, edits, 'lease_type') || 'unbefristet'} onValueChange={(v) => onUpdateField(lease.id, 'lease_type', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LEASE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mietmodell</Label>
            <Select value={getField(lease, edits, 'rent_model') || 'FIX'} onValueChange={(v) => onUpdateField(lease.id, 'rent_model', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{RENT_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Miete */}
        <div className="grid grid-cols-3 gap-3 pt-1 border-t">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kaltmiete (€)</Label>
            <Input type="number" step="0.01" value={cold} onChange={(e) => onUpdateField(lease.id, 'rent_cold_eur', e.target.value)} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">NK-Vorausz. (€)</Label>
            <Input type="number" step="0.01" value={nk} onChange={(e) => onUpdateField(lease.id, 'nk_advance_eur', e.target.value)} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Heizk.-VZ (€)</Label>
            <Input type="number" step="0.01" value={heating} onChange={(e) => onUpdateField(lease.id, 'heating_advance_eur', e.target.value)} className="h-7 text-xs" />
          </div>
        </div>

        {/* Warmmiete computed */}
        <div className="flex justify-between items-center text-xs bg-muted/50 rounded px-3 py-1.5">
          <span className="text-muted-foreground">Warmmiete</span>
          <span className="font-semibold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(warmRent)}</span>
        </div>

        {/* Row 3: Laufzeit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mietbeginn</Label>
            <Input type="date" value={getField(lease, edits, 'start_date')} onChange={(e) => onUpdateField(lease.id, 'start_date', e.target.value)} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mietende</Label>
            <Input type="date" value={getField(lease, edits, 'end_date')} onChange={(e) => onUpdateField(lease.id, 'end_date', e.target.value)} className="h-7 text-xs" />
          </div>
        </div>

        {/* Row 4: Kaution + Zahlung */}
        <div className="grid grid-cols-3 gap-3 pt-1 border-t">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kaution (€)</Label>
            <Input type="number" step="0.01" value={getField(lease, edits, 'deposit_amount_eur')} onChange={(e) => onUpdateField(lease.id, 'deposit_amount_eur', e.target.value)} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kaution-Status</Label>
            <Select value={getField(lease, edits, 'deposit_status') || 'OPEN'} onValueChange={(v) => onUpdateField(lease.id, 'deposit_status', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DEPOSIT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zahlungstag</Label>
            <Input type="number" min={1} max={31} value={getField(lease, edits, 'payment_due_day')} onChange={(e) => onUpdateField(lease.id, 'payment_due_day', e.target.value)} className="h-7 text-xs" />
          </div>
        </div>

        {/* Deposit interest info */}
        {lease.deposit_amount_eur && lease.deposit_amount_eur > 0 && lease.deposit_status === 'PAID' && (
          <div className="text-[11px] text-muted-foreground px-1">
            {(() => {
              const interest = calculateDepositInterest(
                lease.deposit_amount_eur!,
                lease.start_date,
                new Date().toISOString().slice(0, 10)
              );
              return interest.years > 0 ? (
                <span>💰 Zinsgutschrift: {interest.accruedInterest.toFixed(2)} € ({interest.years} J., {(interest.annualRate * 100).toFixed(1)}%)</span>
              ) : null;
            })()}
          </div>
        )}

        {/* Row 5: Nächste Anpassung */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Nächste Mietanpassung</Label>
          <Input type="date" value={getField(lease, edits, 'next_rent_adjustment_date')} onChange={(e) => onUpdateField(lease.id, 'next_rent_adjustment_date', e.target.value)} className="h-7 text-xs" />
        </div>

        {/* Actions footer */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {lease.status === 'draft' && (
            <Button size="sm" className="h-7 text-xs" onClick={() => onActivate(lease.id)}>
              Aktivieren
            </Button>
          )}
          {(lease.status === 'active' || lease.status === 'notice_given') && (
            <>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenLetter(lease, 'kuendigung')}>
                <FileText className="mr-1 h-3 w-3" />Kündigung
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenLetter(lease, 'mieterhoehung')}>
                <TrendingUp className="mr-1 h-3 w-3" />Mieterhöhung
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenLetter(lease, 'abmahnung')}>
                <AlertTriangle className="mr-1 h-3 w-3" />Abmahnung
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
