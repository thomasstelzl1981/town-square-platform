/**
 * ValuationCompare — Side-by-side comparison of two valuation cases
 * Phase 1.3: Quick-Compare view
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CaseOption {
  id: string;
  version: number;
  date: string;
}

interface Props {
  caseIdA: string;
  caseIdB: string;
  allCases: CaseOption[];
  onClose: () => void;
}

interface ResultData {
  market_value: number | null;
  p25: number | null;
  p75: number | null;
  ertragswert: number | null;
  sachwert: number | null;
  vergleichswert: number | null;
  confidence: number | null;
  data_quality_score: number | null;
  data_quality_max: number | null;
}

function extractResult(result: any): ResultData {
  const vb = result?.value_band as any;
  const methods = (result?.methods as any[]) || [];
  const dq = result?.data_quality as any;

  const findMethod = (label: string) =>
    methods.find((m: any) => m.label?.toLowerCase().includes(label))?.value ?? null;

  return {
    market_value: vb?.p50 ?? null,
    p25: vb?.p25 ?? null,
    p75: vb?.p75 ?? null,
    ertragswert: findMethod('ertrag'),
    sachwert: findMethod('sach'),
    vergleichswert: findMethod('vergleich'),
    confidence: vb?.confidence ?? null,
    data_quality_score: dq?.score ?? null,
    data_quality_max: dq?.max ?? 10,
  };
}

export function ValuationCompare({ caseIdA, caseIdB, allCases, onClose }: Props) {
  const [selectedA, setSelectedA] = useState(caseIdA);
  const [selectedB, setSelectedB] = useState(caseIdB);

  const { data, isLoading } = useQuery({
    queryKey: ['valuation-compare', selectedA, selectedB],
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from('valuation_results')
        .select('case_id, value_band, methods, data_quality')
        .in('case_id', [selectedA, selectedB]);
      if (error) throw error;
      const map = new Map(results?.map(r => [r.case_id, r]) || []);
      return {
        a: extractResult(map.get(selectedA)),
        b: extractResult(map.get(selectedB)),
      };
    },
  });

  const caseA = allCases.find(c => c.id === selectedA);
  const caseB = allCases.find(c => c.id === selectedB);

  const fmt = (v: number | null) =>
    v != null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '–';

  const renderDelta = (a: number | null, b: number | null) => {
    if (a == null || b == null || a === 0) return null;
    const delta = b - a;
    const pct = (delta / a) * 100;
    const color = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-destructive' : 'text-muted-foreground';
    const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
    return (
      <span className={`flex items-center gap-0.5 text-[11px] font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {delta > 0 ? '+' : ''}{pct.toFixed(1)}%
      </span>
    );
  };

  const rows: { label: string; keyA: keyof ResultData; keyB: keyof ResultData; format: (v: any) => string }[] = [
    { label: 'Marktwert (p50)', keyA: 'market_value', keyB: 'market_value', format: fmt },
    { label: 'Bandbreite unten (p25)', keyA: 'p25', keyB: 'p25', format: fmt },
    { label: 'Bandbreite oben (p75)', keyA: 'p75', keyB: 'p75', format: fmt },
    { label: 'Ertragswert', keyA: 'ertragswert', keyB: 'ertragswert', format: fmt },
    { label: 'Sachwert', keyA: 'sachwert', keyB: 'sachwert', format: fmt },
    { label: 'Vergleichswert', keyA: 'vergleichswert', keyB: 'vergleichswert', format: fmt },
    { label: 'Konfidenz', keyA: 'confidence', keyB: 'confidence', format: (v) => v != null ? `${(v * 100).toFixed(0)}%` : '–' },
    { label: 'Datenqualität', keyA: 'data_quality_score', keyB: 'data_quality_score', format: (v) => v != null ? `${v}` : '–' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={onClose}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Zurück
        </Button>
        <Badge variant="secondary" className="text-[10px]">Quick-Compare</Badge>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3">
        <Select value={selectedA} onValueChange={setSelectedA}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allCases.filter(c => c.id !== selectedB).map(c => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                V{c.version} — {new Date(c.date).toLocaleDateString('de-DE')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedB} onValueChange={setSelectedB}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allCases.filter(c => c.id !== selectedA).map(c => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                V{c.version} — {new Date(c.date).toLocaleDateString('de-DE')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Comparison table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Vergleich: V{caseA?.version ?? '?'} vs V{caseB?.version ?? '?'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground text-sm">Laden…</div>
          ) : data ? (
            <div className="divide-y divide-border">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2 bg-muted/50 text-[11px] font-medium text-muted-foreground">
                <span>Kennzahl</span>
                <span className="text-right">V{caseA?.version}</span>
                <span className="text-right">V{caseB?.version}</span>
                <span className="w-14 text-right">Δ</span>
              </div>
              {rows.map(row => {
                const valA = data.a[row.keyA];
                const valB = data.b[row.keyB];
                return (
                  <div key={row.label} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-right font-medium">{row.format(valA)}</span>
                    <span className="text-right font-medium">{row.format(valB)}</span>
                    <span className="w-14 flex justify-end">
                      {typeof valA === 'number' && typeof valB === 'number' ? renderDelta(valA as number, valB as number) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
