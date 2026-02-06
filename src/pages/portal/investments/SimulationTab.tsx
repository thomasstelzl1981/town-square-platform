/**
 * MOD-08 Simulation Tab
 * Portfolio mirroring from MOD-04 + add favorites for combined projection
 */
import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartCard } from '@/components/ui/chart-card';
import {
  Building2, TrendingUp, Wallet, PiggyBank, Plus, Minus,
  Calculator, ChevronDown, ChevronUp, Loader2, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  usePortfolioSummary,
  combineWithNewObject,
  generateCombinedProjection,
  type PortfolioSummary,
  type YearlyProjection
} from '@/hooks/usePortfolioSummary';
import { useInvestmentFavorites, type FavoriteWithListing, type SearchParams } from '@/hooks/useInvestmentFavorites';

interface NewObjectConfig {
  favoriteId: string | null;
  price: number;
  monthlyRent: number;
  equity: number;
  interestRate: number;
  amortizationRate: number;
  title: string;
}

export default function SimulationTab() {
  const [searchParams] = useSearchParams();
  const addFavoriteId = searchParams.get('add');

  const { summary, projection, isLoading, hasData } = usePortfolioSummary();
  const { data: favorites = [] } = useInvestmentFavorites();

  // Projection sliders
  const [appreciationRate, setAppreciationRate] = useState(2);
  const [rentGrowthRate, setRentGrowthRate] = useState(1.5);
  const [showAllYears, setShowAllYears] = useState(false);

  // New object configuration
  const [newObject, setNewObject] = useState<NewObjectConfig | null>(null);

  // Initialize from URL param
  useMemo(() => {
    if (addFavoriteId && favorites.length > 0 && !newObject) {
      const fav = favorites.find(f => f.id === addFavoriteId);
      if (fav) {
        const sp = fav.search_params as SearchParams | null;
        setNewObject({
          favoriteId: fav.id,
          price: fav.price || fav.listing?.asking_price || 0,
          monthlyRent: (fav.property_data as any)?.monthly_rent || 0,
          equity: sp?.equity || 50000,
          interestRate: 3.5,
          amortizationRate: 2.0,
          title: fav.title || fav.listing?.title || 'Neues Objekt',
        });
      }
    }
  }, [addFavoriteId, favorites, newObject]);

  // Calculate combined portfolio
  const combinedSummary = useMemo<PortfolioSummary | null>(() => {
    if (!summary) return null;
    if (!newObject) return summary;

    return combineWithNewObject(summary, {
      price: newObject.price,
      monthlyRent: newObject.monthlyRent,
      equity: newObject.equity,
      interestRate: newObject.interestRate,
      amortizationRate: newObject.amortizationRate,
    });
  }, [summary, newObject]);

  // Generate projection for combined portfolio
  const combinedProjection = useMemo<YearlyProjection[]>(() => {
    if (!combinedSummary) return [];
    return generateCombinedProjection(
      combinedSummary,
      appreciationRate / 100,
      rentGrowthRate / 100
    );
  }, [combinedSummary, appreciationRate, rentGrowthRate]);

  // Select favorite handler
  const handleSelectFavorite = useCallback((favoriteId: string) => {
    const fav = favorites.find(f => f.id === favoriteId);
    if (fav) {
      const sp = fav.search_params as SearchParams | null;
      setNewObject({
        favoriteId: fav.id,
        price: fav.price || fav.listing?.asking_price || 0,
        monthlyRent: (fav.property_data as any)?.monthly_rent || 800,
        equity: sp?.equity || 50000,
        interestRate: 3.5,
        amortizationRate: 2.0,
        title: fav.title || fav.listing?.title || 'Neues Objekt',
      });
    }
  }, [favorites]);

  const handleRemoveNewObject = useCallback(() => {
    setNewObject(null);
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Investment-Simulation</h1>
        <p className="text-muted-foreground">
          Berechnen Sie die Auswirkung eines Neukaufs auf Ihr Gesamtportfolio
        </p>
      </div>

      {/* Current Portfolio Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Ihr aktuelles Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Keine Immobilien im Portfolio</p>
              <p className="text-sm">Fügen Sie Objekte in MOD-04 hinzu</p>
            </div>
          ) : summary && (
            <div className="space-y-4">
              {/* KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Building2 className="w-4 h-4" />
                    Objekte
                  </div>
                  <p className="text-2xl font-semibold mt-1">{summary.propertyCount}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Verkehrswert
                  </div>
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(summary.totalValue)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Wallet className="w-4 h-4" />
                    Restschuld
                  </div>
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(summary.totalDebt)}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <PiggyBank className="w-4 h-4" />
                    Netto-Vermögen
                  </div>
                  <p className="text-2xl font-semibold mt-1">{formatCurrency(summary.netWealth)}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{formatPercent(summary.avgYield)} Rendite</p>
                </div>
              </div>

              {/* EÜR Mini */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Einnahmen p.a.</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">+ Miete</span>
                      <span className="text-green-600 dark:text-green-400">+{formatCurrency(summary.annualIncome)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Ausgaben p.a.</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">− Zinsen</span>
                      <span className="text-destructive">−{formatCurrency(summary.annualInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">− Tilgung</span>
                      <span className="text-blue-600 dark:text-blue-400">−{formatCurrency(summary.annualAmortization)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <span className="font-medium">Jahresüberschuss</span>
                <span className={cn(
                  "text-lg font-bold",
                  summary.annualSurplus >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                )}>
                  {summary.annualSurplus >= 0 ? '+' : ''}{formatCurrency(summary.annualSurplus)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Object Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5" />
            Neues Objekt hinzufügen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Favorite Selector */}
          <div className="space-y-2">
            <Label>Objekt auswählen</Label>
            <Select
              value={newObject?.favoriteId || ''}
              onValueChange={handleSelectFavorite}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aus Ihren Favoriten wählen..." />
              </SelectTrigger>
              <SelectContent>
                {favorites.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Keine Favoriten vorhanden
                  </SelectItem>
                ) : (
                  favorites.map((fav) => (
                    <SelectItem key={fav.id} value={fav.id}>
                      {fav.title || fav.listing?.title} — {formatCurrency(fav.price || 0)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Configuration (when object selected) */}
          {newObject && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{newObject.title}</h4>
                <Button variant="ghost" size="sm" onClick={handleRemoveNewObject}>
                  <Minus className="w-4 h-4 mr-1" />
                  Entfernen
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Kaufpreis</Label>
                  <Input
                    type="number"
                    value={newObject.price}
                    onChange={(e) => setNewObject({ ...newObject, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monatsmiete</Label>
                  <Input
                    type="number"
                    value={newObject.monthlyRent}
                    onChange={(e) => setNewObject({ ...newObject, monthlyRent: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eigenkapital</Label>
                  <Input
                    type="number"
                    value={newObject.equity}
                    onChange={(e) => setNewObject({ ...newObject, equity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zinssatz (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newObject.interestRate}
                    onChange={(e) => setNewObject({ ...newObject, interestRate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Darlehensbetrag:</span>
                  <span className="font-medium">{formatCurrency(newObject.price - newObject.equity)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Combined Projection */}
      {combinedSummary && combinedProjection.length > 0 && (
        <>
          {/* Delta Card (if new object added) */}
          {newObject && summary && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator className="w-5 h-5" />
                  Kombiniertes Portfolio (inkl. {newObject.title})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Objekte</p>
                    <p className="font-semibold">
                      {combinedSummary.propertyCount}
                      <span className="text-green-600 dark:text-green-400 ml-1">(+1)</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Verkehrswert</p>
                    <p className="font-semibold">
                      {formatCurrency(combinedSummary.totalValue)}
                      <span className="text-green-600 dark:text-green-400 text-xs ml-1">
                        +{formatCurrency(newObject.price)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Restschuld</p>
                    <p className="font-semibold">
                      {formatCurrency(combinedSummary.totalDebt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Netto-Vermögen</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(combinedSummary.netWealth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Überschuss p.a.</p>
                    <p className={cn(
                      "font-semibold",
                      combinedSummary.annualSurplus >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                    )}>
                      {combinedSummary.annualSurplus >= 0 ? '+' : ''}{formatCurrency(combinedSummary.annualSurplus)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projection Sliders */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Wertsteigerung p.a.</Label>
                    <span className="text-sm font-medium">{appreciationRate}%</span>
                  </div>
                  <Slider
                    value={[appreciationRate]}
                    onValueChange={([v]) => setAppreciationRate(v)}
                    min={0}
                    max={5}
                    step={0.5}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Mietsteigerung p.a.</Label>
                    <span className="text-sm font-medium">{rentGrowthRate}%</span>
                  </div>
                  <Slider
                    value={[rentGrowthRate]}
                    onValueChange={([v]) => setRentGrowthRate(v)}
                    min={0}
                    max={5}
                    step={0.5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <ChartCard title="Vermögensentwicklung (40 Jahre)">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={combinedProjection} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'objektwert' ? 'Objektwert' :
                    name === 'restschuld' ? 'Restschuld' :
                    name === 'vermoegen' ? 'Vermögen' : name
                  ]}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="objektwert"
                  name="Objektwert"
                  fill="hsl(var(--primary) / 0.2)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="vermoegen"
                  name="Vermögen"
                  fill="hsl(142 76% 36% / 0.3)"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="restschuld"
                  name="Restschuld"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Detail Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Jahresübersicht</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllYears(!showAllYears)}
                  className="gap-1"
                >
                  {showAllYears ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      10 Jahre
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Alle 40 Jahre
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jahr</TableHead>
                      <TableHead className="text-right">Miete</TableHead>
                      <TableHead className="text-right text-destructive">Zinsen</TableHead>
                      <TableHead className="text-right text-blue-600 dark:text-blue-400">Tilgung</TableHead>
                      <TableHead className="text-right">Restschuld</TableHead>
                      <TableHead className="text-right">Objektwert</TableHead>
                      <TableHead className="text-right text-green-600 dark:text-green-400">Vermögen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAllYears ? combinedProjection : combinedProjection.slice(0, 10)).map((row) => (
                      <TableRow key={row.year}>
                        <TableCell className="font-medium">{row.year}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.rent)}</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(row.interest)}</TableCell>
                        <TableCell className="text-right text-blue-600 dark:text-blue-400">{formatCurrency(row.amortization)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.restschuld)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.objektwert)}</TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">{formatCurrency(row.vermoegen)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" disabled className="gap-2">
              <FileText className="w-4 h-4" />
              PDF Export
              <Badge variant="secondary" className="text-xs">Bald</Badge>
            </Button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!hasData && favorites.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Keine Daten für Simulation</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Fügen Sie Immobilien zu Ihrem Portfolio hinzu oder speichern Sie Favoriten,
              um eine Investment-Simulation durchzuführen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
