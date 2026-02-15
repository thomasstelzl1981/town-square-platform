/**
 * PlatformCostMonitor — Zone 1 Admin Page
 * 
 * Shows real platform costs (API, LLM, SMTP) vs. theoretical credit revenue.
 * Three sections: KPI cards, per-action cost table, credit calculator.
 */
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/shared/KPICard';
import {
  DollarSign, TrendingUp, TrendingDown, Activity, Zap, Download,
  Calculator, Loader2, RefreshCw, ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { armstrongActions, deriveCostCategory } from '@/manifests/armstrongManifest';
import type { CostCategory } from '@/types/armstrong';

// Build a lookup from manifest
const manifestLookup = new Map(
  armstrongActions.map(a => [a.action_code, a])
);

interface CostRow {
  action_code: string;
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  total_cost_cents: number;
  avg_cost_cents: number;
  total_tokens: number;
  avg_tokens: number;
  avg_duration_ms: number;
  total_credits_charged: number;
  theoretical_revenue_cents: number;
  margin_cents: number;
}

function getCostCategoryForAction(actionCode: string): CostCategory {
  const action = manifestLookup.get(actionCode);
  if (!action) return 'free';
  return deriveCostCategory(action);
}

function getCategoryLabel(cat: CostCategory): string {
  const map: Record<CostCategory, string> = {
    llm: 'KI/LLM',
    api_external: 'Externe API',
    communication: 'Kommunikation',
    infrastructure: 'Infrastruktur',
    free: 'Kostenfrei',
  };
  return map[cat];
}

function getCategoryColor(cat: CostCategory): string {
  const map: Record<CostCategory, string> = {
    llm: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    api_external: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    communication: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    infrastructure: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    free: 'bg-muted text-muted-foreground border-border',
  };
  return map[cat];
}

const PlatformCostMonitor: React.FC = () => {
  const [targetMargin, setTargetMargin] = useState(60);
  const [fixCostsMonthly, setFixCostsMonthly] = useState(500);

  const { data: costData, isLoading, refetch } = useQuery({
    queryKey: ['platform-cost-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_platform_cost_summary' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as unknown as CostRow[];
    },
  });

  const rows = costData ?? [];

  // KPI aggregates
  const kpis = useMemo(() => {
    const totalCost = rows.reduce((s, r) => s + Number(r.total_cost_cents), 0);
    const totalRevenue = rows.reduce((s, r) => s + Number(r.theoretical_revenue_cents), 0);
    const totalRuns = rows.reduce((s, r) => s + Number(r.total_runs), 0);
    const meteredRuns = rows.filter(r => {
      const a = manifestLookup.get(r.action_code);
      return a?.cost_model === 'metered';
    }).reduce((s, r) => s + Number(r.total_runs), 0);
    const freeRuns = totalRuns - meteredRuns;
    const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;

    return { totalCost, totalRevenue, totalRuns, meteredRuns, freeRuns, margin };
  }, [rows]);

  // Enriched rows with manifest data
  const enrichedRows = useMemo(() => {
    return rows
      .map(r => {
        const action = manifestLookup.get(r.action_code);
        const category = getCostCategoryForAction(r.action_code);
        const creditsEstimate = action?.credits_estimate ?? 0;
        const revenuePerRun = creditsEstimate * 50; // cents
        const costPerRun = Number(r.avg_cost_cents);
        const marginPerRun = revenuePerRun - costPerRun;
        return { ...r, action, category, creditsEstimate, revenuePerRun, costPerRun, marginPerRun };
      })
      .sort((a, b) => Number(b.total_cost_cents) - Number(a.total_cost_cents));
  }, [rows]);

  // Calculator: recommended credit price
  const calculatedPrices = useMemo(() => {
    return enrichedRows
      .filter(r => r.action?.cost_model === 'metered')
      .map(r => {
        const avgCost = Number(r.avg_cost_cents);
        const runsTotal = Number(r.total_runs) || 1;
        const fixCostShare = (fixCostsMonthly * 100) / Math.max(runsTotal, 1); // cents per run
        const totalCostPerRun = avgCost + fixCostShare;
        const recommendedPriceCents = totalCostPerRun / (1 - targetMargin / 100);
        const recommendedCredits = recommendedPriceCents / 50;
        return {
          action_code: r.action_code,
          title: r.action?.title_de ?? r.action_code,
          avgCostCents: avgCost,
          currentCredits: r.creditsEstimate,
          recommendedCredits: Math.round(recommendedCredits * 100) / 100,
          delta: Math.round((recommendedCredits - r.creditsEstimate) * 100) / 100,
        };
      });
  }, [enrichedRows, targetMargin, fixCostsMonthly]);

  const exportCSV = () => {
    const header = 'Action Code;Titel;Kategorie;Runs;Ø Kosten (ct);Ø Tokens;Credits aktuell;Credits empfohlen;Delta\n';
    const csvRows = calculatedPrices.map(r =>
      `${r.action_code};${r.title};${getCostCategoryForAction(r.action_code)};${enrichedRows.find(e => e.action_code === r.action_code)?.total_runs ?? 0};${r.avgCostCents.toFixed(1)};${enrichedRows.find(e => e.action_code === r.action_code)?.avg_tokens ?? 0};${r.currentCredits};${r.recommendedCredits};${r.delta}`
    ).join('\n');
    const blob = new Blob([header + csvRows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-costs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/armstrong">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Plattform-Kostenmonitor</h1>
            <p className="text-muted-foreground">Echte API-Kosten vs. Credit-Erlöse — Testphase</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Aktualisieren
        </Button>
      </div>

      {/* Bereich A: KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Plattformkosten"
          value={`${(kpis.totalCost / 100).toFixed(2)} €`}
          icon={DollarSign}
          subtitle="Reale API/LLM/SMTP-Kosten"
        />
        <KPICard
          label="Theor. Erlös"
          value={`${(kpis.totalRevenue / 100).toFixed(2)} €`}
          icon={TrendingUp}
          subtitle={`${kpis.totalRuns} Runs gesamt`}
        />
        <KPICard
          label="Marge"
          value={`${kpis.margin.toFixed(1)}%`}
          icon={kpis.margin >= 0 ? TrendingUp : TrendingDown}
          subtitle={kpis.margin >= 40 ? 'Gesund' : kpis.margin >= 0 ? 'Knapp' : 'Verlust'}
          subtitleClassName={kpis.margin >= 40 ? 'text-emerald-400' : kpis.margin >= 0 ? 'text-amber-400' : 'text-red-400'}
        />
        <KPICard
          label="Metered / Free"
          value={`${kpis.meteredRuns} / ${kpis.freeRuns}`}
          icon={Zap}
          subtitle="Kostenpflichtig vs. Frei"
        />
      </div>

      {/* Bereich B: Kostenanalyse pro Action */}
      <Card>
        <CardHeader>
          <CardTitle>Kostenanalyse pro Action</CardTitle>
          <CardDescription>Reale Plattformkosten pro Action-Code mit Margen-Indikator</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : enrichedRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Noch keine Daten</h3>
              <p className="text-muted-foreground mt-1">
                Sobald Armstrong-Aktionen ausgeführt werden, erscheinen hier Kostendaten.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Action</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Kategorie</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Runs</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Ø Kosten</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Ø Tokens</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Credits</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Marge/Run</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedRows.map(r => (
                    <tr key={r.action_code} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <div className="font-mono text-xs">{r.action_code}</div>
                        <div className="text-xs text-muted-foreground">{r.action?.title_de}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={getCategoryColor(r.category)}>
                          {getCategoryLabel(r.category)}
                        </Badge>
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">{Number(r.total_runs)}</td>
                      <td className="text-right px-3 py-2 tabular-nums">{Number(r.avg_cost_cents).toFixed(1)} ct</td>
                      <td className="text-right px-3 py-2 tabular-nums">{Math.round(Number(r.avg_tokens))}</td>
                      <td className="text-right px-3 py-2 tabular-nums">{r.creditsEstimate}</td>
                      <td className={`text-right px-3 py-2 tabular-nums font-medium ${
                        r.marginPerRun > 0 ? 'text-emerald-400' : r.marginPerRun < 0 ? 'text-red-400' : 'text-muted-foreground'
                      }`}>
                        {r.marginPerRun > 0 ? '+' : ''}{r.marginPerRun.toFixed(1)} ct
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bereich C: Credit-Kalkulator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" /> Credit-Kalkulator
              </CardTitle>
              <CardDescription>Empfohlene Credit-Preise basierend auf realen Kosten</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" /> CSV Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
            <div className="space-y-2">
              <Label>Ziel-Marge (%)</Label>
              <Input
                type="number"
                value={targetMargin}
                onChange={e => setTargetMargin(Number(e.target.value))}
                min={0} max={95}
              />
            </div>
            <div className="space-y-2">
              <Label>Fixkosten/Monat (€)</Label>
              <Input
                type="number"
                value={fixCostsMonthly}
                onChange={e => setFixCostsMonthly(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          {/* Results table */}
          {calculatedPrices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Action</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Ø Kosten</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Aktuell</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Empfohlen</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedPrices.map(r => (
                    <tr key={r.action_code} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <div className="font-mono text-xs">{r.action_code}</div>
                        <div className="text-xs text-muted-foreground">{r.title}</div>
                      </td>
                      <td className="text-right px-3 py-2 tabular-nums">{r.avgCostCents.toFixed(1)} ct</td>
                      <td className="text-right px-3 py-2 tabular-nums">{r.currentCredits} Cr</td>
                      <td className="text-right px-3 py-2 tabular-nums font-medium">{r.recommendedCredits} Cr</td>
                      <td className={`text-right px-3 py-2 tabular-nums font-medium ${
                        r.delta > 0 ? 'text-red-400' : r.delta < 0 ? 'text-emerald-400' : 'text-muted-foreground'
                      }`}>
                        {r.delta > 0 ? '+' : ''}{r.delta} Cr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Keine metered Actions mit Kostendaten vorhanden.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformCostMonitor;
