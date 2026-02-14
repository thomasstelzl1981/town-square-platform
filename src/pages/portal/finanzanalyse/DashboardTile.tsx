/**
 * MOD-18 Finanzanalyse — Seite A: Übersicht
 * Health-Check, KPI-Row, Insights, Top Merchants
 */
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DESIGN } from '@/config/designManifest';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight,
  BarChart3, CheckCircle2, Circle, AlertTriangle,
  ShoppingBag, Receipt, PieChart
} from 'lucide-react';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

export default function DashboardTile() {
  const { kpis, setupStatus, isLoading } = useFinanzanalyseData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <PageShell>
        <ModulePageHeader title="Übersicht" description="Ihre finanzielle Gesundheit auf einen Blick" />
        <div className={DESIGN.KPI_GRID.FULL}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </PageShell>
    );
  }

  const kpiCards = [
    { label: 'Einnahmen (12M)', value: fmt(kpis.totalIncome), icon: TrendingUp, color: 'text-primary' },
    { label: 'Ausgaben (12M)', value: fmt(kpis.totalExpenses), icon: TrendingDown, color: 'text-destructive' },
    { label: 'Netto-Cashflow', value: fmt(kpis.netCashflow), icon: Wallet, color: kpis.netCashflow >= 0 ? 'text-primary' : 'text-destructive' },
    { label: 'Fixkosten/Monat', value: fmt(kpis.fixedCosts), icon: Receipt, color: 'text-muted-foreground' },
    { label: 'Top Kategorie', value: kpis.topCategories[0]?.category || '–', icon: PieChart, sub: kpis.topCategories[0] ? fmt(kpis.topCategories[0].total) : '' },
    { label: 'Transaktionen', value: `${kpis.topMerchants.reduce((s, m) => s + m.count, 0)}`, icon: BarChart3, sub: '12 Monate' },
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Übersicht" description="Ihre finanzielle Gesundheit auf einen Blick" />

      {/* A2: Health-Check */}
      {setupStatus.completionPercent < 100 && (
        <Card className="border-dashed border-primary/30 mb-6">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Setup-Status</p>
                <p className="text-sm text-muted-foreground">Verbinden Sie Datenquellen für vollständige Analysen</p>
              </div>
            </div>
            <Progress value={setupStatus.completionPercent} className="h-2 mb-4" />
            <div className="space-y-2">
              <CheckItem done={setupStatus.hasTransactions} label="Kontoumsätze vorhanden" />
              <CheckItem done={setupStatus.hasBudgets} label="Budget-Ziele definiert" />
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/portal/finanzierung')}>
              Zum Finanzmanager →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* A3: KPI Row */}
      <div className={DESIGN.KPI_GRID.FULL}>
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                {kpi.color === 'text-primary' && <ArrowUpRight className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              {kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* A4: Insights */}
      {kpis.topCategories.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Ausgaben nach Kategorie</CardTitle>
            <CardDescription>Top 5 Kategorien der letzten 12 Monate</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple">
              {kpis.topCategories.map((cat, i) => (
                <AccordionItem key={cat.category} value={cat.category}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-3 w-full mr-4">
                      <Badge variant="outline" className="min-w-[80px] justify-center">{cat.category}</Badge>
                      <div className="flex-1">
                        <Progress value={kpis.topCategories[0] ? (cat.total / kpis.topCategories[0].total) * 100 : 0} className="h-2" />
                      </div>
                      <span className="font-mono text-sm font-medium">{fmt(cat.total)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Durchschnittlich {fmt(cat.total / 12)} pro Monat in dieser Kategorie.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* A5: Top Merchants */}
      {kpis.topMerchants.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Top Empfänger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.topMerchants.map((m) => (
                <div key={m.merchant} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.merchant}</p>
                    <p className="text-xs text-muted-foreground">{m.count} Transaktionen</p>
                  </div>
                  <span className="font-mono text-sm">{fmt(m.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!setupStatus.hasTransactions && (
        <Card className="border-dashed mt-6">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium">Noch keine Kontodaten vorhanden</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verbinden Sie Ihre Konten im Finanzmanager, um Ihre Finanzanalyse zu starten.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/finanzierung')}>
              Finanzmanager öffnen
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
