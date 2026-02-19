import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calculator, ChevronDown } from 'lucide-react';

/** AfA model definitions per German tax law */
const AFA_MODELS = [
  { key: '7_4_1',  label: '§7(4) Nr.1 — Linear 3,0% (Wohnen ab 2023)',   rate: 3.0,  method: 'linear' },
  { key: '7_4_2a', label: '§7(4) Nr.2a — Linear 2,5% (vor 1925)',        rate: 2.5,  method: 'linear' },
  { key: '7_4_2b', label: '§7(4) Nr.2b — Linear 2,0% (1925–2022)',       rate: 2.0,  method: 'linear' },
  { key: '7_4_2c', label: '§7(4) Nr.2c — Linear 3,0% (Gewerbe)',         rate: 3.0,  method: 'linear' },
  { key: '7_5a',   label: '§7(5a) — Degressiv 5,0% (Neubau ab 10/2023)', rate: 5.0,  method: 'degressiv' },
  { key: '7b',     label: '§7b — Sonder-AfA 5,0% (4 Jahre)',             rate: 5.0,  method: 'linear' },
  { key: '7h',     label: '§7h — Sanierungs-AfA (9%/7%)',                rate: 9.0,  method: 'linear' },
  { key: '7i',     label: '§7i — Denkmal-AfA (9%/7%)',                   rate: 9.0,  method: 'linear' },
  { key: 'rnd',    label: '§7(4) S.2 — Restnutzungsdauer (Gutachten)',   rate: 0,    method: 'linear' },
] as const;

interface EditableAfaBlockProps {
  // AK split
  akGround?: number;
  akBuilding?: number;
  akAncillary?: number;
  landSharePercent?: number;
  buildingSharePercent?: number;
  // AfA model
  afaModel?: string;
  afaRatePercent?: number;
  afaStartDate?: string;
  afaMethod?: string;
  remainingUsefulLifeYears?: number;
  // Book value
  bookValueEur?: number;
  bookValueDate?: string;
  cumulativeAfa?: number;
  // Special AfA
  sonderAfaAnnual?: number;
  denkmalAfaAnnual?: number;
  modernizationCostsEur?: number;
  modernizationYear?: number;
  // Callback
  onFieldChange: (field: string, value: any) => void;
}

