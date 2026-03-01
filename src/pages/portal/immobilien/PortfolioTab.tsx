import { useState, useMemo, useCallback, useEffect } from 'react';
// Force rebuild — chunk cache fix
import { DEMO_PROPERTY_IDS } from '@/config/tenantConstants';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/ui/chart-card';
import { FileUploader } from '@/components/shared';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { 
  PropertyTable, 
  PropertyCodeCell, 
  PropertyCurrencyCell,
  PropertyAddressCell,
  type PropertyTableColumn 
} from '@/components/shared/PropertyTable';
import { 
  Loader2, Building2, TrendingUp, Wallet, PiggyBank, 
  Plus, Upload, Trash2, Calculator, Table2, ChevronDown, Landmark, Download, Pencil
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend, Area, ComposedChart 
} from 'recharts';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { ExcelImportDialog } from '@/components/portfolio/ExcelImportDialog';
import { CreatePropertyDialog } from '@/components/portfolio/CreatePropertyDialog';
import { PortfolioSummaryModal } from '@/components/portfolio/PortfolioSummaryModal';
import { CreateContextDialog } from '@/components/shared/CreateContextDialog';
import { PropertyContextAssigner } from '@/components/shared/PropertyContextAssigner';
import { DesktopOnly } from '@/components/shared/DesktopOnly';
import { generatePortfolioTemplate } from '@/lib/generatePortfolioTemplate';

