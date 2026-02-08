import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MapPin, Maximize2, Calendar, Building2, 
  Share2, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useInvestmentEngine, defaultInput, CalculationInput, YearlyData } from '@/hooks/useInvestmentEngine';

interface ListingData {
  id: string;
  public_id: string;
  title: string;
  description: string;
  asking_price: number;
  property_type: string;
  address: string;
  city: string;
  postal_code: string;
  total_area_sqm: number;
  year_built: number;
  monthly_rent: number;
  units_count: number;
}

export default function KaufyExpose() {
  const { publicId } = useParams<{ publicId: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDetailTable, setShowDetailTable] = useState(false);
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  // Interactive parameters state
  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: 250000,
    monthlyRent: 800,
  });

  // Fetch listing data
  const { data: listing, isLoading } = useQuery({
    queryKey: ['public-listing', publicId],
    queryFn: async () => {
      if (!publicId) return null;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          public_id,
          title,
          description,
          asking_price,
          properties!inner (
            id,
            property_type,
            address,
            city,
            postal_code,
            total_area_sqm,
            construction_year,
            annual_income
          )
        `)
        .eq('public_id', publicId)
        .single();

      if (error || !data) {
        console.error('Listing query error:', error);
        return null;
      }

      const props = data.properties as any;
      const annualIncome = props?.annual_income || 0;

      return {
        id: data.id,
        public_id: data.public_id,
        title: data.title || 'Immobilie',
        description: data.description || '',
        asking_price: data.asking_price || 0,
        property_type: props?.property_type || 'multi_family',
        address: props?.address || '',
        city: props?.city || '',
        postal_code: props?.postal_code || '',
        total_area_sqm: props?.total_area_sqm || 0,
        year_built: props?.construction_year || 0,
        monthly_rent: Math.round(annualIncome / 12),
        units_count: 0,
      };
    },
    enabled: !!publicId,
  });

  // Initialize params with listing data
  useEffect(() => {
    if (listing) {
      setParams(prev => ({
        ...prev,
        purchasePrice: listing.asking_price || 250000,
        monthlyRent: listing.monthly_rent || Math.round((listing.asking_price || 250000) * 0.004),
      }));

      const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
      setIsFavorite(favorites.includes(publicId));
    }
  }, [listing, publicId]);

  // Calculate when params change
  useEffect(() => {
    if (params.purchasePrice > 0) {
      calculate(params);
    }
  }, [params, calculate]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
    const newFavorites = isFavorite 
      ? favorites.filter((id: string) => id !== publicId)
      : [...favorites, publicId];
    localStorage.setItem('kaufy_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="zone3-container py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="zone3-container py-8 text-center">
        <p>Objekt nicht gefunden</p>
        <Link to="/kaufy/immobilien" className="zone3-btn-primary mt-4 inline-block">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const chartData = calcResult?.projection.slice(0, 40).map(p => ({
    year: p.year,
    'Immobilienwert': p.propertyValue,
    'Nettovermögen': p.netWealth,
    'Restschuld': p.remainingDebt,
  })) || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--z3-background))' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'hsl(var(--z3-border))' }}>
        <div className="zone3-container py-4 flex items-center justify-between">
          <Link 
            to="/kaufy/immobilien" 
            className="flex items-center gap-2 text-sm hover:underline"
            style={{ color: 'hsl(var(--z3-muted-foreground))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Suche
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleFavorite}>
              <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              {isFavorite ? 'Gespeichert' : 'Merken'}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Teilen
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="zone3-container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Property Info & Calculations */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Placeholder */}
            <div className="aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <Building2 className="w-16 h-16 text-muted-foreground" />
            </div>

            {/* Property Details */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2">
                    {listing.property_type === 'multi_family' ? 'Mehrfamilienhaus' :
                     listing.property_type === 'single_family' ? 'Einfamilienhaus' :
                     listing.property_type === 'apartment' ? 'Eigentumswohnung' : 'Immobilie'}
                  </Badge>
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                  <p className="flex items-center gap-1 mt-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {listing.postal_code} {listing.city}, {listing.address}
                  </p>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(listing.asking_price)}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Wohnfläche</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" /> {listing.total_area_sqm} m²
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Baujahr</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {listing.year_built || '–'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Einheiten</p>
                  <p className="font-semibold">{listing.units_count || '–'} WE</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mieteinnahmen</p>
                  <p className="font-semibold">{formatCurrency(params.monthlyRent)}/Mo</p>
                </div>
              </div>

              {listing.description && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Beschreibung</h3>
                  <p className="text-muted-foreground">{listing.description}</p>
                </div>
              )}
            </div>

            {/* Master Graph */}
            <Card>
              <CardHeader>
                <CardTitle>Wertentwicklung (40 Jahre)</CardTitle>
              </CardHeader>
              <CardContent>
                {isCalculating ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area 
                        type="monotone" 
                        dataKey="Immobilienwert" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Nettovermögen" 
                        stroke="hsl(142 71% 45%)" 
                        fill="hsl(142 71% 45% / 0.2)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Restschuld" 
                        stroke="hsl(var(--destructive))" 
                        fill="hsl(var(--destructive) / 0.1)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : null}
              </CardContent>
            </Card>

            {/* Haushaltsrechnung */}
            <Card>
              <CardHeader>
                <CardTitle>Haushaltsrechnung (Jahr 1)</CardTitle>
              </CardHeader>
              <CardContent>
                {isCalculating ? (
                  <Skeleton className="h-48" />
                ) : calcResult ? (
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span>Mieteinnahmen (12 × {formatCurrency(params.monthlyRent)})</span>
                      <span className="text-green-600 font-semibold">+{formatCurrency(calcResult.projection[0]?.rent || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Zinsaufwand</span>
                      <span className="text-red-600">-{formatCurrency(calcResult.projection[0]?.interest || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Tilgung</span>
                      <span className="text-red-600">-{formatCurrency(calcResult.projection[0]?.repayment || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Verwaltung</span>
                      <span className="text-red-600">-{formatCurrency(calcResult.projection[0]?.managementCost || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b bg-muted/50 px-2 -mx-2 rounded">
                      <span className="font-semibold">Cashflow vor Steuer</span>
                      <span className={`font-semibold ${(calcResult.projection[0]?.cashFlowBeforeTax || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(calcResult.projection[0]?.cashFlowBeforeTax || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Steuerersparnis (AfA + Werbungskosten)</span>
                      <span className="text-green-600 font-semibold">+{formatCurrency(calcResult.projection[0]?.taxSavings || 0)}</span>
                    </div>
                    <div 
                      className="flex justify-between py-3 px-3 -mx-2 rounded-lg mt-2"
                      style={{ backgroundColor: (calcResult.summary.monthlyBurden || 0) <= 0 ? 'hsl(142 71% 45% / 0.1)' : 'hsl(var(--muted))' }}
                    >
                      <span className="font-bold">NETTO-BELASTUNG (monatlich)</span>
                      <span 
                        className="font-bold text-lg"
                        style={{ color: (calcResult.summary.monthlyBurden || 0) <= 0 ? 'hsl(142 71% 45%)' : 'inherit' }}
                      >
                        {formatCurrency(calcResult.summary.monthlyBurden || 0)}/Mo
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Detail Table */}
            {calcResult && (
              <Collapsible open={showDetailTable} onOpenChange={setShowDetailTable}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle>40-Jahres-Detailtabelle</CardTitle>
                        {showDetailTable ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2">Jahr</th>
                              <th className="text-right py-2 px-2">Miete</th>
                              <th className="text-right py-2 px-2">Zins</th>
                              <th className="text-right py-2 px-2">Tilgung</th>
                              <th className="text-right py-2 px-2">Restschuld</th>
                              <th className="text-right py-2 px-2">Wert</th>
                              <th className="text-right py-2 px-2">Vermögen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {calcResult.projection.map((row: YearlyData) => (
                              <tr key={row.year} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-2 font-medium">{row.year}</td>
                                <td className="py-2 px-2 text-right text-green-600">{formatCurrency(row.rent)}</td>
                                <td className="py-2 px-2 text-right text-red-600">{formatCurrency(row.interest)}</td>
                                <td className="py-2 px-2 text-right">{formatCurrency(row.repayment)}</td>
                                <td className="py-2 px-2 text-right">{formatCurrency(row.remainingDebt)}</td>
                                <td className="py-2 px-2 text-right">{formatCurrency(row.propertyValue)}</td>
                                <td className="py-2 px-2 text-right font-medium text-green-600">{formatCurrency(row.netWealth)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </div>

          {/* Right Column - Interactive Calculator */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Investment-Rechner</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Passen Sie die Parameter an Ihre Situation an
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* zvE */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Zu versteuerndes Einkommen</Label>
                    <span className="text-sm font-medium">{formatCurrency(params.taxableIncome)}</span>
                  </div>
                  <Slider
                    value={[params.taxableIncome]}
                    onValueChange={([v]) => setParams(p => ({ ...p, taxableIncome: v }))}
                    min={30000}
                    max={200000}
                    step={5000}
                  />
                </div>

                {/* Equity */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Eigenkapital</Label>
                    <span className="text-sm font-medium">{formatCurrency(params.equity)}</span>
                  </div>
                  <Slider
                    value={[params.equity]}
                    onValueChange={([v]) => setParams(p => ({ ...p, equity: v }))}
                    min={20000}
                    max={Math.min(params.purchasePrice, 500000)}
                    step={10000}
                  />
                </div>

                {/* Repayment Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Tilgungsrate</Label>
                    <span className="text-sm font-medium">{params.repaymentRate}%</span>
                  </div>
                  <Slider
                    value={[params.repaymentRate]}
                    onValueChange={([v]) => setParams(p => ({ ...p, repaymentRate: v }))}
                    min={1}
                    max={5}
                    step={0.5}
                  />
                </div>

                {/* Value Growth */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Wertsteigerung p.a.</Label>
                    <span className="text-sm font-medium">{params.valueGrowthRate}%</span>
                  </div>
                  <Slider
                    value={[params.valueGrowthRate]}
                    onValueChange={([v]) => setParams(p => ({ ...p, valueGrowthRate: v }))}
                    min={0}
                    max={5}
                    step={0.5}
                  />
                </div>

                {/* Rent Growth */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Mietentwicklung p.a.</Label>
                    <span className="text-sm font-medium">{params.rentGrowthRate}%</span>
                  </div>
                  <Slider
                    value={[params.rentGrowthRate]}
                    onValueChange={([v]) => setParams(p => ({ ...p, rentGrowthRate: v }))}
                    min={0}
                    max={5}
                    step={0.5}
                  />
                </div>

                {/* Church Tax */}
                <div className="flex items-center justify-between">
                  <Label>Kirchensteuer</Label>
                  <Switch
                    checked={params.hasChurchTax}
                    onCheckedChange={(v) => setParams(p => ({ ...p, hasChurchTax: v }))}
                  />
                </div>

                {/* Splitting */}
                <div className="flex items-center justify-between">
                  <Label>Ehegattensplitting</Label>
                  <Switch
                    checked={params.maritalStatus === 'married'}
                    onCheckedChange={(v) => setParams(p => ({ ...p, maritalStatus: v ? 'married' : 'single' }))}
                  />
                </div>

                {/* Results Summary */}
                {calcResult && (
                  <div className="pt-4 mt-4 border-t space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Darlehensbetrag</span>
                      <span className="font-medium">{formatCurrency(calcResult.summary.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Beleihung (LTV)</span>
                      <span className="font-medium">{calcResult.summary.ltv}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Zinssatz</span>
                      <span className="font-medium">{calcResult.summary.interestRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Steuerersparnis/Jahr</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(calcResult.summary.yearlyTaxSavings)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rendite nach Steuern</span>
                      <span className="font-medium">{calcResult.summary.roiAfterTax.toFixed(1)}%</span>
                    </div>
                    
                    <div 
                      className="mt-4 p-4 rounded-lg text-center"
                      style={{ 
                        backgroundColor: calcResult.summary.monthlyBurden <= 0 
                          ? 'hsl(142 71% 45% / 0.1)' 
                          : 'hsl(var(--destructive) / 0.1)'
                      }}
                    >
                      <p className="text-sm text-muted-foreground mb-1">Monatliche Belastung</p>
                      <p 
                        className="text-2xl font-bold"
                        style={{ 
                          color: calcResult.summary.monthlyBurden <= 0 
                            ? 'hsl(142 71% 45%)' 
                            : 'hsl(var(--destructive))'
                        }}
                      >
                        {calcResult.summary.monthlyBurden <= 0 ? '+' : ''}
                        {formatCurrency(Math.abs(calcResult.summary.monthlyBurden))}/Mo
                      </p>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-6 space-y-3">
                  <Link to={`/auth?source=kaufy&listing=${publicId}`} className="block">
                    <Button className="w-full">Finanzierung anfragen</Button>
                  </Link>
                  <Button variant="outline" className="w-full">
                    Besichtigung vereinbaren
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
