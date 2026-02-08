/**
 * PropertyDetailPage — Immobilienakte (MOD-04 SSOT Dossier)
 * 
 * Canonical Route: /portal/immobilien/:id
 * 
 * This is the SSOT dossier view for a single property/unit.
 * It renders an empty state when no property is found (e.g., for testing with fake IDs).
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { ArrowLeft, Loader2, AlertTriangle, FileText, Building2, Calculator } from 'lucide-react';
import { ExposeTab } from '@/components/portfolio/ExposeTab';
import { FeaturesTab } from '@/components/portfolio/FeaturesTab';
import { TenancyTab } from '@/components/portfolio/TenancyTab';
import { DatenraumTab } from '@/components/portfolio/DatenraumTab';
import { EditableUnitDossierView } from '@/components/immobilienakte';
import { InventoryInvestmentSimulation } from '@/components/immobilienakte/InventoryInvestmentSimulation';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';

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

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeOrganization, activeTenantId } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [financing, setFinancing] = useState<PropertyFinancing[]>([]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('akte');
  const contentRef = usePdfContentRef();

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
        .select('id, loan_number, lender_name, outstanding_balance_eur, annuity_monthly_eur, interest_rate_percent')
        .eq('property_id', id)
        .eq('tenant_id', activeTenantId);

      // Map loans to PropertyFinancing interface for backward compatibility
      const mappedFinancing: PropertyFinancing[] = (loansResult || []).map((loan: any) => ({
        id: loan.id,
        loan_number: loan.loan_number,
        bank_name: loan.lender_name,
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
        .eq('unit_number', 'MAIN')
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

  // Empty state: Property not found (but route is valid)
  if (error || !property) {
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
            <CardTitle>Immobilie nicht gefunden</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Die Immobilie mit der ID <code className="bg-muted px-2 py-1 rounded">{id}</code> existiert nicht 
              oder Sie haben keinen Zugriff darauf.
            </p>
            <Button asChild>
              <Link to="/portal/immobilien/portfolio">Zum Portfolio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        {/* Minimaler Header: Nur Back-Button */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" asChild className="no-print">
            <Link to="/portal/immobilien/portfolio">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">Zurück zur Übersicht</span>
        </div>

        {/* Tabs - Akte is now the default/first tab */}
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
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="tenancy">Mietverhältnis</TabsTrigger>
            <TabsTrigger value="datenraum">Datenraum</TabsTrigger>
          </TabsList>

          {/* NEW: Immobilienakte Tab - SSOT Editable View */}
          <TabsContent value="akte">
            {dossierData ? (
              <EditableUnitDossierView data={dossierData} />
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p>Keine Akten-Daten verfügbar. Bitte ergänzen Sie die Stammdaten.</p>
              </div>
            )}
          </TabsContent>

          {/* NEW: Investment Simulation Tab */}
          <TabsContent value="simulation">
            {property && financing.length > 0 ? (
              <InventoryInvestmentSimulation
                data={{
                  purchasePrice: property.purchase_price || property.market_value || 0,
                  marketValue: property.market_value || 0,
                  annualRent: (unit?.current_monthly_rent || 0) * 12,
                  outstandingBalance: financing[0]?.current_balance || 0,
                  interestRatePercent: financing[0]?.interest_rate || 0,
                  annuityMonthly: financing[0]?.monthly_rate || 0,
                  buildingSharePercent: accountingData?.building_share_percent || 80,
                  afaRatePercent: accountingData?.afa_rate_percent || 2,
                  afaMethod: accountingData?.afa_method || 'linear',
                  contextName: contextData?.name,
                  marginalTaxRate: contextData?.marginal_tax_rate || 0.42,
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Keine Finanzierungsdaten vorhanden</p>
                  <p className="text-sm mt-1">Fügen Sie zuerst ein Darlehen hinzu, um die Simulation zu nutzen.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="expose">
            <ExposeTab 
              property={property} 
              financing={financing} 
              unit={unit}
              dossierData={dossierData}
            />
          </TabsContent>

          <TabsContent value="features">
            <FeaturesTab 
              propertyId={property.id} 
              tenantId={property.tenant_id}
              onUpdate={fetchProperty}
            />
          </TabsContent>

          <TabsContent value="tenancy">
            <TenancyTab 
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
        </Tabs>
      </div>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle={getDocumentTitle()} 
        moduleName="MOD-04 Immobilien – Immobilienakte" 
      />
    </div>
  );
}
