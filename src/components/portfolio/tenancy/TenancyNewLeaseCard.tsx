/**
 * TenancyNewLeaseCard — Inline form for creating a new lease
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import type { Contact } from './tenancyTypes';
import { LEASE_TYPES, RENT_MODELS, DEPOSIT_STATUSES, calculateWarmRent } from './tenancyTypes';

export interface NewLeaseState {
  tenant_contact_id: string;
  lease_type: string;
  start_date: string;
  end_date: string;
  rent_cold_eur: string;
  nk_advance_eur: string;
  heating_advance_eur: string;
  deposit_amount_eur: string;
  deposit_status: string;
  payment_due_day: string;
  rent_model: string;
  next_rent_adjustment_date: string;
}

export const EMPTY_NEW_LEASE: NewLeaseState = {
  tenant_contact_id: '', lease_type: 'unbefristet', start_date: '', end_date: '',
  rent_cold_eur: '', nk_advance_eur: '', heating_advance_eur: '', deposit_amount_eur: '',
  deposit_status: 'OPEN', payment_due_day: '1', rent_model: 'FIX', next_rent_adjustment_date: '',
};

interface TenancyNewLeaseCardProps {
  contacts: Contact[];
  newLease: NewLeaseState;
  onUpdate: (updates: Partial<NewLeaseState>) => void;
  onCreate: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function TenancyNewLeaseCard({ contacts, newLease, onUpdate, onCreate, onCancel, saving }: TenancyNewLeaseCardProps) {
  return (
    <Card className="border-dashed border-primary/30">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" />
          Neuer Mietvertrag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Mieter (Kontakt) *</Label>
          <Select value={newLease.tenant_contact_id} onValueChange={(v) => onUpdate({ tenant_contact_id: v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Kontakt auswählen" /></SelectTrigger>
            <SelectContent>
              {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.last_name}, {c.first_name} {c.email && `(${c.email})`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Vertragsart</Label>
            <Select value={newLease.lease_type} onValueChange={(v) => onUpdate({ lease_type: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LEASE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Mietmodell</Label>
            <Select value={newLease.rent_model} onValueChange={(v) => onUpdate({ rent_model: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{RENT_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Mietbeginn *</Label>
            <Input type="date" value={newLease.start_date} onChange={(e) => onUpdate({ start_date: e.target.value })} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Mietende</Label>
            <Input type="date" value={newLease.end_date} onChange={(e) => onUpdate({ end_date: e.target.value })} className="h-7 text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1 border-t">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Kaltmiete (€) *</Label>
            <Input type="number" step="0.01" value={newLease.rent_cold_eur} onChange={(e) => onUpdate({ rent_cold_eur: e.target.value })} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">NK-Vorausz. (€)</Label>
            <Input type="number" step="0.01" value={newLease.nk_advance_eur} onChange={(e) => onUpdate({ nk_advance_eur: e.target.value })} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Heizk.-VZ (€)</Label>
            <Input type="number" step="0.01" value={newLease.heating_advance_eur} onChange={(e) => onUpdate({ heating_advance_eur: e.target.value })} className="h-7 text-xs" />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs bg-muted/50 rounded px-3 py-1.5">
          <span className="text-muted-foreground">Warmmiete</span>
          <span className="font-semibold">
            {calculateWarmRent(newLease.rent_cold_eur, newLease.nk_advance_eur, newLease.heating_advance_eur).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Kaution (€)</Label>
            <Input type="number" step="0.01" value={newLease.deposit_amount_eur} onChange={(e) => onUpdate({ deposit_amount_eur: e.target.value })} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Kaution-Status</Label>
            <Select value={newLease.deposit_status} onValueChange={(v) => onUpdate({ deposit_status: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DEPOSIT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Zahlungstag</Label>
            <Input type="number" min={1} max={31} value={newLease.payment_due_day} onChange={(e) => onUpdate({ payment_due_day: e.target.value })} className="h-7 text-xs" />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" className="h-7 text-xs" onClick={onCreate} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Anlegen
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
            Abbrechen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
