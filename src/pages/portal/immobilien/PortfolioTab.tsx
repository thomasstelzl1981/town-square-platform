import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/ui/chart-card';
import { FileUploader, SubTabNav } from '@/components/shared';
import { 
  PropertyTable, 
  PropertyCodeCell, 
  PropertyCurrencyCell,
  PropertyAddressCell,
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
import { CreatePropertyDialog } from '@/components/portfolio/CreatePropertyDialog';

interface LandlordContext {
  id: string;
  name: string;
  context_type: string;
  is_default: boolean | null;
}

// Unit-based data structure with ANNUAL values (p.a.)
interface UnitWithProperty {
  id: string;
  unit_number: string | null;
  area_sqm: number | null;
  property_id: string;
  property_code: string | null;
  property_type: string;
  address: string;
  city: string;
  postal_code: string | null;
  market_value: number | null;
  // ANNUAL VALUES (p.a.) - converted from monthly
  annual_net_cold_rent: number; // Jahresnettokaltmiete (sum of all active leases * 12)
  annuity_pa: number; // Annuität p.a.
  interest_pa: number; // Zins p.a.
  amortization_pa: number; // Tilgung p.a.
  financing_balance: number | null; // Restschuld
  // Tenant info
  tenant_name: string | null;
  leases_count: number; // Number of active leases
}

// SSOT: Loan data from loans table (replaces property_financing for seed data)
interface LoanData {
  id: string;
  property_id: string;
  outstanding_balance_eur: number | null;
  annuity_monthly_eur: number | null;
  interest_rate_percent: number | null;
}

interface LeaseData {
  unit_id: string;
  monthly_rent: number | null;
  rent_cold_eur: number | null;
  status: string;
  contacts: {
    first_name: string;
    last_name: string;
    company: string | null;
  } | null;
}

export function PortfolioTab() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeOrganization, activeTenantId } = useAuth();
  const [showImportDialog, setShowImportDialog] = useState(false);
  // Auto-open create dialog if ?create=1 is present
  const [showCreateDialog, setShowCreateDialog] = useState(() => searchParams.get('create') === '1');
  
  // FIX: Clear the create param via useEffect (not useState side-effect)
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  // Get selected context from URL
  const selectedContextId = searchParams.get('context');

  // Fetch landlord contexts for multi-context subbar
  const { data: contexts = [] } = useQuery({
    queryKey: ['landlord-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_contexts')
        .select('id, name, context_type, is_default')
        .eq('tenant_id', activeTenantId!)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as LandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  // Build context tabs for SubTabNav (only if multiple contexts)
  const contextTabs = useMemo(() => {
    if (contexts.length <= 1) return [];
    return [
      { title: 'Alle Kontexte', route: '/portal/immobilien/portfolio' },
      ...contexts.map(ctx => ({
        title: ctx.name,
        route: `/portal/immobilien/portfolio?context=${ctx.id}`,
      })),
    ];
  }, [contexts]);

  // Fetch context_property_assignment for filtering
  const { data: contextAssignments = [] } = useQuery({
    queryKey: ['context-property-assignments', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('context_property_assignment')
        .select('context_id, property_id')
        .eq('tenant_id', activeTenantId!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId && contexts.length > 1,
  });

  // Fetch UNITS with properties, leases (multi!), and financing from LOANS (SSOT)
  const { data: unitsWithProperties, isLoading: unitsLoading } = useQuery({
    queryKey: ['portfolio-units-annual', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      
      // Get units with property data - USE activeTenantId for consistent tenant scoping
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select(`
          id,
          unit_number,
          area_sqm,
          current_monthly_rent,
          usage_type,
          property_id,
          properties!inner (
            id,
            code,
            property_type,
            address,
            city,
            postal_code,
            market_value,
            annual_income,
            status
          )
        `)
        .eq('tenant_id', activeTenantId)
        .eq('properties.status', 'active');

      if (unitsError) {
        console.error('Portfolio units query error:', unitsError);
        throw unitsError;
      }

      // Get ALL active leases for multi-lease aggregation
      const { data: leases } = await supabase
        .from('leases')
        .select(`
          unit_id,
          monthly_rent,
          rent_cold_eur,
          status,
          contacts!leases_contact_fk (
            first_name,
            last_name,
            company
          )
        `)
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active');

      // SSOT FIX: Get financing data from LOANS table (not property_financing!)
      // Note: Using explicit fetch to avoid TS2589 type recursion issue with Supabase client
      let loans: LoanData[] = [];
      try {
        // P0-FIX: Removed .eq('is_active', true) — loans table has no such column
        const { data: loansResult, error: loansError } = await (supabase as any)
          .from('loans')
          .select('id, property_id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
          .eq('tenant_id', activeTenantId);
        
        if (loansError) {
          console.warn('Loans query error (non-fatal):', loansError);
        } else if (loansResult) {
          loans = loansResult as LoanData[];
        }
      } catch (err) {
        console.warn('Loans query failed:', err);
      }

      // Build multi-lease map: unit_id -> { leases[], totalRent, tenantName }
      const leaseMap = new Map<string, { 
        leases: LeaseData[]; 
        totalMonthlyRent: number; 
        primaryTenantName: string | null;
      }>();
      
      leases?.forEach(l => {
        const existing = leaseMap.get(l.unit_id) || { 
          leases: [], 
          totalMonthlyRent: 0, 
          primaryTenantName: null 
        };
        
        const monthlyRent = l.rent_cold_eur || l.monthly_rent || 0;
        existing.leases.push(l as LeaseData);
        existing.totalMonthlyRent += monthlyRent;
        
        // Set primary tenant name from first lease
        if (!existing.primaryTenantName && l.contacts) {
          const contact = l.contacts as any;
          existing.primaryTenantName = contact.company || 
            `${contact.first_name} ${contact.last_name}`.trim();
        }
        
        leaseMap.set(l.unit_id, existing);
      });

      // SSOT: Build loan map from loans table (property_id -> latest loan)
      const loanMap = new Map<string, LoanData>();
      loans?.forEach(loan => {
        // Use latest/first active loan per property
        if (!loanMap.has(loan.property_id)) {
          loanMap.set(loan.property_id, loan);
        }
      });

      // Transform to flat structure with ANNUAL values
      return units?.map(u => {
        const prop = u.properties as any;
        const loan = loanMap.get(prop.id);
        const leaseInfo = leaseMap.get(u.id);
        
        // Calculate ANNUAL values
        const totalMonthlyRent = leaseInfo?.totalMonthlyRent || u.current_monthly_rent || 0;
        const annualNetColdRent = totalMonthlyRent * 12;
        
        // SSOT: Use loans table data
        const balance = loan?.outstanding_balance_eur || 0;
        const monthlyAnnuity = loan?.annuity_monthly_eur || 0;
        const interestRate = (loan?.interest_rate_percent || 0) / 100;
        
        const annuityPa = monthlyAnnuity * 12;
        const interestPa = balance * interestRate;
        const amortizationPa = annuityPa - interestPa;
        
        // Tenant name with multi-lease indicator
        let tenantName = leaseInfo?.primaryTenantName || null;
        const leasesCount = leaseInfo?.leases.length || 0;
        if (leasesCount > 1 && tenantName) {
          tenantName = `${tenantName} (+${leasesCount - 1})`;
        }

        return {
          id: u.id,
          unit_number: u.unit_number,
          area_sqm: u.area_sqm,
          property_id: prop.id,
          property_code: prop.code,
          property_type: prop.property_type,
          address: prop.address,
          city: prop.city,
          postal_code: prop.postal_code,
          market_value: prop.market_value,
          // ANNUAL VALUES from LOANS
          annual_net_cold_rent: annualNetColdRent,
          annuity_pa: annuityPa,
          interest_pa: interestPa,
          amortization_pa: amortizationPa,
          financing_balance: loan?.outstanding_balance_eur || null,
          tenant_name: tenantName,
          leases_count: leasesCount,
        } as UnitWithProperty;
      }) || [];
    },
    enabled: !!activeTenantId,
  });

  // SSOT: Fetch loans for aggregations (not property_financing)
  const { data: loansData } = useQuery({
    queryKey: ['portfolio-loans', activeTenantId],
    queryFn: async (): Promise<LoanData[]> => {
      if (!activeTenantId) return [];
      // P0-FIX: Removed .eq('is_active', true) — loans table has no such column
      const { data, error } = await (supabase as any)
        .from('loans')
        .select('id, property_id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
        .eq('tenant_id', activeTenantId);
      
      if (error) {
        console.warn('Loans aggregation query error:', error);
        return [];
      }
      return (data || []) as LoanData[];
    },
    enabled: !!activeTenantId,
  });

  // Filter units by selected context
  const filteredUnits = useMemo(() => {
    if (!unitsWithProperties) return [];
    if (!selectedContextId || contexts.length <= 1) return unitsWithProperties;
    
    // Get property IDs assigned to selected context
    const assignedPropertyIds = contextAssignments
      .filter(a => a.context_id === selectedContextId)
      .map(a => a.property_id);
    
    // If no assignments exist for this context, show all (default context behavior)
    if (assignedPropertyIds.length === 0) {
      const defaultContext = contexts.find(c => c.is_default);
      if (selectedContextId === defaultContext?.id) {
        const allAssignedIds = contextAssignments.map(a => a.property_id);
        return unitsWithProperties.filter(u => !allAssignedIds.includes(u.property_id));
      }
      return [];
    }
    
    return unitsWithProperties.filter(u => assignedPropertyIds.includes(u.property_id));
  }, [unitsWithProperties, selectedContextId, contextAssignments, contexts]);

  // Calculate aggregations with ANNUAL values (using loans SSOT)
  const totals = useMemo(() => {
    const unitsToUse = selectedContextId ? filteredUnits : (unitsWithProperties || []);
    if (!unitsToUse || unitsToUse.length === 0) return null;

    // Get unique properties
    const uniquePropertyIds = [...new Set(unitsToUse.map(u => u.property_id))];
    // SSOT: Use loans data for financing aggregations
    const relevantLoans = loansData?.filter(l => uniquePropertyIds.includes(l.property_id)) || [];

    const unitCount = unitsToUse.length;
    const propertyCount = uniquePropertyIds.length;
    const totalArea = unitsToUse.reduce((sum, u) => sum + (u.area_sqm || 0), 0);
    
    // Get unique property values
    const propertyValues = new Map<string, number>();
    unitsToUse.forEach(u => {
      if (u.market_value && !propertyValues.has(u.property_id)) {
        propertyValues.set(u.property_id, u.market_value);
      }
    });
    const totalValue = Array.from(propertyValues.values()).reduce((a, b) => a + b, 0);
    
    // ANNUAL income (already annual in new structure)
    const totalIncome = unitsToUse.reduce((sum, u) => sum + (u.annual_net_cold_rent || 0), 0);
    // SSOT: Use loans for debt calculation
    const totalDebt = relevantLoans.reduce((sum, l) => sum + (l.outstanding_balance_eur || 0), 0);
    const totalAnnuity = unitsToUse.reduce((sum, u) => sum + (u.annuity_pa || 0), 0);
    const avgInterestRate = relevantLoans.length 
      ? relevantLoans.reduce((sum, l) => sum + (l.interest_rate_percent || 0), 0) / relevantLoans.length 
      : 0;
    const netWealth = totalValue - totalDebt;
    const avgYield = totalValue > 0 ? (totalIncome / totalValue) * 100 : 0;

    return { 
      unitCount, 
      propertyCount, 
      totalArea, 
      totalValue, 
      totalIncome, 
      totalDebt, 
      totalAnnuity, 
      netWealth, 
      avgYield, 
      avgInterestRate 
    };
  }, [unitsWithProperties, filteredUnits, selectedContextId, loansData]);

  // Tilgungsverlauf Chart Data (30 Jahre Projektion)
  const amortizationData = useMemo(() => {
    if (!totals || totals.totalDebt === 0) return [];
    
    const years = [];
    let debt = totals.totalDebt;
    let equity = totals.totalValue - totals.totalDebt;
    const annualPayment = totals.totalAnnuity;
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

  // EÜR Chart Data (Einnahmenüberschussrechnung) - ANNUAL (using loans SSOT)
  const eurChartData = useMemo(() => {
    if (!totals) return [];
    
    const annualIncome = totals.totalIncome;
    // SSOT: Calculate interest from loans data
    const annualInterest = loansData?.reduce((sum, l) => {
      const balance = l.outstanding_balance_eur || 0;
      const rate = (l.interest_rate_percent || 0) / 100;
      return sum + (balance * rate);
    }, 0) || 0;
    const nonRecoverableNk = totals.totalValue * 0.005;
    const annualAmort = totals.totalAnnuity - annualInterest;
    const surplus = annualIncome - annualInterest - nonRecoverableNk;
    
    return [
      { name: 'Mieteinnahmen p.a.', value: Math.round(annualIncome), type: 'income', fill: 'hsl(var(--chart-1))' },
      { name: 'Zinskosten p.a.', value: -Math.round(annualInterest), type: 'expense', fill: 'hsl(var(--chart-2))' },
      { name: 'Nicht umlf. NK', value: -Math.round(nonRecoverableNk), type: 'expense', fill: 'hsl(var(--chart-3))' },
      { name: 'Tilgung p.a.', value: -Math.round(annualAmort), type: 'expense', fill: 'hsl(var(--chart-4))' },
      { name: 'Überschuss p.a.', value: Math.round(surplus), type: 'result', fill: surplus >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))' },
    ];
  }, [totals, loansData]);

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

  const displayUnits = selectedContextId ? filteredUnits : (unitsWithProperties || []);
  const hasData = displayUnits.length > 0;

  // Table columns with ANNUAL values (p.a.)
  const columns: PropertyTableColumn<UnitWithProperty>[] = [
    { 
      key: 'property_code', 
      header: 'Code', 
      width: '80px',
      render: (value) => <PropertyCodeCell code={value} />
    },
    { 
      key: 'property_type', 
      header: 'Art',
      render: (value) => <Badge variant="outline" className="text-xs">{value}</Badge>
    },
    { 
      key: 'address', 
      header: 'Objekt', 
      minWidth: '200px',
      render: (_, row) => <PropertyAddressCell address={row.address} subtitle={row.city} />
    },
    { 
      key: 'unit_number', 
      header: 'Einheit',
      render: (value) => <span className="text-xs text-muted-foreground">{value || 'MAIN'}</span>
    },
    { 
      key: 'area_sqm', 
      header: 'm²', 
      align: 'right',
      render: (value) => value?.toLocaleString('de-DE') || '–'
    },
    { 
      key: 'tenant_name', 
      header: 'Mieter',
      render: (value, row) => value ? (
        <span className="truncate max-w-[150px] block" title={value}>
          {value}
          {row.leases_count > 1 && (
            <Badge variant="outline" className="ml-1 text-xs">{row.leases_count}</Badge>
          )}
        </span>
      ) : <span className="text-muted-foreground">—</span>
    },
    { 
      key: 'annual_net_cold_rent', 
      header: 'Miete p.a.', 
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
      key: 'financing_balance', 
      header: 'Restschuld', 
      align: 'right',
      render: (value) => <PropertyCurrencyCell value={value} variant="destructive" />
    },
    { 
      key: 'annuity_pa', 
      header: 'Annuität p.a.', 
      align: 'right',
      render: (value) => <PropertyCurrencyCell value={value} />
    },
    { 
      key: 'interest_pa', 
      header: 'Zins p.a.', 
      align: 'right',
      render: (value) => <PropertyCurrencyCell value={value} variant="muted" />
    },
    { 
      key: 'amortization_pa', 
      header: 'Tilgung p.a.', 
      align: 'right',
      render: (value) => <PropertyCurrencyCell value={value} variant="muted" />
    },
  ];

  if (unitsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Subbar - only shown if multiple contexts exist */}
      {contextTabs.length > 0 && (
        <SubTabNav tabs={contextTabs} />
      )}

      {/* Header mit Neue Immobilie Button */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Immobilie anlegen
        </Button>
      </div>

      {/* KPI Cards - IMMER sichtbar, ANNUAL values */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Einheiten"
          value={hasData ? (totals?.unitCount.toString() || '0') : '0'}
          icon={Building2}
          subtitle={hasData ? `${totals?.propertyCount} Objekte` : undefined}
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
        <ChartCard title="Einnahmenüberschussrechnung (EÜR) p.a.">
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
                  width={120} 
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

      {/* Units Table using PropertyTable Master Component */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Immobilienportfolio (Jahreswerte)</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyTable
            data={displayUnits}
            columns={columns}
            isLoading={unitsLoading}
            showSearch
            searchPlaceholder="Nach Adresse, Code oder Mieter suchen..."
            searchFilter={(row, search) => 
              row.address.toLowerCase().includes(search) ||
              row.city.toLowerCase().includes(search) ||
              (row.property_code && row.property_code.toLowerCase().includes(search)) ||
              (row.tenant_name && row.tenant_name.toLowerCase().includes(search))
            }
            onRowClick={(row) => navigate(`/portal/immobilien/${row.property_id}`)}
            rowActions={(row) => (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/portal/immobilien/${row.property_id}`);
                }}
                title="Immobilienakte öffnen"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            emptyState={{
              message: 'Noch keine Einheiten im Portfolio. Beginnen Sie mit dem ersten Objekt.',
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

      {/* Create Property Dialog */}
      <CreatePropertyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
