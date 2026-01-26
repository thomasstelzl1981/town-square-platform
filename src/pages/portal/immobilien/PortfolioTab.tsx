import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/ui/chart-card';
import { FileUploader } from '@/components/shared/FileUploader';
import { EmptyProperties } from '@/components/shared/EmptyState';
import { 
  Loader2, Building2, TrendingUp, Wallet, PiggyBank, Percent, 
  Search, Plus, Upload, Download, Eye, FileSpreadsheet
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
}

interface Unit {
  property_id: string;
  current_monthly_rent: number | null;
  ancillary_costs: number | null;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function PortfolioTab() {
  const navigate = useNavigate();
  const { activeOrganization } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
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
        .select('property_id, current_balance, monthly_rate')
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
    const netWealth = totalValue - totalDebt;
    const avgYield = totalValue > 0 ? (totalIncome / totalValue) * 100 : 0;

    return { count, totalArea, totalValue, totalIncome, totalDebt, totalRate, netWealth, avgYield };
  }, [properties, financingData]);

  // Chart data: by type
  const chartByType = useMemo(() => {
    if (!properties) return [];
    const grouped = properties.reduce((acc, p) => {
      const type = p.property_type || 'Sonstige';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [properties]);

  // Chart data: by city
  const chartByCity = useMemo(() => {
    if (!properties) return [];
    const grouped = properties.reduce((acc, p) => {
      acc[p.city] = (acc[p.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [properties]);

  // Get financing for property
  const getFinancing = useCallback((propertyId: string) => {
    return financingData?.find(f => f.property_id === propertyId);
  }, [financingData]);

  // Get unit rent for property
  const getUnitRent = useCallback((propertyId: string) => {
    const unit = unitsData?.find(u => u.property_id === propertyId);
    return unit ? (unit.current_monthly_rent || 0) + (unit.ancillary_costs || 0) : 0;
  }, [unitsData]);

  // Filter properties
  const filteredProperties = properties?.filter(p =>
    p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  // Calculate EÜR (Einnahmenüberschussrechnung)
  const eur = useMemo(() => {
    if (!totals) return null;
    const annualIncome = totals.totalIncome;
    const annualInterest = financingData?.reduce((sum, f) => sum + (f.monthly_rate || 0) * 12 * 0.6, 0) || 0; // ~60% Zinsanteil geschätzt
    const nonRecoverableNk = totals.totalValue * 0.005; // ca. 0.5% nicht umlagefähig geschätzt
    const surplusBeforeAmort = annualIncome - annualInterest - nonRecoverableNk;
    const annualAmort = (totals.totalRate * 12) - annualInterest;
    const surplusAfterAmort = surplusBeforeAmort - annualAmort;
    
    return { annualIncome, annualInterest, nonRecoverableNk, surplusBeforeAmort, annualAmort, surplusAfterAmort };
  }, [totals, financingData]);

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

      {/* Charts - IMMER sichtbar */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Verteilung nach Typ">
          {hasData && chartByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartByType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Keine Daten vorhanden
            </div>
          )}
        </ChartCard>

        <ChartCard title="Verteilung nach Region">
          {hasData && chartByCity.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartByCity} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Keine Daten vorhanden
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

      {/* Properties Table - IMMER sichtbar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Immobilienportfolio</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button onClick={() => navigate('/portal/immobilien/neu')}>
                <Plus className="mr-2 h-4 w-4" />
                Neu
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Code</TableHead>
                  <TableHead>Art</TableHead>
                  <TableHead>Ort</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead className="text-right">qm</TableHead>
                  <TableHead>Nutzung</TableHead>
                  <TableHead className="text-right">Einnahmen</TableHead>
                  <TableHead className="text-right">Verkehrswert</TableHead>
                  <TableHead className="text-right">Restschuld</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Warm</TableHead>
                  <TableHead className="text-right">Hausgeld</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasData ? (
                  filteredProperties?.map((prop) => {
                    const financing = getFinancing(prop.id);
                    const warmRent = getUnitRent(prop.id);
                    
                    return (
                      <TableRow
                        key={prop.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/portal/immobilien/${prop.id}`)}
                      >
                        <TableCell className="font-mono text-xs">
                          {prop.code || '–'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {prop.property_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{prop.city}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {prop.address}
                        </TableCell>
                        <TableCell className="text-right">
                          {prop.total_area_sqm?.toLocaleString('de-DE') || '–'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {prop.usage_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {prop.annual_income ? formatCurrency(prop.annual_income) : '–'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {prop.market_value ? formatCurrency(prop.market_value) : '–'}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {financing?.current_balance ? formatCurrency(financing.current_balance) : '–'}
                        </TableCell>
                        <TableCell className="text-right">
                          {financing?.monthly_rate ? formatCurrency(financing.monthly_rate) : '–'}
                        </TableCell>
                        <TableCell className="text-right">
                          {warmRent > 0 ? formatCurrency(warmRent) : '–'}
                        </TableCell>
                        <TableCell className="text-right">
                          {prop.management_fee ? formatCurrency(prop.management_fee) : '–'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <>
                    {/* Leere Zeile mit Platzhaltern */}
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate('/portal/immobilien/vorlage')}
                    >
                      <TableCell className="text-muted-foreground">–</TableCell>
                      <TableCell className="text-muted-foreground">–</TableCell>
                      <TableCell className="text-muted-foreground">–</TableCell>
                      <TableCell className="text-muted-foreground">–</TableCell>
                      <TableCell className="text-right text-muted-foreground">–</TableCell>
                      <TableCell className="text-muted-foreground">–</TableCell>
                      <TableCell className="text-right text-muted-foreground">–</TableCell>
                      <TableCell className="text-right text-muted-foreground">–</TableCell>
                      <TableCell className="text-right text-muted-foreground">–</TableCell>
                      <TableCell className="text-right text-muted-foreground">–</TableCell>
                      <TableCell className="text-right text-muted-foreground">–</TableCell>
                      <TableCell className="text-right text-muted-foreground">–</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-6">
                        <p className="text-muted-foreground mb-2">
                          Keine Immobilien vorhanden – Objekt anlegen oder Excel importieren
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" onClick={() => navigate('/portal/immobilien/neu')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Objekt anlegen
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate('/portal/immobilien/vorlage')}>
                            <Eye className="mr-2 h-4 w-4" />
                            Vorlage ansehen
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Aggregation Footer - IMMER sichtbar */}
          <div className="mt-4 pt-4 border-t grid grid-cols-5 md:grid-cols-12 gap-4 text-sm font-medium">
            <div className="col-span-2 md:col-span-4">
              Σ {hasData ? totals?.count || 0 : 0} Objekte
            </div>
            <div className="text-right">
              {hasData ? (totals?.totalArea.toLocaleString('de-DE') || '0') : '–'} qm
            </div>
            <div className="text-right md:col-span-2">
              {hasData && totals?.totalIncome ? formatCurrency(totals.totalIncome) : '–'}
            </div>
            <div className="text-right">
              {hasData && totals?.totalValue ? formatCurrency(totals.totalValue) : '–'}
            </div>
            <div className="text-right text-destructive">
              {hasData && totals?.totalDebt ? formatCurrency(totals.totalDebt) : '–'}
            </div>
            <div className="text-right">
              {hasData && totals?.totalRate ? formatCurrency(totals.totalRate) : '–'}
            </div>
            <div className="col-span-2"></div>
          </div>
        </CardContent>
      </Card>

      {/* EÜR - Einnahmenüberschussrechnung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Einnahmenüberschussrechnung (EÜR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <EurRow label="Einnahmen (jährlich)" value={hasData && eur ? formatCurrency(eur.annualIncome) : '–'} />
            <EurRow label="./. Zinsbelastung" value={hasData && eur ? formatCurrency(eur.annualInterest) : '–'} negative />
            <EurRow label="./. Nicht-umlagefähige NK" value={hasData && eur ? formatCurrency(eur.nonRecoverableNk) : '–'} negative />
            <div className="border-t pt-2">
              <EurRow label="= Überschuss vor Tilgung" value={hasData && eur ? formatCurrency(eur.surplusBeforeAmort) : '–'} bold />
            </div>
            <EurRow label="./. Tilgung" value={hasData && eur ? formatCurrency(eur.annualAmort) : '–'} negative />
            <div className="border-t pt-2">
              <EurRow 
                label="= Überschuss nach Tilgung" 
                value={hasData && eur ? formatCurrency(eur.surplusAfterAmort) : '–'} 
                bold 
                highlight={hasData && eur && eur.surplusAfterAmort > 0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ExcelImportDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog}
        tenantId={activeOrganization?.id || ''}
      />
    </div>
  );
}

function EurRow({ 
  label, 
  value, 
  negative = false, 
  bold = false,
  highlight = false 
}: { 
  label: string; 
  value: string; 
  negative?: boolean;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-semibold' : ''}`}>
      <span className={negative ? 'text-muted-foreground' : ''}>{label}</span>
      <span className={`text-right ${highlight ? 'text-green-600' : ''} ${negative ? 'text-muted-foreground' : ''}`}>
        {value}
      </span>
    </div>
  );
}
