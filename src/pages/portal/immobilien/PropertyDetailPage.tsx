/**
 * PropertyDetailPage — Orchestrator (MOD-04 SSOT Dossier)
 * R-15 Refactoring: 628 → ~200 lines
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { isDemoProperty } from '@/config/tenantConstants';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePropertyDossier } from '@/hooks/useUnitDossier';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { EditableUnitDossierView } from '@/components/immobilienakte';
import { InventoryInvestmentSimulation } from '@/components/immobilienakte/InventoryInvestmentSimulation';

import { PageShell } from '@/components/shared/PageShell';
import { useArmstrongProactiveDispatcher } from '@/hooks/useArmstrongProactiveDispatcher';
import { PropertyDetailHeader, PropertyTabRouter } from '@/components/immobilien/detail';

interface Property {
  id: string; tenant_id: string; code: string | null; property_type: string;
  city: string; address: string; postal_code: string | null; country: string;
  total_area_sqm: number | null; usage_type: string; annual_income: number | null;
  market_value: number | null; management_fee: number | null; year_built: number | null;
  renovation_year: number | null; land_register_court: string | null; land_register_sheet: string | null;
  land_register_volume: string | null; parcel_number: string | null; unit_ownership_nr: string | null;
  notary_date: string | null; bnl_date: string | null; purchase_price: number | null;
  energy_source: string | null; heating_type: string | null; description: string | null;
  location_notes: string | null; status: string; created_at: string; updated_at: string;
}

interface PropertyFinancing {
  id: string; loan_number: string | null; bank_name: string | null; original_amount: number | null;
  current_balance: number | null; interest_rate: number | null; fixed_until: string | null;
  monthly_rate: number | null; annual_interest: number | null; is_active: boolean;
}

interface Unit { id: string; unit_number: string; area_sqm: number | null; current_monthly_rent: number | null; ancillary_costs: number | null; expose_headline: string | null; expose_subline: string | null; }

export default function PropertyDetailPage() {
  const consentGuard = useLegalConsent();
  const { id } = useParams<{ id: string }>();
  const { activeTenantId } = useAuth();
  const { toast } = useToast();
  const { isEnabled } = useDemoToggles();
  const isDemo = id ? isDemoProperty(id) : false;
  const demoEnabled = isEnabled('GP-PORTFOLIO');
  const [property, setProperty] = useState<Property | null>(null);
  const [financing, setFinancing] = useState<PropertyFinancing[]>([]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'akte');
  const [splitView, setSplitView] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const deleteQueryClient = useQueryClient();
  
  const { checkPropertyCompleteness } = useArmstrongProactiveDispatcher('MOD-04');

  const { data: dossierData, isLoading: dossierLoading } = usePropertyDossier(id);

  const { data: accountingData } = useQuery({
    queryKey: ['property-accounting', id, activeTenantId],
    queryFn: async () => { const { data } = await supabase.from('property_accounting').select('*').eq('property_id', id!).eq('tenant_id', activeTenantId!).maybeSingle(); return data; },
    enabled: !!id && !!activeTenantId,
  });

  const { data: contextData } = useQuery({
    queryKey: ['property-context', id, activeTenantId],
    queryFn: async () => {
      const { data: assignment } = await supabase.from('context_property_assignment').select('context_id').eq('property_id', id!).eq('tenant_id', activeTenantId!).maybeSingle();
      if (!assignment) return null;
      const { data: context } = await supabase.from('landlord_contexts').select('id, name, context_type, taxable_income_yearly, marginal_tax_rate').eq('id', assignment.context_id).maybeSingle();
      return context;
    },
    enabled: !!id && !!activeTenantId,
  });

  async function fetchProperty() {
    if (!id || !activeTenantId) { setLoading(false); setError('Keine Property-ID oder Tenant-Kontext'); return; }
    setLoading(true); setError(null);
    try {
      const { data: propData, error: propError } = await supabase.from('properties').select('*').eq('id', id).eq('tenant_id', activeTenantId).maybeSingle();
      if (propError) throw propError;
      if (!propData) { setError('Immobilie nicht gefunden oder kein Zugriff'); setLoading(false); return; }
      setProperty(propData);
      const { data: loansResult } = await (supabase as any).from('loans').select('id, loan_number, bank_name, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent').eq('property_id', id).eq('tenant_id', activeTenantId);
      setFinancing((loansResult || []).map((loan: any) => ({ id: loan.id, loan_number: loan.loan_number, bank_name: loan.bank_name, original_amount: null, current_balance: loan.outstanding_balance_eur, interest_rate: loan.interest_rate_percent, fixed_until: null, monthly_rate: loan.annuity_monthly_eur, annual_interest: loan.outstanding_balance_eur && loan.interest_rate_percent ? loan.outstanding_balance_eur * (loan.interest_rate_percent / 100) : null, is_active: true })));
      const { data: unitData } = await supabase.from('units').select('*').eq('property_id', id).eq('tenant_id', activeTenantId).order('created_at', { ascending: true }).limit(1).maybeSingle();
      setUnit(unitData);
    } catch (err: unknown) { setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden'); }
    setLoading(false);
  }

  useEffect(() => { fetchProperty(); }, [id, activeTenantId]);

  useEffect(() => {
    if (!property) return;
    const fields = [property.purchase_price, property.market_value, property.year_built, property.total_area_sqm, property.energy_source, property.heating_type, property.land_register_court, property.land_register_sheet, property.description, property.location_notes];
    checkPropertyCompleteness(fields.filter(f => f !== null && f !== undefined && f !== '').length, fields.length);
  }, [property, checkPropertyCompleteness]);

  const handleDeleteProperty = async () => {
    if (!id || !consentGuard.requireConsent()) return;
    setIsDeleting(true);
    try {
      const { data: units } = await supabase.from('units').select('id').eq('property_id', id);
      if (units?.length) { await supabase.from('leases').delete().in('unit_id', units.map(u => u.id)); await supabase.from('units').delete().eq('property_id', id); }
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Immobilie gelöscht' });
      deleteQueryClient.invalidateQueries({ queryKey: ['portfolio-units-annual'] });
      navigate('/portal/immobilien/portfolio');
    } catch (err: unknown) { toast({ title: 'Fehler', description: err instanceof Error ? err.message : String(err), variant: 'destructive' }); }
    setIsDeleting(false); setShowDeleteDialog(false);
  };

  const blockedByDemoToggle = isDemo && !demoEnabled;

  if (loading || dossierLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (error || !property || blockedByDemoToggle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild><Link to="/portal/immobilien/portfolio"><ArrowLeft className="mr-2 h-4 w-4" />Zurück zur Übersicht</Link></Button>
        <Card className="border-dashed">
          <CardHeader className="text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted"><Building2 className="h-8 w-8 text-muted-foreground" /></div><CardTitle>{blockedByDemoToggle ? 'Demo-Daten deaktiviert' : 'Immobilie nicht gefunden'}</CardTitle></CardHeader>
          <CardContent className="text-center"><p className="text-muted-foreground mb-4">{blockedByDemoToggle ? 'Diese Demo-Immobilie ist nicht sichtbar, da die Demo-Daten deaktiviert sind.' : `Die Immobilie mit der ID ${id} existiert nicht oder Sie haben keinen Zugriff darauf.`}</p><Button asChild><Link to="/portal/immobilien/portfolio">Zum Portfolio</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  const simulationData = {
    purchasePrice: property.purchase_price || property.market_value || 0,
    marketValue: property.market_value || property.purchase_price || 0,
    annualRent: (unit?.current_monthly_rent || 0) * 12,
    outstandingBalance: financing[0]?.current_balance || 0,
    interestRatePercent: financing[0]?.interest_rate || 0,
    annuityMonthly: financing[0]?.monthly_rate || 0,
    buildingSharePercent: accountingData?.building_share_percent || 80,
    afaRatePercent: accountingData?.afa_rate_percent || 2,
    afaMethod: accountingData?.afa_method || 'linear',
    contextName: contextData?.name,
    marginalTaxRate: contextData?.marginal_tax_rate || 0.42,
  };

  return (
    <PageShell fullWidth={splitView}>
      <div>
        <PropertyDetailHeader property={property} propertyId={id} isDemo={isDemo} splitView={splitView} onSplitViewChange={setSplitView} onDelete={() => setShowDeleteDialog(true)} />

        {splitView ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="overflow-y-auto pr-2 scrollbar-thin">{dossierData ? <EditableUnitDossierView data={dossierData} /> : <div className="flex items-center justify-center py-12 text-muted-foreground"><p>Keine Akten-Daten verfügbar.</p></div>}</div>
            <div className="overflow-y-auto pl-2 scrollbar-thin"><InventoryInvestmentSimulation data={simulationData} /></div>
          </div>
        ) : (
          <PropertyTabRouter activeTab={activeTab} onTabChange={setActiveTab} property={property} financing={financing} unit={unit} dossierData={dossierData} simulationData={simulationData} onPropertyUpdate={fetchProperty} />
        )}
      </div>

      

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Immobilie löschen?</AlertDialogTitle><AlertDialogDescription>Alle verknüpften Einheiten, Mietverträge und Dokumente werden ebenfalls entfernt.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteProperty} disabled={isDeleting}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
