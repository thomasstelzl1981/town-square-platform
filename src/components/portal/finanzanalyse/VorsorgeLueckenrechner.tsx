/**
 * Vorsorge-Lückenrechner — UI-Komponente
 * Zeigt Altersvorsorge- und BU/EU-Lücke pro Person.
 * Strikte Datenisolation: Nur Props, kein eigenes Fetching.
 */
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, TrendingDown, TrendingUp, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
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

// ─── Props ───────────────────────────────────────────────────

interface Props {
  persons: any[];
  pensionRecords: any[];
  contracts: any[];
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
    insured_sum: c.insured_sum,
    current_balance: c.current_balance,
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
    case 'missing': return 'Daten fehlen';
    default: return q;
  }
}

// ─── Component ───────────────────────────────────────────────

export function VorsorgeLueckenrechner({ persons, pensionRecords, contracts }: Props) {
  const navigate = useNavigate();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(
    () => persons.find((p: any) => p.is_primary)?.id ?? persons[0]?.id ?? null,
  );
  const [alterNeedPercent, setAlterNeedPercent] = useState(75);
  const [buNeedPercent, setBuNeedPercent] = useState(75);

  const mappedPersons = useMemo(() => persons.map(mapPerson), [persons]);
  const mappedPensions = useMemo(() => pensionRecords.map(mapPension), [pensionRecords]);
  const mappedContracts = useMemo(() => contracts.map(mapContract), [contracts]);

  const selectedPerson = mappedPersons.find(p => p.id === selectedPersonId);
  const selectedPension = mappedPensions.find(p => p.person_id === selectedPersonId) ?? null;

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

      {!hasIncome && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium">Nettoeinkommen nicht hinterlegt</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ohne Nettoeinkommen kann kein Bedarf berechnet werden.
              </p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs mt-1"
                onClick={() => navigate('/portal/finanzanalyse')}
              >
                In Personenakte ergänzen <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Altersvorsorge */}
      {alterResult && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Altersvorsorge-Lücke
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gesetzliche Versorgung */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Gesetzliche Versorgung</p>
              <p className="text-xl font-bold">{fmt(alterResult.gesetzliche_versorgung)}<span className="text-xs font-normal text-muted-foreground"> / mtl.</span></p>
              <Badge
                variant={alterResult.gesetzliche_quelle === 'missing' ? 'destructive' : 'secondary'}
                className="text-[10px]"
              >
                {quelleLabel(alterResult.gesetzliche_quelle)}
              </Badge>
              {alterResult.gesetzliche_quelle === 'missing' && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs block"
                  onClick={() => navigate('/portal/finanzanalyse')}
                >
                  In Personenakte ergänzen →
                </Button>
              )}
            </div>

            {/* Bedarf Slider */}
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

          {/* Private Vorsorge */}
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

          {/* Ergebnis */}
          <div className="pt-3 border-t border-border/30 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gesamtversorgung</span>
              <span className="font-bold text-base">{fmt(alterResult.expected_total)} / mtl.</span>
            </div>

            {/* Progress Bar */}
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

            {/* Gap / Surplus */}
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

      {/* Footer: Daten fehlen? */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="h-4 w-4 shrink-0" />
        <span>
          Daten fehlen?{' '}
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-xs"
            onClick={() => navigate('/portal/finanzanalyse')}
          >
            In der Personenakte ergänzen →
          </Button>
        </span>
      </div>
    </div>
  );
}
