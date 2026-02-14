/**
 * MOD-18 Finanzanalyse — Tab 2: Cashflow & Budget
 * 12M Timeline, Budget-Editor, Abweichungen, Kategorie-Explorer
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinanzanalyseData, CATEGORIES } from '@/hooks/useFinanzanalyseData';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, AlertTriangle, Save, BarChart3
} from 'lucide-react';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

export default function CashflowBudgetTab() {
  const { monthlyFlows, categoryBreakdown, budgets, upsertBudget, transactions, isLoading } = useFinanzanalyseData();
  const navigate = useNavigate();
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>({});

  const chartData = monthlyFlows.map(m => ({
    month: m.month.substring(5),
    Einnahmen: Math.round(m.income),
    Ausgaben: Math.round(m.expenses),
    Netto: Math.round(m.net),
  }));

  const handleSaveBudget = (category: string) => {
    const val = parseFloat(editingBudgets[category] || '0');
    if (isNaN(val) || val < 0) return;
    upsertBudget.mutate({ category, monthly_target: val }, {
      onSuccess: () => {
        toast.success(`Budget für ${category} gespeichert`);
        setEditingBudgets(prev => { const n = { ...prev }; delete n[category]; return n; });
      },
    });
  };

  const overBudget = Array.from(categoryBreakdown.entries())
    .filter(([, v]) => v.budget > 0 && (v.total / 12) > v.budget)
    .map(([cat, v]) => ({ category: cat, monthly: v.total / 12, budget: v.budget, over: (v.total / 12) - v.budget }));

  if (transactions.length === 0) {
    return (
      <PageShell>
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium">Noch keine Kontodaten vorhanden</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verbinden Sie Ihre Konten im Finanzmanager, um Cashflow & Budget zu analysieren.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/finanzierungsmanager')}>
              Konten verbinden →
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Cashflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cashflow (12 Monate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Einnahmen" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ausgaben" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Transaktionsdaten vorhanden</p>
          )}
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Budget-Ziele (monatlich)
          </CardTitle>
          <CardDescription>Setzen Sie Zielwerte pro Kategorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.map(cat => {
              const existing = budgets.find(b => b.category === cat);
              const breakdown = categoryBreakdown.get(cat);
              const monthlyActual = breakdown ? breakdown.total / 12 : 0;
              const isEditing = cat in editingBudgets;
              const currentTarget = existing?.monthly_target || 0;

              return (
                <div key={cat} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{cat}</p>
                    <p className="text-xs text-muted-foreground">∅ {fmt(monthlyActual)}/Monat</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-24 text-right"
                      value={isEditing ? editingBudgets[cat] : (currentTarget || '')}
                      placeholder="0"
                      onChange={(e) => setEditingBudgets(prev => ({ ...prev, [cat]: e.target.value }))}
                    />
                    {isEditing && (
                      <Button size="icon" variant="ghost" onClick={() => handleSaveBudget(cat)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Abweichungen */}
      {overBudget.length > 0 && (
        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Budget-Überschreitungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overBudget.map(item => (
              <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20">
                <div>
                  <p className="text-sm font-medium">{item.category}</p>
                  <p className="text-xs text-muted-foreground">Budget: {fmt(item.budget)} | Ist: {fmt(item.monthly)}</p>
                </div>
                <Badge variant="destructive">+{fmt(item.over)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Kategorie-Explorer */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Kategorie-Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from(categoryBreakdown.entries()).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{cat}</Badge>
                  <span className="text-xs text-muted-foreground">{data.transactions.length} Buchungen</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{fmt(data.total)}</span>
                  {data.budget > 0 && (
                    <Badge variant={data.total / 12 > data.budget ? 'destructive' : 'secondary'} className="text-xs">
                      {data.total / 12 > data.budget ? (
                        <><TrendingDown className="h-3 w-3 mr-1" />über Budget</>
                      ) : (
                        <><TrendingUp className="h-3 w-3 mr-1" />im Budget</>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
