import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MapPin, Maximize2, Calendar, Building2, 
  Share2, Download, Phone, Mail, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ListingData {
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

interface CalculationResult {
  summary: {
    monthlyBurden: number;
    loanAmount: number;
    ltv: number;
    interestRate: number;
    yearlyTaxSavings: number;
    roiAfterTax: number;
  };
  projection: Array<{
    year: number;
    rent: number;
    interest: number;
    repayment: number;
    remainingDebt: number;
    taxSavings: number;
    cashFlowBeforeTax: number;
    cashFlowAfterTax: number;
    propertyValue: number;
    netWealth: number;
  }>;
}

export default function KaufyExpose() {
  const { publicId } = useParams<{ publicId: string }>();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Interactive parameters
  const [equity, setEquity] = useState(50000);
  const [repaymentRate, setRepaymentRate] = useState(2);
  const [valueGrowth, setValueGrowth] = useState(2);
  const [zvE, setZvE] = useState(60000);

  // Fetch listing data
  useEffect(() => {
    async function fetchListing() {
      if (!publicId) return;
      setIsLoading(true);

      // Mock data for now (would come from v_public_listings)
      // In production, this would be a real query
      setListing({
        public_id: publicId,
        title: 'Attraktives Mehrfamilienhaus in Top-Lage',
        description: 'Dieses gepflegte Mehrfamilienhaus bietet eine solide Rendite und wurde kürzlich umfassend saniert. Die Lage ist ideal für langfristige Vermietung mit stabilen Mieteinnahmen.',
        asking_price: 890000,
        property_type: 'multi_family',
        address: 'Musterstraße 123',
        city: 'München',
        postal_code: '80331',
        total_area_sqm: 620,
        year_built: 1925,
        monthly_rent: 4200,
        units_count: 8,
      });

      // Check favorites
      const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
      setIsFavorite(favorites.includes(publicId));
      
      setIsLoading(false);
    }

    fetchListing();
  }, [publicId]);

  // Calculate investment
  const calculate = useCallback(async () => {
    if (!listing) return;
    setIsCalculating(true);

    try {
      const { data, error } = await supabase.functions.invoke('sot-investment-engine', {
        body: {
          purchasePrice: listing.asking_price,
          monthlyRent: listing.monthly_rent,
          equity,
          termYears: 15,
          repaymentRate,
          taxableIncome: zvE,
          maritalStatus: 'single',
          hasChurchTax: false,
          afaModel: 'linear',
          buildingShare: 0.8,
          managementCostMonthly: 25,
          valueGrowthRate: valueGrowth,
          rentGrowthRate: 1.5,
        },
      });

      if (error) throw error;
      setCalcResult(data);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [listing, equity, repaymentRate, valueGrowth, zvE]);

  // Initial calculation
  useEffect(() => {
    if (listing) {
      calculate();
    }
  }, [listing, calculate]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('kaufy_favorites') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== publicId);
    } else {
      newFavorites = [...favorites, publicId];
    }
    
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

  const chartData = calcResult?.projection.slice(0, 30).map(p => ({
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
          {/* Left Column - Property Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery Placeholder */}
            <div className="aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <Building2 className="w-16 h-16 text-muted-foreground" />
            </div>

            {/* Property Details */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2">Mehrfamilienhaus</Badge>
                  <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--z3-foreground))' }}>
                    {listing.title}
                  </h1>
                  <p className="flex items-center gap-1 mt-2" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>
                    <MapPin className="w-4 h-4" />
                    {listing.postal_code} {listing.city}, {listing.address}
                  </p>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'hsl(var(--z3-primary))' }}>
                  {formatCurrency(listing.asking_price)}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl" style={{ backgroundColor: 'hsl(var(--z3-secondary))' }}>
                <div>
                  <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Wohnfläche</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Maximize2 className="w-4 h-4" /> {listing.total_area_sqm} m²
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Baujahr</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {listing.year_built}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Einheiten</p>
                  <p className="font-semibold">{listing.units_count} WE</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'hsl(var(--z3-muted-foreground))' }}>Mieteinnahmen</p>
                  <p className="font-semibold">{formatCurrency(listing.monthly_rent)}/Mo</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Beschreibung</h3>
                <p style={{ color: 'hsl(var(--z3-muted-foreground))' }}>{listing.description}</p>
              </div>
            </div>

            {/* Value Development Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Wertentwicklung (30 Jahre)</CardTitle>
              </CardHeader>
              <CardContent>
                {isCalculating ? (
                  <Skeleton className="h-64" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area 
                        type="monotone" 
                        dataKey="Immobilienwert" 
                        stackId="1"
                        stroke="hsl(var(--z3-primary))" 
                        fill="hsl(var(--z3-primary) / 0.2)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Nettovermögen" 
                        stackId="2"
                        stroke="hsl(142 71% 45%)" 
                        fill="hsl(142 71% 45% / 0.2)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Cashflow Table */}
            <Card>
              <CardHeader>
                <CardTitle>Einnahmen-Ausgaben-Rechnung (Jahr 1)</CardTitle>
              </CardHeader>
              <CardContent>
                {isCalculating ? (
                  <Skeleton className="h-48" />
                ) : calcResult ? (
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span>Mieteinnahmen (12 × {formatCurrency(listing.monthly_rent)})</span>
                      <span className="text-green-600 font-semibold">+{formatCurrency(calcResult.projection[0].rent)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Zinsaufwand</span>
                      <span className="text-red-600">-{formatCurrency(calcResult.projection[0].interest)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Tilgung</span>
                      <span className="text-red-600">-{formatCurrency(calcResult.projection[0].repayment)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Verwaltung</span>
                      <span className="text-red-600">-{formatCurrency(300)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b bg-muted/50 px-2 -mx-2 rounded">
                      <span className="font-semibold">Cashflow vor Steuer</span>
                      <span className={`font-semibold ${calcResult.projection[0].cashFlowBeforeTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(calcResult.projection[0].cashFlowBeforeTax)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Steuerersparnis (AfA + Werbungskosten)</span>
                      <span className="text-green-600 font-semibold">+{formatCurrency(calcResult.projection[0].taxSavings)}</span>
                    </div>
                    <div 
                      className="flex justify-between py-3 px-3 -mx-2 rounded-lg mt-2"
                      style={{ backgroundColor: calcResult.summary.monthlyBurden <= 0 ? 'hsl(142 71% 45% / 0.1)' : 'hsl(var(--z3-secondary))' }}
                    >
                      <span className="font-bold">NETTO-BELASTUNG (monatlich)</span>
                      <span 
                        className="font-bold text-lg"
                        style={{ color: calcResult.summary.monthlyBurden <= 0 ? 'hsl(142 71% 45%)' : 'inherit' }}
                      >
                        {formatCurrency(calcResult.summary.monthlyBurden)}/Mo
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
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
                    <span className="text-sm font-medium">{formatCurrency(zvE)}</span>
                  </div>
                  <Slider
                    value={[zvE]}
                    onValueChange={([v]) => setZvE(v)}
                    onValueCommit={() => calculate()}
                    min={30000}
                    max={200000}
                    step={5000}
                  />
                </div>

                {/* Equity */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Eigenkapital</Label>
                    <span className="text-sm font-medium">{formatCurrency(equity)}</span>
                  </div>
                  <Slider
                    value={[equity]}
                    onValueChange={([v]) => setEquity(v)}
                    onValueCommit={() => calculate()}
                    min={20000}
                    max={300000}
                    step={10000}
                  />
                </div>

                {/* Repayment Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Tilgungsrate</Label>
                    <span className="text-sm font-medium">{repaymentRate}%</span>
                  </div>
                  <Slider
                    value={[repaymentRate]}
                    onValueChange={([v]) => setRepaymentRate(v)}
                    onValueCommit={() => calculate()}
                    min={1}
                    max={5}
                    step={0.5}
                  />
                </div>

                {/* Value Growth */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Wertsteigerung p.a.</Label>
                    <span className="text-sm font-medium">{valueGrowth}%</span>
                  </div>
                  <Slider
                    value={[valueGrowth]}
                    onValueChange={([v]) => setValueGrowth(v)}
                    onValueCommit={() => calculate()}
                    min={0}
                    max={5}
                    step={0.5}
                  />
                </div>

                {/* Results Summary */}
                {calcResult && (
                  <div className="pt-4 border-t space-y-3">
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
                      <span className="font-medium text-green-600">+{formatCurrency(calcResult.summary.yearlyTaxSavings)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>EK-Rendite nach Steuer</span>
                      <span className="font-medium" style={{ color: 'hsl(var(--z3-primary))' }}>{calcResult.summary.roiAfterTax.toFixed(1)}%</span>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="pt-4 space-y-3">
                  <Button className="w-full" style={{ backgroundColor: 'hsl(var(--z3-primary))' }}>
                    <Phone className="w-4 h-4 mr-2" />
                    Jetzt anfragen
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Als PDF speichern
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
