/**
 * Vorsorge-Lückenrechner — UI-Komponente
 * Zeigt Altersvorsorge- und BU/EU-Lücke pro Person.
 * Transparente Datenbasis: Alle Berechnungsdaten sind sichtbar und editierbar.
 */
import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, TrendingDown, TrendingUp, ChevronDown, Save, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  calcAltersvorsorge,
  calcBuLuecke,
} from '@/engines/vorsorgeluecke/engine';
import type {
  VLPersonInput,
  VLPensionInput,
  VLContractInput,
  AltersvorsorgeResult,
  BuLueckeResult,
} from '@/engines/vorsorgeluecke/spec';
import { ALTERSVORSORGE_TYPES, BU_TYPES, DEFAULT_GROWTH_RATE, DEFAULT_ANNUITY_YEARS, DEFAULT_FALLBACK_YEARS_TO_RETIREMENT } from '@/engines/vorsorgeluecke/spec';

// ─── Props ───────────────────────────────────────────────────

interface Props {
  persons: any[];
  pensionRecords: any[];
  contracts: any[];
  onUpdatePerson?: (person: Record<string, any>) => Promise<void>;
  onUpsertPension?: (data: {
    personId: string;
    projected_pension?: number | null;
    disability_pension?: number | null;
    pension_type?: string;
  }) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────

function fmt(v: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(v);
}

function mapPerson(p: any): VLPersonInput {
  return {
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    is_primary: p.is_primary ?? false,
    employment_status: p.employment_status,
    net_income_monthly: p.net_income_monthly,
    gross_income_monthly: p.gross_income_monthly,
    ruhegehaltfaehiges_grundgehalt: p.ruhegehaltfaehiges_grundgehalt,
    ruhegehaltfaehige_dienstjahre: p.ruhegehaltfaehige_dienstjahre,
    planned_retirement_date: p.planned_retirement_date ?? null,
  };
}

function mapPension(r: any): VLPensionInput {
  return {
    person_id: r.person_id,
    projected_pension: r.projected_pension,
    disability_pension: r.disability_pension,
    pension_type: r.pension_type,
  };
}

function mapContract(c: any): VLContractInput {
  return {
    id: c.id,
    person_id: c.person_id,
    contract_type: c.contract_type,
    monthly_benefit: c.monthly_benefit,
    bu_monthly_benefit: c.bu_monthly_benefit ?? null,
    insured_sum: c.insured_sum,
    current_balance: c.current_balance,
    premium: c.premium ?? null,
    payment_interval: c.payment_interval ?? null,
    status: c.status,
    category: c.category,
  };
}

function quelleLabel(q: string): string {
  switch (q) {
    case 'drv': return 'DRV-Renteninformation';
    case 'pension': return 'Beamtenpension';
    case 'drv_em': return 'DRV-Erwerbsminderungsrente';
    case 'dienstunfaehigkeit': return 'Dienstunfähigkeitsversorgung';
    case 'fallback': return 'Schätzung (35% Brutto)';
    case 'missing': return 'Nicht hinterlegt';
    default: return q;
  }
}

function isAltersvorsorgeType(type: string | null): boolean {
  if (!type) return false;
  return ALTERSVORSORGE_TYPES.some(t => type.toLowerCase().includes(t.toLowerCase()));
}

function isBuType(type: string | null): boolean {
  if (!type) return false;
  return BU_TYPES.some(t => type.toLowerCase().includes(t.toLowerCase()));
}

function isActiveContract(c: VLContractInput): boolean {
  if (!c.status) return true;
  const s = c.status.toLowerCase();
  return s === 'aktiv' || s === 'active';
}

const EMPLOYMENT_OPTIONS = [
  { value: 'angestellt', label: 'Angestellt' },
  { value: 'selbstaendig', label: 'Selbständig' },
  { value: 'beamter', label: 'Beamter' },
] as const;

const PENSION_TYPE_OPTIONS = [
  { value: 'drv', label: 'DRV (Gesetzliche Rente)' },
  { value: 'beamte', label: 'Beamtenpension' },
] as const;

// ─── Component ───────────────────────────────────────────────

export function VorsorgeLueckenrechner({ persons, pensionRecords, contracts, onUpdatePerson, onUpsertPension }: Props) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    () => persons.find((p: any) => p.is_primary)?.id ?? persons[0]?.id ?? null,
  );
  const [alterNeedPercent, setAlterNeedPercent] = useState(75);
  const [buNeedPercent, setBuNeedPercent] = useState(75);
  const [datenbasisOpen, setDatenbasisOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Editable local state ───
  const [editNet, setEditNet] = useState<string>('');
  const [editGross, setEditGross] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editRetirement, setEditRetirement] = useState<string>('');
  const [editGrundgehalt, setEditGrundgehalt] = useState<string>('');
  const [editDienstjahre, setEditDienstjahre] = useState<string>('');
  const [editProjectedPension, setEditProjectedPension] = useState<string>('');
  const [editDisabilityPension, setEditDisabilityPension] = useState<string>('');
  const [editPensionType, setEditPensionType] = useState<string>('drv');
  const [isDirty, setIsDirty] = useState(false);

  // Sync local state when person changes
  const rawPerson = persons.find((p: any) => p.id === selectedPersonId);
  const rawPension = pensionRecords.find((r: any) => r.person_id === selectedPersonId);

  useEffect(() => {
    if (rawPerson) {
      setEditNet(rawPerson.net_income_monthly?.toString() ?? '');
      setEditGross(rawPerson.gross_income_monthly?.toString() ?? '');
      setEditStatus(rawPerson.employment_status ?? '');
      setEditRetirement(rawPerson.planned_retirement_date ?? '');
      setEditGrundgehalt(rawPerson.ruhegehaltfaehiges_grundgehalt?.toString() ?? '');
      setEditDienstjahre(rawPerson.ruhegehaltfaehige_dienstjahre?.toString() ?? '');
    }
    if (rawPension) {
      setEditProjectedPension(rawPension.projected_pension?.toString() ?? '');
      setEditDisabilityPension(rawPension.disability_pension?.toString() ?? '');
      setEditPensionType(rawPension.pension_type ?? 'drv');
    } else {
      setEditProjectedPension('');
      setEditDisabilityPension('');
      setEditPensionType('drv');
    }
    setIsDirty(false);
  }, [selectedPersonId, rawPerson?.id, rawPension?.id]);

  const markDirty = () => setIsDirty(true);

  const mappedPersons = useMemo(() => persons.map(mapPerson), [persons]);
  const mappedPensions = useMemo(() => pensionRecords.map(mapPension), [pensionRecords]);
  const mappedContracts = useMemo(() => contracts.map(mapContract), [contracts]);

  const selectedPerson = mappedPersons.find(p => p.id === selectedPersonId);
  const selectedPension = mappedPensions.find(p => p.person_id === selectedPersonId) ?? null;

  // Filter contracts for selected person
  const personContracts = mappedContracts.filter(c => c.person_id === selectedPersonId && isActiveContract(c));
  const avContracts = personContracts.filter(c => isAltersvorsorgeType(c.contract_type));
  const buContracts = personContracts.filter(c => 
    (c.bu_monthly_benefit && c.bu_monthly_benefit > 0) || isBuType(c.contract_type)
  );

  const alterResult: AltersvorsorgeResult | null = useMemo(() => {
    if (!selectedPerson) return null;
    return calcAltersvorsorge(selectedPerson, selectedPension, mappedContracts, alterNeedPercent / 100);
  }, [selectedPerson, selectedPension, mappedContracts, alterNeedPercent]);

  const buResult: BuLueckeResult | null = useMemo(() => {
    if (!selectedPerson) return null;
    return calcBuLuecke(selectedPerson, selectedPension, mappedContracts, buNeedPercent / 100);
  }, [selectedPerson, selectedPension, mappedContracts, buNeedPercent]);

  if (persons.length === 0) return null;

  const hasIncome = selectedPerson?.net_income_monthly && selectedPerson.net_income_monthly > 0;
  const isBeamter = editStatus === 'beamter' || editStatus === 'beamte' || editStatus === 'civil_servant';

  // ─── Save handler ───
  const handleSave = async () => {
    if (!selectedPersonId || !rawPerson) return;
    setSaving(true);
    try {
      if (onUpdatePerson) {
        await onUpdatePerson({
          id: selectedPersonId,
          net_income_monthly: editNet ? Number(editNet) : null,
          gross_income_monthly: editGross ? Number(editGross) : null,
          employment_status: editStatus || null,
          planned_retirement_date: editRetirement || null,
          ruhegehaltfaehiges_grundgehalt: editGrundgehalt ? Number(editGrundgehalt) : null,
          ruhegehaltfaehige_dienstjahre: editDienstjahre ? Number(editDienstjahre) : null,
        });
      }
      if (onUpsertPension) {
        await onUpsertPension({
          personId: selectedPersonId,
          projected_pension: editProjectedPension ? Number(editProjectedPension) : null,
          disability_pension: editDisabilityPension ? Number(editDisabilityPension) : null,
          pension_type: editPensionType || 'drv',
        });
      }
      setIsDirty(false);
      toast.success('Datenbasis gespeichert');
    } catch (e: any) {
      toast.error('Fehler beim Speichern: ' + (e.message || 'Unbekannt'));
    } finally {
      setSaving(false);
    }
  };

  const emptyFieldClass = 'border-amber-500/50 bg-amber-500/5';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Vorsorge-Lückenrechner
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Transparenz über Ihre Altersvorsorge- und BU-Absicherung
        </p>
      </div>

      {/* Person Chips */}
      <div className="flex flex-wrap gap-2">
        {persons.map((p: any) => (
          <Badge
            key={p.id}
            variant={p.id === selectedPersonId ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer px-3 py-1.5 text-sm transition-colors',
              p.id === selectedPersonId && 'ring-2 ring-primary/30',
            )}
            onClick={() => setSelectedPersonId(p.id)}
          >
            {p.first_name} {p.last_name}
            {p.is_primary && ' (Hauptperson)'}
          </Badge>
        ))}
      </div>

      {/* ─── DATENBASIS ─── */}
      <Collapsible open={datenbasisOpen} onOpenChange={setDatenbasisOpen}>
        <Card className="p-0 overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Datenbasis für Berechnung</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', datenbasisOpen && 'rotate-180')} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-5">
              <Separator />

              {/* 1) Persönliche Daten */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Persönliche Daten</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Netto mtl. (€)</Label>
                    <Input
                      type="number"
                      placeholder="z.B. 3200"
                      value={editNet}
                      onChange={e => { setEditNet(e.target.value); markDirty(); }}
                      className={cn('mt-0.5', !editNet && emptyFieldClass)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Brutto mtl. (€)</Label>
                    <Input
                      type="number"
                      placeholder="z.B. 5200"
                      value={editGross}
                      onChange={e => { setEditGross(e.target.value); markDirty(); }}
                      className={cn('mt-0.5', !editGross && emptyFieldClass)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Beschäftigung</Label>
                    <Select value={editStatus} onValueChange={v => { setEditStatus(v); markDirty(); }}>
                      <SelectTrigger className={cn('mt-0.5', !editStatus && emptyFieldClass)}>
                        <SelectValue placeholder="Wählen…" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Renteneintritt</Label>
                    <Input
                      type="date"
                      value={editRetirement}
                      onChange={e => { setEditRetirement(e.target.value); markDirty(); }}
                      className={cn('mt-0.5', !editRetirement && emptyFieldClass)}
                    />
                  </div>
                </div>
                {isBeamter && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Ruhegehaltfähiges Grundgehalt (€)</Label>
                      <Input
                        type="number"
                        placeholder="z.B. 4500"
                        value={editGrundgehalt}
                        onChange={e => { setEditGrundgehalt(e.target.value); markDirty(); }}
                        className={cn('mt-0.5', !editGrundgehalt && emptyFieldClass)}
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Ruhegehaltfähige Dienstjahre</Label>
                      <Input
                        type="number"
                        placeholder="z.B. 25"
                        value={editDienstjahre}
                        onChange={e => { setEditDienstjahre(e.target.value); markDirty(); }}
                        className={cn('mt-0.5', !editDienstjahre && emptyFieldClass)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2) Gesetzliche Renteninformation */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Gesetzliche Renteninformation</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Prognost. Altersrente (€/mtl.)</Label>
                    <Input
                      type="number"
                      placeholder="z.B. 1200"
                      value={editProjectedPension}
                      onChange={e => { setEditProjectedPension(e.target.value); markDirty(); }}
                      className={cn('mt-0.5', !editProjectedPension && emptyFieldClass)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">EM-Rente (€/mtl.)</Label>
                    <Input
                      type="number"
                      placeholder="z.B. 800"
                      value={editDisabilityPension}
                      onChange={e => { setEditDisabilityPension(e.target.value); markDirty(); }}
                      className={cn('mt-0.5', !editDisabilityPension && emptyFieldClass)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Rententyp</Label>
                    <Select value={editPensionType} onValueChange={v => { setEditPensionType(v); markDirty(); }}>
                      <SelectTrigger className="mt-0.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PENSION_TYPE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 3) Altersvorsorge-Verträge (readonly) */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Altersvorsorge-Verträge ({avContracts.length})
                </p>
                {avContracts.length > 0 ? (
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-[11px] h-8">Anbieter / Typ</TableHead>
                          <TableHead className="text-[11px] h-8 text-right">Guthaben</TableHead>
                          <TableHead className="text-[11px] h-8 text-right">Rente mtl.</TableHead>
                          <TableHead className="text-[11px] h-8 text-right">Sparrate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {avContracts.map(c => {
                          const raw = contracts.find((r: any) => r.id === c.id);
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="text-xs py-2">
                                <span className="font-medium">{raw?.provider || '–'}</span>
                                <span className="text-muted-foreground ml-1 text-[10px]">{c.contract_type || ''}</span>
                              </TableCell>
                              <TableCell className="text-xs py-2 text-right">{c.current_balance ? fmt(c.current_balance) : '–'}</TableCell>
                              <TableCell className="text-xs py-2 text-right">{c.monthly_benefit ? fmt(c.monthly_benefit) : '–'}</TableCell>
                              <TableCell className="text-xs py-2 text-right">{c.premium ? fmt(c.premium) : '–'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">Keine Altersvorsorge-Verträge zugeordnet.</p>
                )}
              </div>

              {/* 4) BU-Absicherung (readonly) */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  BU-Absicherung ({buContracts.length})
                </p>
                {buContracts.length > 0 ? (
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-[11px] h-8">Anbieter / Typ</TableHead>
                          <TableHead className="text-[11px] h-8 text-right">BU-Rente mtl.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buContracts.map(c => {
                          const raw = contracts.find((r: any) => r.id === c.id);
                          const buVal = c.bu_monthly_benefit || c.monthly_benefit || 0;
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="text-xs py-2">
                                <span className="font-medium">{raw?.provider || '–'}</span>
                                <span className="text-muted-foreground ml-1 text-[10px]">
                                  {c.bu_monthly_benefit ? 'BU-Zusatz' : c.contract_type || ''}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs py-2 text-right font-medium">{fmt(buVal)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">Keine BU-Absicherung zugeordnet.</p>
                )}
              </div>

              {/* Save button */}
              {isDirty && (
                <div className="pt-2">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Speichert…' : 'Änderungen speichern'}
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Altersvorsorge */}
      {alterResult && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Altersvorsorge-Lücke
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Gesetzliche Versorgung</p>
              <p className="text-xl font-bold">{fmt(alterResult.gesetzliche_versorgung)}<span className="text-xs font-normal text-muted-foreground"> / mtl.</span></p>
              <Badge
                variant={alterResult.gesetzliche_quelle === 'missing' ? 'destructive' : 'secondary'}
                className="text-[10px]"
              >
                {quelleLabel(alterResult.gesetzliche_quelle)}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Versorgungsziel: <strong>{alterNeedPercent}%</strong> des Nettoeinkommens
              </p>
              <Slider
                value={[alterNeedPercent]}
                onValueChange={v => setAlterNeedPercent(v[0])}
                min={60}
                max={90}
                step={5}
                className="w-full"
              />
              <p className="text-sm font-semibold">
                Bedarf: {fmt(alterResult.retirement_need)} / mtl.
              </p>
            </div>
          </div>

          <div className="text-sm space-y-1 pt-2 border-t border-border/30">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Private Renten</span>
              <span className="font-medium">{fmt(alterResult.private_renten)} / mtl.</span>
            </div>
            {alterResult.private_verrentung > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verrentung aus Kapital</span>
                <span className="font-medium">{fmt(alterResult.private_verrentung)} / mtl.</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/30 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gesamtversorgung</span>
              <span className="font-bold text-base">{fmt(alterResult.expected_total)} / mtl.</span>
            </div>

            {hasIncome && alterResult.retirement_need > 0 && (
              <div className="space-y-1">
                <Progress
                  value={Math.min(100, (alterResult.expected_total / alterResult.retirement_need) * 100)}
                  className={cn(
                    'h-3',
                    alterResult.gap > 0 ? '[&>div]:bg-destructive' : '[&>div]:bg-emerald-500',
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round((alterResult.expected_total / alterResult.retirement_need) * 100)}% gedeckt</span>
                  <span>Ziel: {fmt(alterResult.retirement_need)}</span>
                </div>
              </div>
            )}

            {hasIncome && (
              <div className={cn(
                'rounded-lg p-3 flex items-center gap-3',
                alterResult.gap > 0
                  ? 'bg-destructive/10 border border-destructive/20'
                  : 'bg-emerald-500/10 border border-emerald-500/20',
              )}>
                {alterResult.gap > 0 ? (
                  <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
                )}
                <div>
                  {alterResult.gap > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-destructive">
                        Lücke: {fmt(alterResult.gap)} / mtl.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Kapitalbedarf: {fmt(alterResult.capital_needed)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-emerald-600">
                      Überschuss: {fmt(alterResult.surplus)} / mtl.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* BU / EU Lücke */}
      {buResult && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            BU / EU-Lücke
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Gesetzliche Absicherung</p>
              <p className="text-xl font-bold">{fmt(buResult.gesetzliche_absicherung)}<span className="text-xs font-normal text-muted-foreground"> / mtl.</span></p>
              <Badge
                variant={buResult.gesetzliche_quelle === 'missing' ? 'destructive' : 'secondary'}
                className="text-[10px]"
              >
                {quelleLabel(buResult.gesetzliche_quelle)}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                BU-Bedarf: <strong>{buNeedPercent}%</strong> des Nettoeinkommens
              </p>
              <Slider
                value={[buNeedPercent]}
                onValueChange={v => setBuNeedPercent(v[0])}
                min={60}
                max={90}
                step={5}
                className="w-full"
              />
              <p className="text-sm font-semibold">
                Bedarf: {fmt(buResult.bu_need)} / mtl.
              </p>
            </div>
          </div>

          <div className="text-sm pt-2 border-t border-border/30">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Private BU-Leistungen</span>
              <span className="font-medium">{fmt(buResult.private_bu)} / mtl.</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/30 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gesamtabsicherung</span>
              <span className="font-bold text-base">{fmt(buResult.total_absicherung)} / mtl.</span>
            </div>

            {hasIncome && buResult.bu_need > 0 && (
              <div className="space-y-1">
                <Progress
                  value={Math.min(100, (buResult.total_absicherung / buResult.bu_need) * 100)}
                  className={cn(
                    'h-3',
                    buResult.bu_gap > 0 ? '[&>div]:bg-destructive' : '[&>div]:bg-emerald-500',
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round((buResult.total_absicherung / buResult.bu_need) * 100)}% gedeckt</span>
                  <span>Ziel: {fmt(buResult.bu_need)}</span>
                </div>
              </div>
            )}

            {hasIncome && (
              <div className={cn(
                'rounded-lg p-3 flex items-center gap-3',
                buResult.bu_gap > 0
                  ? 'bg-destructive/10 border border-destructive/20'
                  : 'bg-emerald-500/10 border border-emerald-500/20',
              )}>
                {buResult.bu_gap > 0 ? (
                  <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
                )}
                <div>
                  {buResult.bu_gap > 0 ? (
                    <p className="text-sm font-semibold text-destructive">
                      Lücke: {fmt(buResult.bu_gap)} / mtl.
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-emerald-600">
                      Überschuss: {fmt(buResult.bu_surplus)} / mtl.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
