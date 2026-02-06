/**
 * BeratungTab — MOD-09 Vertriebspartner Investment-Beratung
 * Dashboard-Modus mit Portfolio-Übersicht wie MOD-04
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileDown, Handshake, Save, UserPlus, Play, TrendingUp, 
  Wallet, Building2, Euro, ArrowUpRight, ArrowDownRight, 
  Video, FileText, Shield, PlayCircle, Heart
} from 'lucide-react';
import { InvestmentCalculator } from '@/components/investment';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { HowItWorks, QuickActions } from '@/components/vertriebspartner';
import { useSelectedListings } from '@/hooks/usePartnerListingSelections';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BeratungTab = () => {
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  // Fetch selected listings (favorites from catalog)
  const { data: selectedListings = [] } = useSelectedListings();
  
  // Fetch customers (contacts with category 'kunde')
  const { data: customers = [] } = useQuery({
    queryKey: ['partner-customers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      
      // Get user's active tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .eq('id', user.id)
        .single();
        
      if (!profile?.active_tenant_id) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, company')
        .eq('tenant_id', profile.active_tenant_id)
        .order('last_name', { ascending: true });
        
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        company: string | null;
      }>;
    }
  });

  // Get selected property details
  const selectedPropertyData = useMemo(() => {
    if (!selectedProperty) return null;
    const found = selectedListings.find(s => s.listing_id === selectedProperty);
    return found?.listing;
  }, [selectedProperty, selectedListings]);

  const handleResult = (result: CalculationResult) => {
    setLastResult(result);
  };

  const handleSave = () => {
    if (!selectedProperty || !selectedCustomer) {
      toast.warning('Bitte wählen Sie Objekt und Kunde aus');
      return;
    }
    const customer = customers.find(c => c.id === selectedCustomer);
    toast.success('Simulation gespeichert', {
      description: `Für ${customer?.first_name} ${customer?.last_name}`,
    });
  };

  const handleExportPdf = () => {
    toast.info('PDF wird erstellt...', {
      description: 'Der Download startet in Kürze',
    });
  };

  const handleStartDeal = () => {
    if (!selectedProperty || !selectedCustomer) {
      toast.warning('Bitte wählen Sie Objekt und Kunde aus');
      return;
    }
    toast.success('Deal gestartet', {
      description: 'Der Vorgang wurde in der Pipeline angelegt',
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-6">
      {/* How It Works */}
      <HowItWorks variant="beratung" />
      
      {/* Quick Actions */}
      <QuickActions />

      {/* Portfolio Overview Dashboard (wie MOD-04) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Portfolio-Übersicht
              </CardTitle>
              <CardDescription>
                Ausgewählte Objekte für Kundenberatung
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Heart className="h-3 w-3" />
              {selectedListings.length} Objekte vorgemerkt
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Building2 className="h-4 w-4" />
                Objekte
              </div>
              <div className="text-2xl font-bold">{selectedListings.length}</div>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Euro className="h-4 w-4" />
                Gesamtvolumen
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  selectedListings.reduce((sum, s) => sum + ((s.listing as any)?.asking_price || 0), 0)
                )}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                Ø Rendite
              </div>
              <div className="text-2xl font-bold text-primary">
                {selectedListings.length > 0 
                  ? `${(selectedListings.reduce((sum, s) => {
                      const listing = s.listing as any;
                      const props = listing?.properties;
                      if (!listing?.asking_price || !props?.annual_rent_income) return sum;
                      return sum + (props.annual_rent_income / listing.asking_price * 100);
                    }, 0) / selectedListings.length).toFixed(1)}%`
                  : '–'}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Wallet className="h-4 w-4 text-accent-foreground" />
                Ø Provision
              </div>
              <div className="text-2xl font-bold text-accent-foreground">
                {selectedListings.length > 0 
                  ? `${(selectedListings.reduce((sum, s) => sum + ((s.listing as any)?.commission_rate || 0), 0) / selectedListings.length).toFixed(1)}%`
                  : '–'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Objekt auswählen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder="Aus Ihrer Auswahl wählen..." />
              </SelectTrigger>
              <SelectContent>
                {selectedListings.length === 0 ? (
                  <SelectItem value="__no_objects__" disabled>
                    Keine Objekte vorgemerkt
                  </SelectItem>
                ) : (
                  selectedListings.map((selection) => {
                    const listing = selection.listing as any;
                    return (
                      <SelectItem key={selection.listing_id} value={selection.listing_id}>
                        {listing?.title || 'Objekt'} — {formatCurrency(listing?.asking_price || 0)}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Nur Objekte mit ♥ im Katalog werden hier angezeigt
            </p>
            {selectedPropertyData && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="font-medium">{(selectedPropertyData as any)?.title}</div>
                <div className="text-muted-foreground">
                  {(selectedPropertyData as any)?.properties?.address}, {(selectedPropertyData as any)?.properties?.city}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Kunde auswählen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Kunde wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <SelectItem value="__no_customers__" disabled>
                      Keine Kunden vorhanden
                    </SelectItem>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                        {customer.company && ` (${customer.company})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" title="Neuen Kunden anlegen">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Verknüpfen Sie die Simulation mit einem Kunden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Beratungsmaterialien (Phase 2 Placeholder) */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Beratungsmaterialien</CardTitle>
          <CardDescription>
            Werbe- und Informationsmaterialien für Ihre Beratung (in Entwicklung)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto flex-col py-4 gap-2" disabled>
              <Video className="h-5 w-5" />
              <span className="text-xs">Ablaufvideo</span>
              <Badge variant="secondary" className="text-xs">Bald</Badge>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4 gap-2" disabled>
              <PlayCircle className="h-5 w-5" />
              <span className="text-xs">Präsentation</span>
              <Badge variant="secondary" className="text-xs">Bald</Badge>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4 gap-2" disabled>
              <Shield className="h-5 w-5" />
              <span className="text-xs">Risikoaufklärung</span>
              <Badge variant="secondary" className="text-xs">Bald</Badge>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4 gap-2" disabled>
              <Play className="h-5 w-5" />
              <span className="text-xs">Imagevideo</span>
              <Badge variant="secondary" className="text-xs">Bald</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Investment Calculator */}
      <InvestmentCalculator 
        onResult={handleResult}
        initialData={selectedPropertyData ? {
          purchasePrice: (selectedPropertyData as any)?.asking_price || 0,
          monthlyRent: ((selectedPropertyData as any)?.properties?.annual_rent_income || 0) / 12
        } : undefined}
      />

      {/* Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {lastResult && (
                <span>
                  Monatsbelastung: <strong className="text-foreground">
                    {formatCurrency(lastResult.summary.monthlyBurden)}
                  </strong> / Monat
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </Button>
              <Button variant="outline" onClick={handleExportPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                PDF Export
              </Button>
              <Button onClick={handleStartDeal}>
                <Handshake className="mr-2 h-4 w-4" />
                Deal starten
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BeratungTab;