interface LandlordContext {
  id: string;
  name: string;
  context_type: string;
  is_default: boolean | null;
  tax_regime: string | null;
  tax_rate_percent: number | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  hrb_number: string | null;
  ust_id: string | null;
  legal_form: string | null;
  managing_director: string | null;
  taxable_income_yearly?: number | null;
  tax_assessment_type?: string | null;
  church_tax?: boolean | null;
  children_count?: number | null;
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
  const { isEnabled, toggle } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PORTFOLIO');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeOrganization, activeTenantId } = useAuth();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAllYears, setShowAllYears] = useState(false);
  // Auto-open create dialog if ?create=1 is present
  const [showCreateDialog, setShowCreateDialog] = useState(() => searchParams.get('create') === '1');
  const [showCreateContextDialog, setShowCreateContextDialog] = useState(false);
  const [editContext, setEditContext] = useState<LandlordContext | null>(null);
  const [showLoanRerunDialog, setShowLoanRerunDialog] = useState(false);
  const [pendingLoanExcelFile, setPendingLoanExcelFile] = useState<File | null>(null);
  const [assignContextId, setAssignContextId] = useState<string | null>(null);
  const [assignContextName, setAssignContextName] = useState('');
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDeleteProperty = async (propertyId: string) => {
    setIsDeleting(true);
    try {
      // Cascade delete: storage_nodes → loans → context_assignments → leases → units → property
      await supabase.from('storage_nodes').delete().eq('property_id', propertyId);
      await supabase.from('loans').delete().eq('property_id', propertyId);
      await supabase.from('context_property_assignment').delete().eq('property_id', propertyId);
      
      // Get units to delete leases
      const { data: units } = await supabase.from('units').select('id').eq('property_id', propertyId);
      if (units?.length) {
        const unitIds = units.map(u => u.id);
        await supabase.from('leases').delete().in('unit_id', unitIds);
      }
      await supabase.from('units').delete().eq('property_id', propertyId);
      await supabase.from('properties').delete().eq('id', propertyId);

      toast.success('Immobilie und zugehörige Daten gelöscht');
      queryClient.invalidateQueries({ queryKey: ['portfolio-units-annual'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-loans'] });
      queryClient.invalidateQueries({ queryKey: ['context-property-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    } catch (err) {
      console.error('Delete property error:', err);
      toast.error('Fehler beim Löschen der Immobilie');
    } finally {
      setIsDeleting(false);
      setDeletePropertyId(null);
    }
  };
  
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
        .select('id, name, context_type, is_default, tax_regime, tax_rate_percent, street, house_number, postal_code, city, hrb_number, ust_id, legal_form, managing_director, taxable_income_yearly, tax_assessment_type, church_tax, children_count')
        .eq('tenant_id', activeTenantId!)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as LandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  // Removed: contextTabs for SubTabNav - now using Dropdown instead

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
    enabled: !!activeTenantId && contexts.length > 0,
  });

  // Fetch UNITS with properties, leases (multi!), and financing from LOANS (SSOT)
  const { data: unitsWithProperties, isLoading: unitsLoading } = useQuery({
    queryKey: ['portfolio-units-annual', activeTenantId, demoEnabled],
    queryFn: async () => {
      if (!activeTenantId) return [];
      
      // Get units with property data - USE activeTenantId for consistent tenant scoping
      const unitsQuery = supabase
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
            status,
            is_demo
          )
        `)
        .eq('tenant_id', activeTenantId)
        .eq('properties.status', 'active');
      
      const { data: units, error: unitsError } = await unitsQuery;

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
        const loansQuery = (supabase as any)
          .from('loans')
          .select('id, property_id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
          .eq('tenant_id', activeTenantId);
        
        const { data: loansResult, error: loansError } = await loansQuery;
        
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

      // Post-fetch filter: remove demo properties when demo is off
      let filteredUnitsData = units || [];
      if (!demoEnabled) {
        filteredUnitsData = filteredUnitsData.filter(u => !(u.properties as any)?.is_demo);
      }

      // Also filter loans post-fetch
      if (!demoEnabled) {
        const demoPropertyIds = new Set(
          filteredUnitsData.length === (units?.length || 0) ? [] :
          (units || []).filter(u => (u.properties as any)?.is_demo).map(u => (u.properties as any)?.id)
        );
        // Remove loans for demo properties
        const demoPropIds = (units || [])
          .filter(u => (u.properties as any)?.is_demo)
          .map(u => (u.properties as any)?.id);
        loans = loans.filter(l => !demoPropIds.includes(l.property_id));
      }

      // Transform to flat structure with ANNUAL values
      return filteredUnitsData.map(u => {
        const prop = u.properties as any;
        const loan = loanMap.get(prop.id);
        const leaseInfo = leaseMap.get(u.id);
        
        // Calculate ANNUAL values — Fallback chain: Leases → unit.current_monthly_rent → property.annual_income
        const totalMonthlyRent = leaseInfo?.totalMonthlyRent || u.current_monthly_rent || 0;
        const annualNetColdRent = totalMonthlyRent * 12 || prop.annual_income || 0;
        
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
      });
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

  // Tilgungsverlauf Chart Data (30 Jahre Projektion) — korrigiert mit objektwert/vermoegen
  const amortizationData = useMemo(() => {
    if (!totals || totals.totalDebt <= 0) return [];
    
    const appreciationRate = 0.02; // 2% Wertzuwachs p.a.
    const years = [];
    let currentDebt = totals.totalDebt;
    let currentValue = totals.totalValue;
    const annuity = totals.totalAnnuity;
    const interestRate = totals.avgInterestRate / 100;
    
    for (let year = 0; year <= 30; year++) {
      const wealth = currentValue - currentDebt;
      
      years.push({ 
        year: 2026 + year, 
        objektwert: Math.round(currentValue),     // Verkehrswert (steigend)
        restschuld: Math.max(0, Math.round(currentDebt)),  // Restschuld (fallend)
        vermoegen: Math.round(wealth)             // Netto-Vermögen (Differenz)
      });
      
      // Nächstes Jahr berechnen
      const interest = currentDebt * interestRate;
      const amortization = Math.min(annuity - interest, currentDebt);
      currentDebt = Math.max(0, currentDebt - amortization);
      currentValue = currentValue * (1 + appreciationRate);
    }
    return years;
  }, [totals]);

  // Extended projection data for the 10-year table
  const projectionData = useMemo(() => {
    if (!totals || totals.totalDebt <= 0) return [];
    
    const appreciationRate = 0.02; // 2% Wertzuwachs p.a.
    const rentGrowthRate = 0.015; // 1.5% Mietsteigerung p.a.
    const years: Array<{
      year: number;
      rent: number;
      interest: number;
      amortization: number;
      objektwert: number;
      restschuld: number;
      vermoegen: number;
    }> = [];
    
    let currentDebt = totals.totalDebt;
    let currentValue = totals.totalValue;
    let currentRent = totals.totalIncome;
    const annuity = totals.totalAnnuity;
    const interestRate = totals.avgInterestRate / 100;
    
    for (let year = 0; year <= 30; year++) {
      const interest = currentDebt * interestRate;
      const amortization = Math.min(annuity - interest, currentDebt);
      const wealth = currentValue - currentDebt;
      
      years.push({ 
        year: 2026 + year, 
        rent: Math.round(currentRent),
        interest: Math.round(interest),
        amortization: Math.round(amortization),
        objektwert: Math.round(currentValue),
        restschuld: Math.max(0, Math.round(currentDebt)),
        vermoegen: Math.round(wealth)
      });
      
      currentDebt = Math.max(0, currentDebt - amortization);
      currentValue = currentValue * (1 + appreciationRate);
      currentRent = currentRent * (1 + rentGrowthRate);
    }
    return years;
  }, [totals]);

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

  // Handle Excel import — store selected file for passthrough
  const [pendingExcelFile, setPendingExcelFile] = useState<File | null>(null);

  const handleExcelFile = async (files: File[]) => {
    if (files.length > 0) {
      setPendingExcelFile(files[0]);
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
      render: (value) => <Badge variant="outline" className="text-sm">{value}</Badge>
    },
    { 
      key: 'address', 
      header: 'Objekt', 
      minWidth: '180px',
      render: (value) => value || '–'
    },
    { 
      key: 'city', 
      header: 'Ort',
      render: (value) => value || '–'
    },
    { 
      key: 'unit_number', 
      header: 'Einheit',
      render: (value) => <span className="text-sm text-muted-foreground">{value || 'MAIN'}</span>
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
  
  ];

  // Count properties per context for display - MOVED BEFORE EARLY RETURN
  const propertyCountByContext = useMemo(() => {
    const counts: Record<string, number> = {};
    contextAssignments.forEach(a => {
      counts[a.context_id] = (counts[a.context_id] || 0) + 1;
    });
    return counts;
  }, [contextAssignments]);

  const totalPropertyCount = useMemo(() => {
    return [...new Set(unitsWithProperties?.map(u => u.property_id) || [])].length;
  }, [unitsWithProperties]);

  // Per-context KPI aggregation for widget cards
  const contextKpis = useMemo(() => {
    if (!unitsWithProperties) return new Map<string, { propertyCount: number; totalValue: number; avgYield: number }>();
    
    const kpis = new Map<string, { propertyCount: number; totalValue: number; avgYield: number }>();
    
    contexts.forEach(ctx => {
      const assignedPropertyIds = contextAssignments
        .filter(a => a.context_id === ctx.id)
        .map(a => a.property_id);
      
      let ctxUnits: UnitWithProperty[];
      if (assignedPropertyIds.length === 0 && ctx.is_default) {
        const allAssignedIds = contextAssignments.map(a => a.property_id);
        ctxUnits = unitsWithProperties.filter(u => !allAssignedIds.includes(u.property_id));
      } else {
        ctxUnits = unitsWithProperties.filter(u => assignedPropertyIds.includes(u.property_id));
      }
      
      const uniqueProps = [...new Set(ctxUnits.map(u => u.property_id))];
      const propValues = new Map<string, number>();
      ctxUnits.forEach(u => {
        if (u.market_value && !propValues.has(u.property_id)) propValues.set(u.property_id, u.market_value);
      });
      const totalValue = Array.from(propValues.values()).reduce((a, b) => a + b, 0);
      const totalIncome = ctxUnits.reduce((sum, u) => sum + (u.annual_net_cold_rent || 0), 0);
      const avgYield = totalValue > 0 ? (totalIncome / totalValue) * 100 : 0;
      
      kpis.set(ctx.id, { propertyCount: uniqueProps.length, totalValue, avgYield });
    });
    
    return kpis;
  }, [unitsWithProperties, contexts, contextAssignments]);

  const selectedContext = contexts.find(c => c.id === selectedContextId);

  const handleContextSelect = useCallback((contextId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (contextId) {
      newParams.set('context', contextId);
    } else {
      newParams.delete('context');
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);


  if (unitsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader title="Portfolio" description="Übersicht und Verwaltung deiner Immobilien und Einheiten" />
      {/* Portfolio Context Widgets — WidgetGrid (IMMER sichtbar) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Vermietereinheiten</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowCreateContextDialog(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <WidgetGrid variant="widget">
          {/* Demo Widget — Position 0, nur sichtbar wenn Demo aktiv */}
          {demoEnabled && (
          <WidgetCell>
            <button
              onClick={() => {
                navigate(`/portal/immobilien/${DEMO_PROPERTY_IDS[0]}`);
              }}
              className={cn(
                "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
                DESIGN.DEMO_WIDGET.CARD,
                DESIGN.DEMO_WIDGET.HOVER,
                "ring-2 ring-emerald-400 border-emerald-400 shadow-sm"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={cn(DESIGN.DEMO_WIDGET.BADGE, "text-[10px]")}>Demo</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-sm">Familie Mustermann</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Berlin, München, Hamburg</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className={DESIGN.TYPOGRAPHY.LABEL}>Einheiten</span>
                  <span className="text-sm font-semibold">{totalPropertyCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={DESIGN.TYPOGRAPHY.LABEL}>Verkehrswert</span>
                  <span className="text-sm font-semibold">{totals?.totalValue ? formatCurrency(totals.totalValue) : '–'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={DESIGN.TYPOGRAPHY.LABEL}>Restschuld</span>
                  <span className="text-sm font-semibold">{totals?.totalDebt != null ? formatCurrency(totals.totalDebt) : '–'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={DESIGN.TYPOGRAPHY.LABEL}>Nettovermögen</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{totals?.totalValue && totals?.totalDebt != null ? formatCurrency(totals.totalValue - totals.totalDebt) : '–'}</span>
                </div>
              </div>
            </button>
          </WidgetCell>
          )}
            {/* Widget 1: Alle Immobilien */}
            <WidgetCell>
              <button
                onClick={() => handleContextSelect(null)}
                className={cn(
                  "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
                  DESIGN.CARD.BASE,
                  !selectedContextId 
                    ? "ring-2 ring-primary border-primary shadow-sm" 
                    : "hover:border-primary/50 hover:shadow-md"
                )}
              >
                <div>
                  <WidgetHeader icon={Building2} title="Alle Immobilien" />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={DESIGN.TYPOGRAPHY.LABEL}>Objekte</span>
                      <span className="text-sm font-semibold">{totalPropertyCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={DESIGN.TYPOGRAPHY.LABEL}>Verkehrswert</span>
                      <span className="text-sm font-semibold">
                        {totals?.totalValue ? formatCurrency(totals.totalValue) : '–'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={DESIGN.TYPOGRAPHY.LABEL}>Ø Rendite</span>
                      <span className="text-sm font-semibold">
                        {totals?.avgYield ? `${totals.avgYield.toFixed(1)}%` : '–'}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit text-xs mt-3">Gesamtportfolio</Badge>
              </button>
            </WidgetCell>

            {/* Dynamic Context Widgets */}
            {contexts.filter(ctx => demoEnabled || !isDemoId(ctx.id)).map(ctx => {
              const kpi = contextKpis.get(ctx.id);
              const isActive = selectedContextId === ctx.id;
              return (
                <WidgetCell key={ctx.id}>
                  <button
                    onClick={() => handleContextSelect(ctx.id)}
                    className={cn(
                      "w-full h-full flex flex-col justify-between p-5 rounded-xl border text-left transition-all",
                      DESIGN.CARD.BASE,
                      isActive 
                        ? "ring-2 ring-primary border-primary shadow-sm" 
                        : "hover:border-primary/50 hover:shadow-md"
                    )}
                  >
                    <div>
                      <WidgetHeader 
                        icon={Building2} 
                        title={ctx.name} 
                      />
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={DESIGN.TYPOGRAPHY.LABEL}>Objekte</span>
                          <span className="text-sm font-semibold">{kpi?.propertyCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={DESIGN.TYPOGRAPHY.LABEL}>Verkehrswert</span>
                          <span className="text-sm font-semibold">
                            {kpi?.totalValue ? formatCurrency(kpi.totalValue) : '–'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={DESIGN.TYPOGRAPHY.LABEL}>Ø Rendite</span>
                          <span className="text-sm font-semibold">
                            {kpi?.avgYield ? `${kpi.avgYield.toFixed(1)}%` : '–'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge 
                        variant={ctx.context_type === 'PRIVATE' ? 'secondary' : 'default'} 
                        className="w-fit text-xs"
                      >
                        {ctx.context_type === 'PRIVATE' ? 'Privat' : 'Geschäftlich'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditContext(ctx);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssignContextId(ctx.id);
                          setAssignContextName(ctx.name);
                        }}
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        Zuordnen
                      </Button>
                    </div>
                  </button>
                </WidgetCell>
              );
            })}

          </WidgetGrid>
        </div>


      {/* CreateContextDialog */}
      <CreateContextDialog 
        open={showCreateContextDialog || !!editContext} 
        onOpenChange={(open) => {
          if (!open) { setShowCreateContextDialog(false); setEditContext(null); }
        }}
        editContext={editContext}
      />

      {/* PropertyContextAssigner — Objekte einer VE zuordnen */}
      {assignContextId && (
        <PropertyContextAssigner
          open={!!assignContextId}
          onOpenChange={(open) => { if (!open) setAssignContextId(null); }}
          contextId={assignContextId}
          contextName={assignContextName}
        />
      )}

      {/* Updated Portfolio Header - shows selected context name */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Immobilienportfolio{selectedContext ? ` — ${selectedContext.name}` : ''}
        </h2>
      </div>

      {/* KPI Cards - IMMER sichtbar, ANNUAL values */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <StatCard
          title="Einheiten"
          value={hasData ? (totals?.unitCount.toString() || '0') : '0'}
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
      </div>

      {/* Charts: Tilgungsverlauf & Monatliche EÜR */}
      <div className={DESIGN.FORM_GRID.FULL}>
        {/* Tilgungsverlauf über 30 Jahre — korrigiert mit objektwert/vermoegen */}
        <ChartCard title="Vermögensentwicklung (30 Jahre)" aspectRatio="none">
          {hasData && amortizationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={amortizationData}>
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
                {/* Objektwert als äußere Fläche (hellblau) - EXPLIZITE FARBEN */}
                <Area 
                  type="monotone" 
                  dataKey="objektwert" 
                  name="Objektwert"
                  stroke="hsl(210, 70%, 50%)"
                  fill="hsl(210, 70%, 50%)"
                  fillOpacity={0.15}
                />
                {/* Vermögen als innere Fläche (grün) - EXPLIZITE FARBEN */}
                <Area 
                  type="monotone" 
                  dataKey="vermoegen" 
                  name="Netto-Vermögen"
                  stroke="hsl(142, 70%, 45%)"
                  fill="hsl(142, 70%, 45%)"
                  fillOpacity={0.4}
                />
                {/* Restschuld als Linie (rot, fallend) — now ON TOP - EXPLIZITE FARBEN */}
                <Line 
                  type="monotone" 
                  dataKey="restschuld" 
                  name="Restschuld"
                  stroke="hsl(0, 70%, 50%)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
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

        {/* Monatliche EÜR-Übersicht als Zwei-Spalten-Layout */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monatliche Übersicht (EÜR)</CardTitle>
          </CardHeader>
          <CardContent>
            {hasData && totals ? (
              (() => {
                // Monatliche Werte berechnen
                const monthlyRent = totals.totalIncome / 12;
                const annualInterest = loansData?.reduce((sum, l) => {
                  const balance = l.outstanding_balance_eur || 0;
                  const rate = (l.interest_rate_percent || 0) / 100;
                  return sum + (balance * rate);
                }, 0) || 0;
                const monthlyInterest = annualInterest / 12;
                const monthlyAmortization = (totals.totalAnnuity - annualInterest) / 12;
                const monthlyNK = (totals.totalValue * 0.005) / 12; // 0.5% nicht umlagefähig p.a.
                
                // Steuervorteil (vereinfacht: 42% Grenzsteuersatz auf Zinsen + NK + AfA)
                const afaAnnual = totals.totalValue * 0.02; // 2% AfA
                const taxDeduction = (annualInterest + (totals.totalValue * 0.005) + afaAnnual) * 0.42;
                const monthlyTaxBenefit = taxDeduction / 12;
                
                const totalIncome = monthlyRent + monthlyTaxBenefit;
                const totalExpenses = monthlyInterest + monthlyAmortization + monthlyNK;
                const monthlyResult = totalIncome - totalExpenses;

                return (
                  <>
                    <div className="grid grid-cols-2 gap-8">
                      {/* Einnahmen */}
                      <div>
                        <h4 className="font-medium text-green-600 mb-3">Einnahmen</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Mieteinnahmen</span>
                            <span className="font-medium">{formatCurrency(monthlyRent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Steuervorteil</span>
                            <span className="font-medium">{formatCurrency(monthlyTaxBenefit)}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span>Summe</span>
                              <span className="text-green-600">{formatCurrency(totalIncome)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ausgaben */}
                      <div>
                        <h4 className="font-medium text-red-600 mb-3">Ausgaben</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Nicht umlf. NK</span>
                            <span className="font-medium text-red-600">-{formatCurrency(monthlyNK)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Zinsen</span>
                            <span className="font-medium text-red-600">-{formatCurrency(monthlyInterest)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tilgung</span>
                            <span className="font-medium text-red-600">-{formatCurrency(monthlyAmortization)}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span>Summe</span>
                              <span className="text-red-600">-{formatCurrency(totalExpenses)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ergebnis */}
                    <div className="mt-6 pt-4 border-t text-center">
                      <span className="text-muted-foreground">Monatliches Ergebnis: </span>
                      <span className={`text-lg font-bold ${monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthlyResult >= 0 ? '+' : ''}{formatCurrency(monthlyResult)}
                      </span>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>Keine Einnahmen-/Ausgabendaten vorhanden</p>
                  <p className="text-xs mt-1">Fügen Sie Immobilien mit Mieteinnahmen hinzu</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Excel Import Zone */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <FileUploader
            onFilesSelected={handleExcelFile}
            accept=".xlsx,.xls,.csv"
          >
            {(isDragOver: boolean) => (
              <div className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2',
                isDragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30'
              )}>
                <Upload className={cn('h-8 w-8 transition-colors', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
                <p className="text-sm font-medium">Portfolio-Excel zum Import hier ablegen</p>
                <p className="text-xs text-muted-foreground">oder klicken zum Auswählen · .xlsx, .xls, .csv</p>
              </div>
            )}
          </FileUploader>
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => generatePortfolioTemplate()}
            >
              <Download className="h-3.5 w-3.5" />
              Muster-Vorlage herunterladen
            </Button>
          </div>
          {/* Loan re-run button */}
          {hasData && (
            <div className="flex items-center justify-end">
              <FileUploader
                onFilesSelected={(files) => {
                  if (files.length > 0) {
                    setPendingLoanExcelFile(files[0]);
                    setShowLoanRerunDialog(true);
                  }
                }}
                accept=".xlsx,.xls,.csv"
              >
                {() => (
                  <Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild>
                    <span>
                      <Landmark className="h-4 w-4" />
                      Darlehen neu aus Excel auslesen
                    </span>
                  </Button>
                )}
              </FileUploader>
            </div>
          )}
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
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isDemoId(row.property_id) || isDeleting}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletePropertyId(row.property_id);
                }}
                title={isDemoId(row.property_id) ? 'Demo-Objekte können nicht gelöscht werden' : 'Immobilie löschen'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            emptyState={{
              message: 'Noch keine Einheiten im Portfolio. Beginnen Sie mit dem ersten Objekt.',
              actionLabel: 'Erste Immobilie anlegen',
              actionRoute: '/portal/immobilien/neu'
            }}
            headerActions={
              <DesktopOnly>
                <Button onClick={() => navigate('/portal/immobilien/neu')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Neu
                </Button>
              </DesktopOnly>
            }
          />
          
          {/* Summary Row - Summenzeile */}
          {hasData && totals && (
            <div 
              className="mt-4 p-4 rounded-lg bg-muted/50 border-t-2 border-primary/20 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => setShowSummaryModal(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Σ Portfolio-Summe</p>
                    <p className="text-xs text-muted-foreground">
                      {totals.propertyCount} Objekt(e), {totals.unitCount} Einheit(en)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(totals.totalIncome)}</p>
                    <p className="text-xs text-muted-foreground">Miete p.a.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(totals.totalValue)}</p>
                    <p className="text-xs text-muted-foreground">Verkehrswert</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">{formatCurrency(totals.totalDebt)}</p>
                    <p className="text-xs text-muted-foreground">Restschuld</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(totals.totalAnnuity)}</p>
                    <p className="text-xs text-muted-foreground">Annuität p.a.</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    Details →
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          {/* 10-Jahres-Investmentkalkulation Tabelle */}
          {hasData && projectionData.length > 0 && (
            <div className={cn('mt-6', DESIGN.TABLE.WRAPPER)}>
              <div className={cn(DESIGN.CARD.SECTION_HEADER, 'flex items-center justify-between')}>
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  <h3 className="font-semibold">Investmentkalkulation ({showAllYears ? '30' : '10'} Jahre)</h3>
                </div>
                {projectionData.length > 11 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAllYears(!showAllYears)}
                  >
                    <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showAllYears ? 'rotate-180' : ''}`} />
                    {showAllYears ? 'Weniger anzeigen' : 'Alle Jahre'}
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Jahr</TableHead>
                      <TableHead className="text-right">Miete p.a.</TableHead>
                      <TableHead className="text-right text-destructive">Zinsen</TableHead>
                      <TableHead className="text-right" style={{ color: 'hsl(210, 70%, 50%)' }}>Tilgung</TableHead>
                      <TableHead className="text-right" style={{ color: 'hsl(0, 70%, 50%)' }}>Restschuld</TableHead>
                      <TableHead className="text-right" style={{ color: 'hsl(210, 70%, 50%)' }}>Objektwert</TableHead>
                      <TableHead className="text-right" style={{ color: 'hsl(142, 70%, 45%)' }}>Vermögen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectionData
                      .slice(1, showAllYears ? 31 : 11)
                      .map((row) => (
                        <TableRow key={row.year}>
                          <TableCell className="font-medium">{row.year}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.rent)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatCurrency(row.interest)}</TableCell>
                          <TableCell className="text-right" style={{ color: 'hsl(210, 70%, 50%)' }}>{formatCurrency(row.amortization)}</TableCell>
                          <TableCell className="text-right" style={{ color: 'hsl(0, 70%, 50%)' }}>{formatCurrency(row.restschuld)}</TableCell>
                          <TableCell className="text-right" style={{ color: 'hsl(210, 70%, 50%)' }}>{formatCurrency(row.objektwert)}</TableCell>
                          <TableCell className="text-right font-medium" style={{ color: 'hsl(142, 70%, 45%)' }}>{formatCurrency(row.vermoegen)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Excel Import Dialog */}
      {activeOrganization && (
        <ExcelImportDialog
          open={showImportDialog}
          onOpenChange={(open) => {
            setShowImportDialog(open);
            if (!open) setPendingExcelFile(null);
          }}
          tenantId={activeOrganization.id}
          initialFile={pendingExcelFile}
          contextId={selectedContextId}
        />
      )}

      {/* Loan Re-Run Dialog */}
      {activeOrganization && (
        <ExcelImportDialog
          open={showLoanRerunDialog}
          onOpenChange={(open) => {
            setShowLoanRerunDialog(open);
            if (!open) setPendingLoanExcelFile(null);
          }}
          tenantId={activeOrganization.id}
          initialFile={pendingLoanExcelFile}
          contextId={selectedContextId}
          mode="loan-only"
        />
      )}

      {/* Create Property Dialog */}
      <CreatePropertyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePropertyId} onOpenChange={(open) => { if (!open) setDeletePropertyId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Immobilie endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle zugehörigen Daten (Einheiten, Mietverträge, Darlehen, Dokumente, Kontextzuordnungen) werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => deletePropertyId && handleDeleteProperty(deletePropertyId)}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Portfolio Summary Modal */}
      <PortfolioSummaryModal
        open={showSummaryModal}
        onOpenChange={setShowSummaryModal}
        totals={totals}
        contextName={selectedContextId ? contexts.find(c => c.id === selectedContextId)?.name : undefined}
      />
    </PageShell>
  );
}
