import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertTriangle, Edit } from 'lucide-react';
import { ExposeTab } from '@/components/portfolio/ExposeTab';
import { FeaturesTab } from '@/components/portfolio/FeaturesTab';
import { TenancyTab } from '@/components/portfolio/TenancyTab';
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
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { activeOrganization } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [financing, setFinancing] = useState<PropertyFinancing[]>([]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('expose');
  const contentRef = usePdfContentRef();

  async function fetchProperty() {
    if (!id || !activeOrganization) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', activeOrganization.id)
        .single();

      if (propError) throw propError;
      setProperty(propData);

      const { data: finData } = await supabase
        .from('property_financing')
        .select('*')
        .eq('property_id', id)
        .eq('tenant_id', activeOrganization.id)
        .order('is_active', { ascending: false });

      setFinancing(finData || []);

      const { data: unitData } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', id)
        .eq('tenant_id', activeOrganization.id)
        .eq('unit_number', 'MAIN')
        .single();

      setUnit(unitData);
    } catch (err: any) {
      setError(err.message || 'Immobilie nicht gefunden');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProperty();
  }, [id, activeOrganization]);

  const getDocumentTitle = () => {
    if (!property) return 'Immobilie';
    const prefix = property.code ? `${property.code} – ` : '';
    switch (activeTab) {
      case 'expose': return `Exposé: ${prefix}${property.address}`;
      case 'features': return `Features: ${prefix}${property.address}`;
      case 'tenancy': return `Mietverhältnis: ${prefix}${property.address}`;
      default: return `${prefix}${property.address}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/portfolio">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Immobilie nicht gefunden'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="no-print">
                <Link to="/portfolio">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h2 className="text-2xl font-bold tracking-tight">
                {property.code ? `${property.code} – ` : ''}{property.address}
              </h2>
            </div>
            <div className="flex items-center gap-2 ml-10">
              <Badge variant="outline">{property.property_type}</Badge>
              <span className="text-muted-foreground">
                {property.postal_code} {property.city}
              </span>
            </div>
          </div>
          <Button variant="outline" asChild className="no-print">
            <Link to={`/portfolio/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="no-print">
            <TabsTrigger value="expose">Exposé</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="tenancy">Mietverhältnis</TabsTrigger>
          </TabsList>

          <TabsContent value="expose">
            <ExposeTab 
              property={property} 
              financing={financing} 
              unit={unit} 
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
        </Tabs>
      </div>

      <PdfExportFooter 
        contentRef={contentRef} 
        documentTitle={getDocumentTitle()} 
        moduleName="MOD-04 Immobilien – Exposé" 
      />
    </div>
  );
}
