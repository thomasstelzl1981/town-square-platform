/**
 * InvestmentExposePage — Vollbild-Exposé für MOD-08 (Investment-Suche)
 * 
 * WICHTIG: Dies ist eine eigenständige Seite (kein Modal!), die das Layout
 * von KaufyExpose adaptiert, aber im Portal-Kontext bleibt.
 * 
 * Features:
 * - 40-Jahres-Chart (MasterGraph)
 * - Haushaltsrechnung (5-Zeilen EÜR)
 * - Interaktive Parameter-Slider
 * - 10-Jahres-Projektion
 * - Favoriten-Toggle
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MapPin, Maximize2, Calendar, Building2, 
  Share2, Loader2, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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

export default function InvestmentExposePage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDetailTable, setShowDetailTable] = useState(false);
  const { calculate, result: calcResult, isLoading: isCalculating } = useInvestmentEngine();

  // Interactive parameters state
  const [params, setParams] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: 250000,
    monthlyRent: 800,
  });

  // Fetch listing data - support both public_id and direct listing_id (UUID)
  const { data: listing, isLoading } = useQuery({
    queryKey: ['investment-listing', publicId],
    queryFn: async () => {
      if (!publicId) return null;

      // Try public_id first
      let { data, error } = await supabase
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
        .maybeSingle();

      // If not found by public_id, try by UUID (listing id)
      if (!data && !error) {
        const uuidResult = await supabase
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
          .eq('id', publicId)
          .maybeSingle();
        
        data = uuidResult.data;
        error = uuidResult.error;
      }

      if (error || !data) {
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
        property_type: props?.property_type || 'apartment',
        address: props?.address || '',
        city: props?.city || '',
        postal_code: props?.postal_code || '',
        total_area_sqm: props?.total_area_sqm || 0,
        year_built: props?.construction_year || 0,
        monthly_rent: annualIncome > 0 ? annualIncome / 12 : 0,
        units_count: 1,
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
    }
  }, [listing]);

  // Calculate when params change
  useEffect(() => {
    if (params.purchasePrice > 0) {
      calculate(params);
    }
  }, [params, calculate]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
    // TODO: Persist to investment_favorites table
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Objekt nicht gefunden</p>
        <Link to="/portal/investments/suche">
          <Button className="mt-4">Zurück zur Suche</Button>
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

  const propertyTypeLabel = {
    'multi_family': 'Mehrfamilienhaus',
    'single_family': 'Einfamilienhaus',
    'apartment': 'Eigentumswohnung',
    'commercial': 'Gewerbe',
  }[listing.property_type] || 'Immobilie';

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="border-b bg-card">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link 
            to="/portal/investments/suche" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
      <div className="p-6">
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
                  <Badge className="mb-2">{propertyTypeLabel}</Badge>
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

              {/* Key Facts */}
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
                  <p className="font-semibold">{listing.units_count} WE</p>
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
                <CardTitle>Ihre monatliche Übersicht (Jahr 1)</CardTitle>
              </CardHeader>
              <CardContent>
                {isCalculating ? (
                  <Skeleton className="h-48" />
                ) : calcResult ? (
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span>Mieteinnahmen</span>
                      <span className="text-green-600 font-semibold">+{formatCurrency(calcResult.projection[0]?.rent / 12 || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Darlehensrate</span>
                      <span className="text-red-600">-{formatCurrency((calcResult.projection[0]?.interest + calcResult.projection[0]?.repayment) / 12 || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Bewirtschaftung</span>
                      <span className="text-red-600">-{formatCurrency(calcResult.projection[0]?.managementCost / 12 || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Steuereffekt</span>
                      <span className="text-green-600">+{formatCurrency(calcResult.projection[0]?.taxSavings / 12 || 0)}</span>
                    </div>
                    <div 
                      className="flex justify-between py-3 px-3 -mx-2 rounded-lg mt-2"
                      style={{ backgroundColor: (calcResult.summary.monthlyBurden || 0) <= 0 ? 'hsl(142 71% 45% / 0.1)' : 'hsl(var(--muted))' }}
                    >
                      <span className="font-bold">Netto nach Steuer</span>
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

            {/* 5-Box Cashflow-Darstellung */}
            {calcResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Monatlicher Cashflow nach Steuern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-green-700 font-bold text-lg">
                        +{formatCurrency(calcResult.projection[0]?.rent / 12 || 0)}
                      </p>
                      <p className="text-xs text-green-600">Miete</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-red-700 font-bold text-lg">
                        -{formatCurrency((calcResult.projection[0]?.interest + calcResult.projection[0]?.repayment) / 12 || 0)}
                      </p>
                      <p className="text-xs text-red-600">Rate</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-red-700 font-bold text-lg">
                        -{formatCurrency(calcResult.projection[0]?.managementCost / 12 || 0)}
                      </p>
                      <p className="text-xs text-red-600">Verw.</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-green-700 font-bold text-lg">
                        +{formatCurrency(calcResult.projection[0]?.taxSavings / 12 || 0)}
                      </p>
                      <p className="text-xs text-green-600">Steuer</p>
                    </div>
                    <div 
                      className="text-center p-3 rounded-lg border-2"
                      style={{ 
                        backgroundColor: (calcResult.summary.monthlyBurden || 0) <= 0 ? 'hsl(142 71% 45% / 0.1)' : 'hsl(var(--muted))',
                        borderColor: (calcResult.summary.monthlyBurden || 0) <= 0 ? 'hsl(142 71% 45%)' : 'hsl(var(--border))'
                      }}
                    >
                      <p 
                        className="font-bold text-lg"
                        style={{ color: (calcResult.summary.monthlyBurden || 0) <= 0 ? 'hsl(142 71% 45%)' : 'inherit' }}
                      >
                        {formatCurrency(calcResult.summary.monthlyBurden || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Netto/Mo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detail Table (Collapsible) */}
            {calcResult && (
              <Collapsible open={showDetailTable} onOpenChange={setShowDetailTable}>
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle>10-Jahres-Detailtabelle</CardTitle>
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
                            {calcResult.projection.slice(0, 10).map((row: YearlyData) => (
                              <tr key={row.year} className="border-b hover:bg-muted/50">
                                <td className="py-2 px-2 font-medium">{row.year}</td>
                                <td className="py-2 px-2 text-right text-green-600">{formatCurrency(row.rent)}</td>
                                <td className="py-2 px-2 text-right text-red-600">{formatCurrency(row.interest)}</td>
                                <td className="py-2 px-2 text-right text-blue-600">{formatCurrency(row.repayment)}</td>
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
                {/* zVE */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>zu versteuerndes Einkommen</Label>
                    <span className="text-sm font-medium">{formatCurrency(params.taxableIncome)}</span>
                  </div>
                  <Slider
                    value={[params.taxableIncome]}
                    onValueChange={([v]) => setParams(p => ({ ...p, taxableIncome: v }))}
                    min={20000}
                    max={200000}
                    step={1000}
                  />
                </div>

                {/* Eigenkapital */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Eigenkapital</Label>
                    <span className="text-sm font-medium">{formatCurrency(params.equity)}</span>
                  </div>
                  <Slider
                    value={[params.equity]}
                    onValueChange={([v]) => setParams(p => ({ ...p, equity: v }))}
                    min={0}
                    max={Math.max(params.purchasePrice * 0.5, 100000)}
                    step={5000}
                  />
                </div>

                {/* Tilgung */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Tilgung</Label>
                    <span className="text-sm font-medium">{params.repaymentRate.toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[params.repaymentRate * 10]}
                    onValueChange={([v]) => setParams(p => ({ ...p, repaymentRate: v / 10 }))}
                    min={10}
                    max={50}
                    step={1}
                  />
                </div>

                {/* Wertsteigerung */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Wertsteigerung p.a.</Label>
                    <span className="text-sm font-medium">{params.valueGrowthRate.toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[params.valueGrowthRate * 10]}
                    onValueChange={([v]) => setParams(p => ({ ...p, valueGrowthRate: v / 10 }))}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>

                {/* Key Results */}
                {calcResult && (
                  <div className="mt-6 p-4 rounded-xl bg-muted space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Darlehen</span>
                      <span className="font-medium">{formatCurrency(calcResult.summary.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">LTV</span>
                      <span className="font-medium">{calcResult.summary.ltv.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Zinssatz</span>
                      <span className="font-medium">{calcResult.summary.interestRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rate/Monat</span>
                      <span className="font-medium">{formatCurrency((calcResult.summary.yearlyInterest + calcResult.summary.yearlyRepayment) / 12)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="font-semibold">Belastung/Monat</span>
                      <span 
                        className="font-bold text-lg"
                        style={{ color: (calcResult.summary.monthlyBurden || 0) <= 0 ? 'hsl(142 71% 45%)' : 'inherit' }}
                      >
                        {formatCurrency(calcResult.summary.monthlyBurden)}
                      </span>
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/portal/finanzierung/anfrage')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Finanzierung anfragen
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={toggleFavorite}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 10-Year Projection Summary */}
            {calcResult && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Entwicklung nach 10 Jahren</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Restschuld</span>
                    <span className="font-medium">{formatCurrency(calcResult.projection[10]?.remainingDebt || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Objektwert</span>
                    <span className="font-medium">{formatCurrency(calcResult.projection[10]?.propertyValue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wertzuwachs</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency((calcResult.projection[10]?.propertyValue || 0) - params.purchasePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Eigenkapitalaufbau</span>
                    <span className="font-bold text-green-600">
                      +{formatCurrency((calcResult.projection[10]?.netWealth || 0) - params.equity)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
