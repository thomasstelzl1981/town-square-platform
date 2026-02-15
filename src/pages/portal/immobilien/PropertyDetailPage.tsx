/**
 * PropertyDetailPage — Immobilienakte (MOD-04 SSOT Dossier)
 * 
 * Canonical Route: /portal/immobilien/:id
 * 
 * This is the SSOT dossier view for a single property/unit.
 * It renders an empty state when no property is found (e.g., for testing with fake IDs).
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { isDemoProperty } from '@/config/tenantConstants';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePropertyDossier } from '@/hooks/useUnitDossier';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, AlertTriangle, FileText, Building2, Calculator, LayoutList, LayoutPanelLeft, TrendingUp, Banknote, Receipt } from 'lucide-react';
import { ExposeTab } from '@/components/portfolio/ExposeTab';
import { VerkaufsauftragTab } from '@/components/portfolio/VerkaufsauftragTab';
import { TenancyTab } from '@/components/portfolio/TenancyTab';
import { GeldeingangTab } from '@/components/portfolio/GeldeingangTab';
import { DatenraumTab } from '@/components/portfolio/DatenraumTab';
import { EditableUnitDossierView } from '@/components/immobilienakte';
import { InventoryInvestmentSimulation } from '@/components/immobilienakte/InventoryInvestmentSimulation';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { NKAbrechnungTab } from '@/components/portfolio/NKAbrechnungTab';
import { PageShell } from '@/components/shared/PageShell';

interface Property {
  id: string;
  tenant_id: string;
  code: string | null;
  property_type: string;
  city: string;
  address: string;
  postal_code: string | null;
  country: string;
  total_area_sqm: number | null;
  usage_type: string;
  annual_income: number | null;
  market_value: number | null;
  management_fee: number | null;
  year_built: number | null;
  renovation_year: number | null;
  land_register_court: string | null;
  land_register_sheet: string | null;
  land_register_volume: string | null;
  parcel_number: string | null;
  unit_ownership_nr: string | null;
  notary_date: string | null;
  bnl_date: string | null;
  purchase_price: number | null;
  energy_source: string | null;
  heating_type: string | null;
  description: string | null;
  location_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PropertyFinancing {
  id: string;
  loan_number: string | null;
  bank_name: string | null;
  original_amount: number | null;
  current_balance: number | null;
  interest_rate: number | null;
  fixed_until: string | null;
  monthly_rate: number | null;
  annual_interest: number | null;
  is_active: boolean;
}

interface Unit {
  id: string;
  unit_number: string;
  area_sqm: number | null;
  current_monthly_rent: number | null;
  ancillary_costs: number | null;
  expose_headline: string | null;
  expose_subline: string | null;
}

/** Inline Bewertung tab – scoped to a single property */
function PropertyValuationTab({ propertyId, tenantId }: { propertyId: string; tenantId: string }) {
  const { data: valuations, isLoading } = useQuery({
    queryKey: ['property-valuations', propertyId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && !!tenantId,
  });

  const fmt = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '–';

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!valuations || valuations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Bewertungen vorhanden</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Starten Sie eine Bewertung, um hier Ihr Gutachten zu erhalten.
          </p>
          <Button size="sm" variant="outline" className="mt-4" disabled>
            Bewertung starten
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {valuations.map((v) => (
        <Card key={v.id}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-14 w-11 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 border">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">PDF</Badge>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium font-mono">{v.public_id}</p>
              <p className="text-xs text-muted-foreground">
                {v.completed_at ? new Date(v.completed_at).toLocaleDateString('de-DE') : '–'}
              </p>
            </div>
            <p className="text-sm font-semibold shrink-0">{fmt(v.market_value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeOrganization, activeTenantId } = useAuth();
  const { toast } = useToast();
  const { isEnabled } = useDemoToggles();
  const isDemo = id ? isDemoProperty(id) : false;
  const demoEnabled = isEnabled('GP-PORTFOLIO');
  const [property, setProperty] = useState<Property | null>(null);
  const [financing, setFinancing] = useState<PropertyFinancing[]>([]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'akte';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [splitView, setSplitView] = useState(false);
  const contentRef = usePdfContentRef();

  // Guard: if this is a demo property and demo mode is off, show not-found
  const blockedByDemoToggle = isDemo && !demoEnabled;

  // Load the new Immobilienakte data
  const { data: dossierData, isLoading: dossierLoading } = usePropertyDossier(id);

  // Load property_accounting for simulation
  const { data: accountingData } = useQuery({
    queryKey: ['property-accounting', id, activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_accounting')
        .select('*')
        .eq('property_id', id!)
        .eq('tenant_id', activeTenantId!)
        .maybeSingle();
      if (error) console.warn('Accounting query error:', error);
      return data;
    },
    enabled: !!id && !!activeTenantId,
  });

  // Load landlord context for this property
  const { data: contextData } = useQuery({
    queryKey: ['property-context', id, activeTenantId],
    queryFn: async () => {
      // Get context assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('context_property_assignment')
        .select('context_id')
        .eq('property_id', id!)
        .eq('tenant_id', activeTenantId!)
        .maybeSingle();
      
      if (assignmentError || !assignment) return null;
      
      // Get context details
      const { data: context } = await supabase
        .from('landlord_contexts')
        .select('id, name, context_type, taxable_income_yearly, marginal_tax_rate')
        .eq('id', assignment.context_id)
        .maybeSingle();
      
      return context;
    },
    enabled: !!id && !!activeTenantId,
  });

  async function fetchProperty() {
    // FIX: Use activeTenantId for consistent tenant scoping
    if (!id || !activeTenantId) {
      setLoading(false);
      setError('Keine Property-ID oder Tenant-Kontext');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', activeTenantId)
        .maybeSingle();

      if (propError) throw propError;
      if (!propData) {
        setError('Immobilie nicht gefunden oder kein Zugriff');
        setLoading(false);
        return;
      }
      setProperty(propData);

      // SSOT: Load financing from loans table (not property_financing)
      // P0-FIX: Removed .eq('is_active', true) and order — loans table has no is_active column
      const { data: loansResult } = await (supabase as any)
        .from('loans')
        .select('id, loan_number, bank_name, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
        .eq('property_id', id)
        .eq('tenant_id', activeTenantId);

      // Map loans to PropertyFinancing interface for backward compatibility
      const mappedFinancing: PropertyFinancing[] = (loansResult || []).map((loan: any) => ({
        id: loan.id,
        loan_number: loan.loan_number,
        bank_name: loan.bank_name,
        original_amount: null,
        current_balance: loan.outstanding_balance_eur,
        interest_rate: loan.interest_rate_percent,
        fixed_until: null,
        monthly_rate: loan.annuity_monthly_eur,
        annual_interest: loan.outstanding_balance_eur && loan.interest_rate_percent 
          ? loan.outstanding_balance_eur * (loan.interest_rate_percent / 100) 
          : null,
        is_active: true, // Assume all loans are active since we don't have is_active column
      }));
      setFinancing(mappedFinancing);

      const { data: unitData } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', id)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      setUnit(unitData);
    } catch (err: any) {
      console.error('PropertyDetailPage fetch error:', err);
      setError(err.message || 'Fehler beim Laden der Immobilie');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProperty();
  }, [id, activeTenantId]);


  const getDocumentTitle = () => {
    if (!property) return 'Immobilie';
    const prefix = property.code ? `${property.code} – ` : '';
    switch (activeTab) {
      case 'akte': return `Immobilienakte: ${prefix}${property.address}`;
      case 'expose': return `Exposé: ${prefix}${property.address}`;
      case 'features': return `Features: ${prefix}${property.address}`;
      case 'tenancy': return `Mietverhältnis: ${prefix}${property.address}`;
      case 'datenraum': return `Datenraum: ${prefix}${property.address}`;
      default: return `${prefix}${property.address}`;
    }
  };

  // handleGenerateDescription entfernt — KI-Generierung erfolgt jetzt im EditableAddressBlock

  // Loading state
  if (loading || dossierLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state: Property not found OR demo blocked
  if (error || !property || blockedByDemoToggle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/portal/immobilien/portfolio">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>
              {blockedByDemoToggle ? 'Demo-Daten deaktiviert' : 'Immobilie nicht gefunden'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              {blockedByDemoToggle 
                ? 'Diese Demo-Immobilie ist nicht sichtbar, da die Demo-Daten deaktiviert sind. Aktivieren Sie die Demo-Daten unter Stammdaten → Demo-Daten.'
                : `Die Immobilie mit der ID ${id} existiert nicht oder Sie haben keinen Zugriff darauf.`
              }
            </p>
            <Button asChild>
              <Link to="/portal/immobilien/portfolio">Zum Portfolio</Link>
            </Button>
          </CardContent>
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
      <div ref={contentRef}>
        {/* Header: Back + Demo Badge + Split-View Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" asChild className="no-print">
            <Link to="/portal/immobilien/portfolio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground flex-1">Zurück zur Übersicht</span>
          
          {isDemo && (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">
              DEMO
            </Badge>
          )}

          {/* Split-View Toggle — lg+ only */}
          <div className="hidden lg:flex items-center gap-1 border rounded-md p-0.5 bg-muted/30 no-print">
            <Button
              variant={splitView ? 'ghost' : 'secondary'}
              size="sm"
              className="h-6 text-xs px-2 gap-1"
              onClick={() => setSplitView(false)}
            >
              <LayoutList className="h-3 w-3" /> Standard
            </Button>
            <Button
              variant={splitView ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 text-xs px-2 gap-1"
              onClick={() => setSplitView(true)}
            >
              <LayoutPanelLeft className="h-3 w-3" /> Split-View
            </Button>
          </div>
        </div>

        {splitView ? (
          /* ═══ SPLIT VIEW: Akte | Simulation ═══ */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="overflow-y-auto pr-2 scrollbar-thin">
              {dossierData ? (
                <EditableUnitDossierView data={dossierData} />
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p>Keine Akten-Daten verfügbar.</p>
                </div>
              )}
            </div>
            <div className="overflow-y-auto pl-2 scrollbar-thin">
              <InventoryInvestmentSimulation data={simulationData} />
            </div>
          </div>
        ) : (
          /* ═══ STANDARD: Tabs ═══ */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="no-print">
              <TabsTrigger value="akte" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Akte
              </TabsTrigger>
              <TabsTrigger value="simulation" className="flex items-center gap-1">
                <Calculator className="h-4 w-4" />
                Simulation
              </TabsTrigger>
              <TabsTrigger value="expose">Exposé</TabsTrigger>
              <TabsTrigger value="verkaufsauftrag">Verkaufsauftrag</TabsTrigger>
              <TabsTrigger value="bewertung" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Bewertung
              </TabsTrigger>
              <TabsTrigger value="tenancy">Mietverhältnis</TabsTrigger>
              <TabsTrigger value="geldeingang" className="flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                Geldeingang
              </TabsTrigger>
              <TabsTrigger value="nkabrechnung" className="flex items-center gap-1">
                <Receipt className="h-4 w-4" />
                NK-Abrechnung
              </TabsTrigger>
              <TabsTrigger value="datenraum">Datenraum</TabsTrigger>
            </TabsList>

            <TabsContent value="akte">
              {dossierData ? (
                <EditableUnitDossierView data={dossierData} />
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p>Keine Akten-Daten verfügbar. Bitte ergänzen Sie die Stammdaten.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="simulation">
              <InventoryInvestmentSimulation data={simulationData} />
            </TabsContent>

            <TabsContent value="expose">
              <ExposeTab 
                property={property} 
                financing={financing} 
                unit={unit}
                dossierData={dossierData}
              />
            </TabsContent>

            <TabsContent value="verkaufsauftrag">
              <VerkaufsauftragTab 
                propertyId={property.id} 
                tenantId={property.tenant_id}
                unitId={unit?.id}
                askingPrice={property.market_value || undefined}
                propertyAddress={property.address}
                propertyCity={property.city}
                onUpdate={fetchProperty}
              />
            </TabsContent>

            <TabsContent value="bewertung">
              <PropertyValuationTab propertyId={property.id} tenantId={property.tenant_id} />
            </TabsContent>

            <TabsContent value="tenancy">
              <TenancyTab 
                propertyId={property.id}
                tenantId={property.tenant_id}
                unitId={unit?.id || ''}
              />
            </TabsContent>

            <TabsContent value="geldeingang">
              <GeldeingangTab
                propertyId={property.id}
                tenantId={property.tenant_id}
                unitId={unit?.id || ''}
              />
            </TabsContent>

            <TabsContent value="datenraum">
              <DatenraumTab 
                propertyId={property.id}
                tenantId={property.tenant_id}
                propertyCode={property.code || undefined}
              />
            </TabsContent>

            <TabsContent value="nkabrechnung">
              {unit?.id ? (
                <NKAbrechnungTab
                  propertyId={property.id}
                  tenantId={property.tenant_id}
                  unitId={unit.id}
                />
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Keine Einheit für diese Immobilie vorhanden. Bitte legen Sie zuerst eine Einheit an.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle={getDocumentTitle()} 
        moduleName="MOD-04 Immobilien – Immobilienakte" 
      />
    </PageShell>
  );
}
