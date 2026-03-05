/**
 * PortfolioTab Orchestrator (MOD-04) — R-8 Refactored
 * Reduced from 1511 → ~200 lines via Orchestrator + Sub-components Pattern
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { DEMO_PROPERTY_IDS } from '@/config/tenantConstants';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/shared';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { Loader2, Upload, Download, Landmark } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ExcelImportDialog } from '@/components/portfolio/ExcelImportDialog';
import { CreatePropertyDialog } from '@/components/portfolio/CreatePropertyDialog';
import { PortfolioSummaryModal } from '@/components/portfolio/PortfolioSummaryModal';
import { CreateContextDialog } from '@/components/shared/CreateContextDialog';
import { PropertyContextAssigner } from '@/components/shared/PropertyContextAssigner';
import { generatePortfolioTemplate } from '@/lib/generatePortfolioTemplate';

import {
  type PortfolioLandlordContext, type UnitWithProperty, type LoanData, type LeaseData, type PortfolioTotals,
  formatCurrency,
  PortfolioKPIGrid, PortfolioCharts, PortfolioPropertyTable, PortfolioContextWidgets,
} from '@/components/immobilien/portfolio';

export function PortfolioTab() {
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PORTFOLIO');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeOrganization, activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  // ── State ──
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showAllYears, setShowAllYears] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(() => searchParams.get('create') === '1');
  const [showCreateContextDialog, setShowCreateContextDialog] = useState(false);
  const [editContext, setEditContext] = useState<PortfolioLandlordContext | null>(null);
  const [showLoanRerunDialog, setShowLoanRerunDialog] = useState(false);
  const [pendingLoanExcelFile, setPendingLoanExcelFile] = useState<File | null>(null);
  const [assignContextId, setAssignContextId] = useState<string | null>(null);
  const [assignContextName, setAssignContextName] = useState('');
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingExcelFile, setPendingExcelFile] = useState<File | null>(null);
  const selectedContextId = searchParams.get('context');

  // ── Clear create param ──
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      const p = new URLSearchParams(searchParams);
      p.delete('create');
      setSearchParams(p, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ── Queries ──
  const { data: contexts = [] } = useQuery({
    queryKey: ['landlord-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('landlord_contexts')
        .select('id, name, context_type, is_default, tax_regime, tax_rate_percent, street, house_number, postal_code, city, hrb_number, ust_id, legal_form, managing_director, taxable_income_yearly, tax_assessment_type, church_tax, children_count')
        .eq('tenant_id', activeTenantId!).order('is_default', { ascending: false });
      if (error) throw error;
      return data as PortfolioLandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  const { data: contextAssignments = [] } = useQuery({
    queryKey: ['context-property-assignments', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('context_property_assignment').select('context_id, property_id').eq('tenant_id', activeTenantId!);
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId && contexts.length > 0,
  });

  const { data: unitsWithProperties, isLoading: unitsLoading } = useQuery({
    queryKey: ['portfolio-units-annual', activeTenantId, demoEnabled],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data: units, error } = await supabase.from('units').select(`id, unit_number, area_sqm, current_monthly_rent, usage_type, property_id, properties!inner (id, code, property_type, address, city, postal_code, market_value, annual_income, status, is_demo)`).eq('tenant_id', activeTenantId).eq('properties.status', 'active');
      if (error) throw error;

      const { data: leases } = await supabase.from('leases').select(`unit_id, monthly_rent, rent_cold_eur, status, contacts!leases_contact_fk (first_name, last_name, company)`).eq('tenant_id', activeTenantId).eq('status', 'active');

      let loans: LoanData[] = [];
      try {
        const { data: loansResult, error: loansError } = await (supabase as any).from('loans').select('id, property_id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent').eq('tenant_id', activeTenantId);
        if (!loansError && loansResult) loans = loansResult as LoanData[];
      } catch {}

      const leaseMap = new Map<string, { leases: LeaseData[]; totalMonthlyRent: number; primaryTenantName: string | null }>();
      leases?.forEach(l => {
        const existing = leaseMap.get(l.unit_id) || { leases: [], totalMonthlyRent: 0, primaryTenantName: null };
        existing.leases.push(l as LeaseData);
        existing.totalMonthlyRent += (l.rent_cold_eur || l.monthly_rent || 0);
        if (!existing.primaryTenantName && l.contacts) { const c = l.contacts as any; existing.primaryTenantName = c.company || `${c.first_name} ${c.last_name}`.trim(); }
        leaseMap.set(l.unit_id, existing);
      });

      const loanMap = new Map<string, LoanData>();
      loans.forEach(l => { if (!loanMap.has(l.property_id)) loanMap.set(l.property_id, l); });

      let filtered = units || [];
      if (!demoEnabled) {
        const demoPropIds = (units || []).filter(u => (u.properties as any)?.is_demo).map(u => (u.properties as any)?.id);
        filtered = filtered.filter(u => !(u.properties as any)?.is_demo);
        loans = loans.filter(l => !demoPropIds.includes(l.property_id));
      }

      return filtered.map(u => {
        const prop = u.properties as any;
        const loan = loanMap.get(prop.id);
        const leaseInfo = leaseMap.get(u.id);
        const totalMonthlyRent = leaseInfo?.totalMonthlyRent || u.current_monthly_rent || 0;
        const annualNetColdRent = totalMonthlyRent * 12 || prop.annual_income || 0;
        const balance = loan?.outstanding_balance_eur || 0;
        const monthlyAnnuity = loan?.annuity_monthly_eur || 0;
        const interestRate = (loan?.interest_rate_percent || 0) / 100;
        let tenantName = leaseInfo?.primaryTenantName || null;
        const leasesCount = leaseInfo?.leases.length || 0;
        if (leasesCount > 1 && tenantName) tenantName = `${tenantName} (+${leasesCount - 1})`;
        return { id: u.id, unit_number: u.unit_number, area_sqm: u.area_sqm, property_id: prop.id, property_code: prop.code, property_type: prop.property_type, address: prop.address, city: prop.city, postal_code: prop.postal_code, market_value: prop.market_value, annual_net_cold_rent: annualNetColdRent, annuity_pa: monthlyAnnuity * 12, interest_pa: balance * interestRate, amortization_pa: (monthlyAnnuity * 12) - (balance * interestRate), financing_balance: loan?.outstanding_balance_eur || null, tenant_name: tenantName, leases_count: leasesCount } as UnitWithProperty;
      });
    },
    enabled: !!activeTenantId,
  });

  const { data: loansData } = useQuery({
    queryKey: ['portfolio-loans', activeTenantId],
    queryFn: async (): Promise<LoanData[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await (supabase as any).from('loans').select('id, property_id, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent').eq('tenant_id', activeTenantId);
      if (error) return [];
      return (data || []) as LoanData[];
    },
    enabled: !!activeTenantId,
  });

  const { data: nkPeriodsData } = useQuery({
    queryKey: ['portfolio-nk-periods', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase.from('nk_periods').select('property_id, non_allocatable_eur, period_start, period_end, status').eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // ── Derived ──
  const filteredUnits = useMemo(() => {
    if (!unitsWithProperties) return [];
    if (!selectedContextId || contexts.length <= 1) return unitsWithProperties;
    const assignedPropertyIds = contextAssignments.filter(a => a.context_id === selectedContextId).map(a => a.property_id);
    if (assignedPropertyIds.length === 0) {
      const defaultCtx = contexts.find(c => c.is_default);
      if (selectedContextId === defaultCtx?.id) return unitsWithProperties.filter(u => !contextAssignments.map(a => a.property_id).includes(u.property_id));
      return [];
    }
    return unitsWithProperties.filter(u => assignedPropertyIds.includes(u.property_id));
  }, [unitsWithProperties, selectedContextId, contextAssignments, contexts]);

  const displayUnits = selectedContextId ? filteredUnits : (unitsWithProperties || []);
  const hasData = displayUnits.length > 0;
  const totalPropertyCount = useMemo(() => [...new Set(unitsWithProperties?.map(u => u.property_id) || [])].length, [unitsWithProperties]);

  const totals = useMemo<PortfolioTotals | null>(() => {
    const units = selectedContextId ? filteredUnits : (unitsWithProperties || []);
    if (!units.length) return null;
    const uniquePropIds = [...new Set(units.map(u => u.property_id))];
    const relevantLoans = loansData?.filter(l => uniquePropIds.includes(l.property_id)) || [];
    const propValues = new Map<string, number>();
    units.forEach(u => { if (u.market_value && !propValues.has(u.property_id)) propValues.set(u.property_id, u.market_value); });
    const totalValue = Array.from(propValues.values()).reduce((a, b) => a + b, 0);
    const totalIncome = units.reduce((s, u) => s + (u.annual_net_cold_rent || 0), 0);
    const totalDebt = relevantLoans.reduce((s, l) => s + (l.outstanding_balance_eur || 0), 0);
    const totalAnnuity = units.reduce((s, u) => s + (u.annuity_pa || 0), 0);
    const avgInterestRate = relevantLoans.length ? relevantLoans.reduce((s, l) => s + (l.interest_rate_percent || 0), 0) / relevantLoans.length : 0;
    return { unitCount: units.length, propertyCount: uniquePropIds.length, totalArea: units.reduce((s, u) => s + (u.area_sqm || 0), 0), totalValue, totalIncome, totalDebt, totalAnnuity, netWealth: totalValue - totalDebt, avgYield: totalValue > 0 ? (totalIncome / totalValue) * 100 : 0, avgInterestRate };
  }, [unitsWithProperties, filteredUnits, selectedContextId, loansData]);

  const nkAggregation = useMemo(() => {
    const units = selectedContextId ? filteredUnits : (unitsWithProperties || []);
    const propIds = [...new Set(units.map(u => u.property_id))];
    if (!nkPeriodsData?.length || !propIds.length) return { hasData: false, annualTotal: null as number | null };
    let total = 0; let any = false;
    for (const pid of propIds) {
      const periods = nkPeriodsData.filter(p => p.property_id === pid && p.non_allocatable_eur != null).sort((a, b) => b.period_start.localeCompare(a.period_start));
      if (periods.length) { total += periods[0].non_allocatable_eur!; any = true; }
    }
    return { hasData: any, annualTotal: any ? total : null };
  }, [nkPeriodsData, unitsWithProperties, filteredUnits, selectedContextId]);

  const projectionData = useMemo(() => {
    if (!totals || totals.totalDebt <= 0) return [];
    let debt = totals.totalDebt, val = totals.totalValue, rent = totals.totalIncome;
    const annuity = totals.totalAnnuity, rate = totals.avgInterestRate / 100;
    const years: Array<{ year: number; rent: number; interest: number; amortization: number; objektwert: number; restschuld: number; vermoegen: number }> = [];
    for (let y = 0; y <= 30; y++) {
      const interest = debt * rate; const amort = Math.min(annuity - interest, debt);
      years.push({ year: 2026 + y, rent: Math.round(rent), interest: Math.round(interest), amortization: Math.round(amort), objektwert: Math.round(val), restschuld: Math.max(0, Math.round(debt)), vermoegen: Math.round(val - debt) });
      debt = Math.max(0, debt - amort); val *= 1.02; rent *= 1.015;
    }
    return years;
  }, [totals]);

  const selectedContext = contexts.find(c => c.id === selectedContextId);

  // ── Handlers ──
  const handleContextSelect = useCallback((id: string | null) => {
    const p = new URLSearchParams(searchParams);
    id ? p.set('context', id) : p.delete('context');
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  const handleDeleteProperty = async (propertyId: string) => {
    setIsDeleting(true);
    try {
      await supabase.from('storage_nodes').delete().eq('property_id', propertyId);
      await supabase.from('loans').delete().eq('property_id', propertyId);
      await supabase.from('context_property_assignment').delete().eq('property_id', propertyId);
      const { data: units } = await supabase.from('units').select('id').eq('property_id', propertyId);
      if (units?.length) await supabase.from('leases').delete().in('unit_id', units.map(u => u.id));
      await supabase.from('units').delete().eq('property_id', propertyId);
      await supabase.from('properties').delete().eq('id', propertyId);
      toast.success('Immobilie und zugehörige Daten gelöscht');
      queryClient.invalidateQueries({ queryKey: ['portfolio-units-annual'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-loans'] });
      queryClient.invalidateQueries({ queryKey: ['context-property-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    } catch { toast.error('Fehler beim Löschen der Immobilie'); }
    finally { setIsDeleting(false); setDeletePropertyId(null); }
  };

  // ── Loading ──
  if (unitsLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  // ── Render ──
  return (
    <PageShell>
      <ModulePageHeader title="Portfolio" description="Übersicht und Verwaltung deiner Immobilien und Einheiten" />

      <CreateContextDialog open={showCreateContextDialog || !!editContext} onOpenChange={(open) => { if (!open) { setShowCreateContextDialog(false); setEditContext(null); } }} editContext={editContext} />
      {assignContextId && <PropertyContextAssigner open={!!assignContextId} onOpenChange={(open) => { if (!open) setAssignContextId(null); }} contextId={assignContextId} contextName={assignContextName} />}

      <PortfolioContextWidgets contexts={contexts} contextAssignments={contextAssignments} unitsWithProperties={unitsWithProperties} totals={totals} totalPropertyCount={totalPropertyCount} selectedContextId={selectedContextId} demoEnabled={demoEnabled} onContextSelect={handleContextSelect} onCreateContext={() => setShowCreateContextDialog(true)} onEditContext={setEditContext} onAssignContext={(id, name) => { setAssignContextId(id); setAssignContextName(name); }} />

      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Immobilienportfolio{selectedContext ? ` — ${selectedContext.name}` : ''}</h2></div>

      <PortfolioKPIGrid totals={totals} hasData={hasData} />
      <PortfolioCharts totals={totals} hasData={hasData} loansData={loansData} nkAggregation={nkAggregation} selectedContext={selectedContext} />

      {/* Excel Import Zone */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <FileUploader onFilesSelected={(files) => { if (files.length) { setPendingExcelFile(files[0]); setShowImportDialog(true); } }} accept=".xlsx,.xls,.csv">
            {(isDragOver: boolean) => (
              <div className={cn('border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2', isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30')}>
                <Upload className={cn('h-8 w-8 transition-colors', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
                <p className="text-sm font-medium">Portfolio-Excel zum Import hier ablegen</p>
                <p className="text-xs text-muted-foreground">oder klicken zum Auswählen · .xlsx, .xls, .csv</p>
              </div>
            )}
          </FileUploader>
          <div className="flex items-center justify-center">
            <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => generatePortfolioTemplate()}><Download className="h-3.5 w-3.5" />Muster-Vorlage herunterladen</Button>
          </div>
          {hasData && (
            <div className="flex items-center justify-end">
              <FileUploader onFilesSelected={(files) => { if (files.length) { setPendingLoanExcelFile(files[0]); setShowLoanRerunDialog(true); } }} accept=".xlsx,.xls,.csv">
                {() => (<Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild><span><Landmark className="h-4 w-4" />Darlehen neu aus Excel auslesen</span></Button>)}
              </FileUploader>
            </div>
          )}
        </CardContent>
      </Card>

      <PortfolioPropertyTable displayUnits={displayUnits} isLoading={unitsLoading} totals={totals} hasData={hasData} isDeleting={isDeleting} onDeleteProperty={(id) => setDeletePropertyId(id)} onShowSummary={() => setShowSummaryModal(true)} projectionData={projectionData} showAllYears={showAllYears} setShowAllYears={setShowAllYears} />

      {/* Dialogs */}
      {activeOrganization && <ExcelImportDialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) setPendingExcelFile(null); }} tenantId={activeOrganization.id} initialFile={pendingExcelFile} contextId={selectedContextId} />}
      {activeOrganization && <ExcelImportDialog open={showLoanRerunDialog} onOpenChange={(open) => { setShowLoanRerunDialog(open); if (!open) setPendingLoanExcelFile(null); }} tenantId={activeOrganization.id} initialFile={pendingLoanExcelFile} contextId={selectedContextId} mode="loan-only" />}
      <CreatePropertyDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <AlertDialog open={!!deletePropertyId} onOpenChange={(open) => { if (!open) setDeletePropertyId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Immobilie endgültig löschen?</AlertDialogTitle><AlertDialogDescription>Alle zugehörigen Daten werden unwiderruflich gelöscht.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting} onClick={() => deletePropertyId && handleDeleteProperty(deletePropertyId)}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Endgültig löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PortfolioSummaryModal open={showSummaryModal} onOpenChange={setShowSummaryModal} totals={totals} contextName={selectedContextId ? contexts.find(c => c.id === selectedContextId)?.name : undefined} isCommercial={selectedContext?.context_type === 'BUSINESS'} />
    </PageShell>
  );
}
