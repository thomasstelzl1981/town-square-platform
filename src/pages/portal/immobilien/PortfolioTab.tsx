import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/ui/chart-card';
import { FileUploader } from '@/components/shared/FileUploader';
import { 
  PropertyTable, 
  PropertyCodeCell, 
  PropertyCurrencyCell,
  type PropertyTableColumn 
} from '@/components/shared/PropertyTable';
import { 
  Loader2, Building2, TrendingUp, Wallet, PiggyBank, Percent, 
  Plus, Upload, Eye
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart 
} from 'recharts';
import { ExcelImportDialog } from '@/components/portfolio/ExcelImportDialog';

interface Property {
  id: string;
  code: string | null;
  property_type: string;
  city: string;
  address: string;
  postal_code: string | null;
  total_area_sqm: number | null;
  usage_type: string;
  annual_income: number | null;
  market_value: number | null;
  management_fee: number | null;
  status: string;
}

interface PropertyFinancing {
  property_id: string;
  current_balance: number | null;
  monthly_rate: number | null;
  interest_rate: number | null;
}

interface Unit {
  property_id: string;
  current_monthly_rent: number | null;
  ancillary_costs: number | null;
}

export function PortfolioTab() {
  const navigate = useNavigate();
  const { activeOrganization } = useAuth();
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Fetch properties
  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ['properties', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('tenant_id', activeOrganization!.id)
        .eq('status', 'active')
        .order('code', { ascending: true });
      
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!activeOrganization,
  });

  // Fetch financing data
  const { data: financingData } = useQuery({
    queryKey: ['property-financing', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_financing')
        .select('property_id, current_balance, monthly_rate, interest_rate')
        .eq('tenant_id', activeOrganization!.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as PropertyFinancing[];
    },
    enabled: !!activeOrganization,
  });

  // Fetch units data
  const { data: unitsData } = useQuery({
    queryKey: ['units-rent', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('property_id, current_monthly_rent, ancillary_costs')
        .eq('tenant_id', activeOrganization!.id);
      
      if (error) throw error;
      return data as Unit[];
    },
    enabled: !!activeOrganization,
  });

  // Calculate aggregations
  const totals = useMemo(() => {
    if (!properties) return null;

    const count = properties.length;
    const totalArea = properties.reduce((sum, p) => sum + (p.total_area_sqm || 0), 0);
    const totalValue = properties.reduce((sum, p) => sum + (p.market_value || 0), 0);
    const totalIncome = properties.reduce((sum, p) => sum + (p.annual_income || 0), 0);
    const totalDebt = financingData?.reduce((sum, f) => sum + (f.current_balance || 0), 0) || 0;
    const totalRate = financingData?.reduce((sum, f) => sum + (f.monthly_rate || 0), 0) || 0;
    const avgInterestRate = financingData?.length 
      ? financingData.reduce((sum, f) => sum + (f.interest_rate || 0), 0) / financingData.length 
      : 3.5;
    const netWealth = totalValue - totalDebt;
    const avgYield = totalValue > 0 ? (totalIncome / totalValue) * 100 : 0;

    return { count, totalArea, totalValue, totalIncome, totalDebt, totalRate, netWealth, avgYield, avgInterestRate };
  }, [properties, financingData]);

  // Tilgungsverlauf Chart Data (30 Jahre Projektion)
  const amortizationData = useMemo(() => {
    if (!totals || totals.totalDebt === 0) return [];
    
    const years = [];
    let debt = totals.totalDebt;
    let equity = totals.totalValue - totals.totalDebt;
    const annualPayment = totals.totalRate * 12;
    const interestRate = totals.avgInterestRate / 100;
    const valueGrowthRate = 0.02; // 2% jährlicher Wertzuwachs
    let currentValue = totals.totalValue;
    
    for (let year = 0; year <= 30; year++) {
      years.push({ 
        year: 2026 + year, 
        restschuld: Math.max(0, Math.round(debt)),
        eigenkapital: Math.round(equity),
        verkehrswert: Math.round(currentValue)
      });
      
      // Berechnung für nächstes Jahr
      const interest = debt * interestRate;
      const amortization = Math.min(annualPayment - interest, debt);
      debt = Math.max(0, debt - amortization);
      currentValue = currentValue * (1 + valueGrowthRate);
      equity = currentValue - debt;
    }
    return years;
  }, [totals]);

  // EÜR Chart Data (Einnahmenüberschussrechnung)
  const eurChartData = useMemo(() => {
    if (!totals) return [];
    
    const annualIncome = totals.totalIncome;
    const annualInterest = financingData?.reduce((sum, f) => {
      const balance = f.current_balance || 0;
      const rate = (f.interest_rate || 3.5) / 100;
      return sum + (balance * rate);
    }, 0) || 0;
    const nonRecoverableNk = totals.totalValue * 0.005; // ~0.5% nicht umlagefähig
    const annualAmort = (totals.totalRate * 12) - annualInterest;
    const surplus = annualIncome - annualInterest - nonRecoverableNk;
    
    return [
      { name: 'Mieteinnahmen', value: Math.round(annualIncome), type: 'income', fill: 'hsl(var(--chart-1))' },
      { name: 'Zinskosten', value: -Math.round(annualInterest), type: 'expense', fill: 'hsl(var(--chart-2))' },
      { name: 'Nicht umlf. NK', value: -Math.round(nonRecoverableNk), type: 'expense', fill: 'hsl(var(--chart-3))' },
      { name: 'Tilgung', value: -Math.round(annualAmort), type: 'expense', fill: 'hsl(var(--chart-4))' },
      { name: 'Überschuss', value: Math.round(surplus), type: 'result', fill: surplus >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))' },
    ];
  }, [totals, financingData]);

  // Get financing for property
  const getFinancing = useCallback((propertyId: string) => {
    return financingData?.find(f => f.property_id === propertyId);
  }, [financingData]);

  // Get unit rent for property
  const getUnitRent = useCallback((propertyId: string) => {
    const unit = unitsData?.find(u => u.property_id === propertyId);
    return unit ? (unit.current_monthly_rent || 0) + (unit.ancillary_costs || 0) : 0;
  }, [unitsData]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle Excel import
  const handleExcelFile = async (files: File[]) => {
    if (files.length > 0) {
      setShowImportDialog(true);
    }
  };

  const hasData = properties && properties.length > 0;

  // Table columns configuration
  const columns: PropertyTableColumn<Property>[] = [
    { 
      key: 'code', 
      header: 'Code', 
      width: '80px',
      render: (value) => <PropertyCodeCell code={value} />
    },
    { 
      key: 'property_type', 
      header: 'Art',
      render: (value) => <Badge variant="outline" className="text-xs">{value}</Badge>
    },
    { key: 'city', header: 'Ort' },
    { 
      key: 'address', 
      header: 'Adresse', 
      minWidth: '200px',
      render: (value) => <span className="truncate max-w-[200px] block">{value}</span>
    },
    { 
      key: 'total_area_sqm', 
      header: 'qm', 
      align: 'right',
      render: (value) => value?.toLocaleString('de-DE') || '–'
    },
    { 
      key: 'usage_type', 
      header: 'Nutzung',
      render: (value) => <Badge variant="secondary" className="text-xs">{value}</Badge>
    },
    { 
      key: 'annual_income', 
      header: 'Einnahmen', 
      align: 'right',
      render: (value) => <PropertyCurrencyCell value={value} />
    },
    { 
      key: 'market_value', 
      header: 'Verkehrswert', 
      align: 'right',
      render: (value) => <PropertyCurrencyCell value={value} variant="bold" />
    },
    { 
      key: 'id', 
      header: 'Restschuld', 
      align: 'right',
      render: (_, row) => {
        const financing = getFinancing(row.id);
        return <PropertyCurrencyCell value={financing?.current_balance ?? null} variant="destructive" />;
      }
    },
    { 
      key: 'id', 
      header: 'Rate', 
      align: 'right',
      render: (_, row) => {
        const financing = getFinancing(row.id);
        return <PropertyCurrencyCell value={financing?.monthly_rate ?? null} />;
      }
    },
    { 
      key: 'id', 
      header: 'Warm', 
      align: 'right',
      render: (_, row) => {
        const warmRent = getUnitRent(row.id);
        return <PropertyCurrencyCell value={warmRent > 0 ? warmRent : null} />;
      }
    },
    { 
      key: 'management_fee', 
      header: 'Hausgeld', 
      align: 'right',
      render: (value) => <PropertyCurrencyCell value={value} />
    },
  ];

  if (propsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Beispiel-Exposé Button */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/portal/immobilien/vorlage')}>
          <Eye className="mr-2 h-4 w-4" />
          Beispiel-Exposé
        </Button>
      </div>

      {/* KPI Cards - IMMER sichtbar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Objekte"
          value={hasData ? (totals?.count.toString() || '0') : '0'}
          icon={Building2}
        />
        <StatCard
          title="Verkehrswert"
          value={hasData && totals?.totalValue ? formatCurrency(totals.totalValue) : '–'}
          icon={TrendingUp}
        />
        <StatCard
          title="Restschuld"
          value={hasData && totals?.totalDebt ? formatCurrency(totals.totalDebt) : '–'}
          icon={Wallet}
        />
        <StatCard
          title="Nettovermögen"
          value={hasData && totals?.netWealth ? formatCurrency(totals.netWealth) : '–'}
          icon={PiggyBank}
        />
        <StatCard
          title="Ø Rendite"
          value={hasData && totals?.avgYield ? `${totals.avgYield.toFixed(1)}%` : '–'}
          icon={Percent}
        />
      </div>

      {/* Charts: Tilgungsverlauf & EÜR */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tilgungsverlauf über 30 Jahre */}
        <ChartCard title="Tilgungsverlauf & Wertzuwachs (30 Jahre)">
          {hasData && amortizationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={amortizationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11 }} 
                  tickFormatter={(v) => v.toString().slice(2)}
                />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Jahr ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="verkehrswert" 
                  name="Verkehrswert"
                  stroke="hsl(var(--chart-1))" 
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="eigenkapital" 
                  name="Eigenkapital"
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.3}
                />
                <Line 
                  type="monotone" 
                  dataKey="restschuld" 
                  name="Restschuld"
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p>Keine Finanzierungsdaten vorhanden</p>
                <p className="text-xs mt-1">Fügen Sie Immobilien mit Finanzierung hinzu</p>
              </div>
            </div>
          )}
        </ChartCard>

        {/* EÜR-Darstellung */}
        <ChartCard title="Einnahmenüberschussrechnung (EÜR)">
          {hasData && eurChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={eurChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11 }} 
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100} 
                  tick={{ fontSize: 11 }} 
                />
                <Tooltip formatter={(value: number) => formatCurrency(Math.abs(value))} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p>Keine Einnahmen-/Ausgabendaten vorhanden</p>
                <p className="text-xs mt-1">Fügen Sie Immobilien mit Mieteinnahmen hinzu</p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Excel Import Zone (collapsed) */}
      <Card>
        <CardContent className="p-4">
          <FileUploader
            onFilesSelected={handleExcelFile}
            accept=".xlsx,.xls,.csv"
          >
            <div className="border border-dashed border-muted-foreground/25 rounded-lg p-3 text-center hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center gap-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Portfolio-Excel zum Import hier ablegen
              </span>
            </div>
          </FileUploader>
        </CardContent>
      </Card>

      {/* Properties Table using PropertyTable Master Component */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Immobilienportfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyTable
            data={properties || []}
            columns={columns}
            isLoading={propsLoading}
            showSearch
            searchPlaceholder="Nach Adresse, Ort oder Code suchen..."
            searchFilter={(row, search) => 
              row.address.toLowerCase().includes(search) ||
              row.city.toLowerCase().includes(search) ||
              (row.code && row.code.toLowerCase().includes(search))
            }
            onRowClick={(row) => navigate(`/portal/immobilien/${row.id}`)}
            rowActions={(row) => (
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            )}
            emptyState={{
              message: 'Noch keine Immobilien im Portfolio. Beginnen Sie mit dem ersten Objekt.',
              actionLabel: 'Erste Immobilie anlegen',
              actionRoute: '/portal/immobilien/neu'
            }}
            headerActions={
              <Button onClick={() => navigate('/portal/immobilien/neu')}>
                <Plus className="mr-2 h-4 w-4" />
                Neu
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Excel Import Dialog */}
      {activeOrganization && (
        <ExcelImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          tenantId={activeOrganization.id}
        />
      )}
    </div>
  );
}