export function EditableAfaBlock({
  akGround = 0,
  akBuilding = 0,
  akAncillary = 0,
  landSharePercent,
  buildingSharePercent,
  afaModel = '7_4_2b',
  afaRatePercent,
  afaStartDate,
  remainingUsefulLifeYears,
  bookValueEur,
  bookValueDate,
  cumulativeAfa = 0,
  sonderAfaAnnual = 0,
  denkmalAfaAnnual = 0,
  modernizationCostsEur,
  modernizationYear,
  onFieldChange,
}: EditableAfaBlockProps) {
  // Derived: shares
  const totalAK = akGround + akBuilding;
  const derivedBuildingShare = totalAK > 0 ? Math.round((akBuilding / totalAK) * 10000) / 100 : (buildingSharePercent ?? 0);
  const derivedLandShare = totalAK > 0 ? Math.round((akGround / totalAK) * 10000) / 100 : (landSharePercent ?? 0);

  // Derived: AfA basis = AK Gebäude + anteilige ENK
  const afaBasis = useMemo(() => {
    const share = totalAK > 0 ? akBuilding / totalAK : (buildingSharePercent ?? 0) / 100;
    return akBuilding + (akAncillary * share);
  }, [akBuilding, akAncillary, totalAK, buildingSharePercent]);

  const effectiveRate = afaRatePercent ?? AFA_MODELS.find(m => m.key === afaModel)?.rate ?? 2.0;
  const annualAfa = afaModel === '7_5a'
    ? (bookValueEur ?? afaBasis) * (effectiveRate / 100)
    : afaBasis * (effectiveRate / 100);

  const handleModelChange = (modelKey: string) => {
    const model = AFA_MODELS.find(m => m.key === modelKey);
    onFieldChange('afaModel', modelKey);
    if (model) {
      onFieldChange('afaRatePercent', model.rate);
      onFieldChange('afaMethod', model.method);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-3.5 w-3.5" />
          AfA & Steuer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-3">
        {/* Section A: AK Split */}
        <div>
          <span className="text-[11px] font-medium text-muted-foreground">Anschaffungskosten-Aufteilung</span>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">AK Grundstück (€)</Label>
              <Input
                type="number" step="0.01"
                value={akGround || ''}
                onChange={e => onFieldChange('akGround', e.target.value ? parseFloat(e.target.value) : 0)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">AK Gebäude (€)</Label>
              <Input
                type="number" step="0.01"
                value={akBuilding || ''}
                onChange={e => onFieldChange('akBuilding', e.target.value ? parseFloat(e.target.value) : 0)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Erwerbsneben&shy;kosten (€)</Label>
              <Input
                type="number" step="0.01"
                value={akAncillary || ''}
                onChange={e => onFieldChange('akAncillary', e.target.value ? parseFloat(e.target.value) : 0)}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Grundstücksanteil (%)</Label>
              <Input
                type="number" step="0.01" readOnly
                value={derivedLandShare || ''}
                className="h-7 text-xs bg-muted"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Gebäudeanteil (%)</Label>
              <Input
                type="number" step="0.01" readOnly
                value={derivedBuildingShare || ''}
                className="h-7 text-xs bg-muted"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">AfA-Basis (€)</Label>
              <Input
                type="number" readOnly
                value={Math.round(afaBasis * 100) / 100 || ''}
                className="h-7 text-xs bg-muted font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section B: AfA Model */}
        <div className="pt-1 border-t">
          <span className="text-[11px] font-medium text-muted-foreground">AfA-Modell</span>
          <div className="mt-1">
            <Select value={afaModel} onValueChange={handleModelChange}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="AfA-Modell wählen" />
              </SelectTrigger>
              <SelectContent>
                {AFA_MODELS.map(m => (
                  <SelectItem key={m.key} value={m.key} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">AfA-Satz (%)</Label>
              <Input
                type="number" step="0.01"
                value={effectiveRate || ''}
                onChange={e => onFieldChange('afaRatePercent', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">AfA-Beginn</Label>
              <Input
                type="date"
                value={afaStartDate || ''}
                onChange={e => onFieldChange('afaStartDate', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            {afaModel === 'rnd' && (
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">RND (Jahre)</Label>
                <Input
                  type="number"
                  value={remainingUsefulLifeYears || ''}
                  onChange={e => onFieldChange('remainingUsefulLifeYears', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-7 text-xs"
                />
              </div>
            )}
            {afaModel !== 'rnd' && (
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">AfA p.a. (€)</Label>
                <Input
                  type="number" readOnly
                  value={Math.round(annualAfa * 100) / 100 || ''}
                  className="h-7 text-xs bg-muted font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section C: Book Value */}
        <div className="pt-1 border-t">
          <span className="text-[11px] font-medium text-muted-foreground">Buchwert (Stichtag)</span>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Buchwert (€)</Label>
              <Input
                type="number" step="0.01"
                value={bookValueEur || ''}
                onChange={e => onFieldChange('bookValueEur', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Stichtag</Label>
              <Input
                type="date"
                value={bookValueDate || ''}
                onChange={e => onFieldChange('bookValueDate', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px] text-muted-foreground">Kum. AfA (€)</Label>
              <Input
                type="number" step="0.01"
                value={cumulativeAfa || ''}
                onChange={e => onFieldChange('cumulativeAfa', e.target.value ? parseFloat(e.target.value) : 0)}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section D: Special AfA (Collapsible) */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground pt-1 border-t w-full">
            <ChevronDown className="h-3 w-3" />
            Sonder-AfA / Denkmal
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Sonder-AfA p.a. (€)</Label>
                <Input
                  type="number" step="0.01"
                  value={sonderAfaAnnual || ''}
                  onChange={e => onFieldChange('sonderAfaAnnual', e.target.value ? parseFloat(e.target.value) : 0)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Denkmal-AfA p.a. (€)</Label>
                <Input
                  type="number" step="0.01"
                  value={denkmalAfaAnnual || ''}
                  onChange={e => onFieldChange('denkmalAfaAnnual', e.target.value ? parseFloat(e.target.value) : 0)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Modernisierungskosten (€)</Label>
                <Input
                  type="number" step="0.01"
                  value={modernizationCostsEur || ''}
                  onChange={e => onFieldChange('modernizationCostsEur', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Modernisierungsjahr</Label>
                <Input
                  type="number"
                  value={modernizationYear || ''}
                  onChange={e => onFieldChange('modernizationYear', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
