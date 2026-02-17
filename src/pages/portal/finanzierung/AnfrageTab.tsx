/**
 * MOD-07: Anfrage Tab
 * Widget-Leiste for multi-request management + full capture flow + Finanzierungsauftrag.
 * Follows Manager-Module pattern: persistent widgets at top, form below, submit at bottom.
 */
import * as React from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DESIGN } from '@/config/designManifest';
import { useRef, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Save, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import FinanceObjectCard, { type FinanceObjectCardHandle, type ObjectFormData } from '@/components/finanzierung/FinanceObjectCard';
import FinanceRequestCard, { type FinanceRequestCardHandle } from '@/components/finanzierung/FinanceRequestCard';
import FinanceCalculatorCard from '@/components/finanzierung/FinanceCalculatorCard';
import FinanceOfferCard from '@/components/finanzierung/FinanceOfferCard';
import HouseholdCalculationCard from '@/components/finanzierung/HouseholdCalculationCard';
import MagicIntakeCard, { type MagicIntakeResult } from '@/components/finanzierung/MagicIntakeCard';
import type { CalcData } from '@/components/finanzierung/FinanceCalculatorCard';
import { FinanceRequestWidgets } from '@/components/finanzierung/FinanceRequestWidgets';
import { FinanzierungsauftragBlock } from '@/components/finanzierung/FinanzierungsauftragBlock';

/** Map v_public_listings property_type to ObjectFormData objectType */
function mapPropertyType(pt: string | null): string {
  if (!pt) return '';
  const map: Record<string, string> = {
    apartment: 'eigentumswohnung', house: 'einfamilienhaus',
    multi_family: 'mehrfamilienhaus', land: 'grundstueck', commercial: 'gewerbe',
  };
  return map[pt] || '';
}

export default function AnfrageTab() {
  const { activeTenantId } = useAuth();
  const objectCardRef = useRef<FinanceObjectCardHandle>(null);
  const requestCardRef = useRef<FinanceRequestCardHandle>(null);

  // Listing search
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [externalObjectData, setExternalObjectData] = useState<Partial<ObjectFormData> | undefined>();
  const [externalPurchasePrice, setExternalPurchasePrice] = useState<string | undefined>();
  const searchRef = useRef<HTMLDivElement>(null);

  // Calculator state
  const [calculatorBedarf, setCalculatorBedarf] = useState(0);
  const [calculatorPurchasePrice, setCalculatorPurchasePrice] = useState(0);
  const [calcData, setCalcData] = useState<CalcData | null>(null);
  const [eckdatenUsage, setEckdatenUsage] = useState('');
  const [eckdatenRentalIncome, setEckdatenRentalIncome] = useState(0);

  // Magic Intake
  const [magicIntakeResult, setMagicIntakeResult] = useState<MagicIntakeResult | null>(null);

  // Active draft request (latest draft for the auftrag block)
  const { data: activeDraft } = useQuery({
    queryKey: ['active-draft-request', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data } = await supabase
        .from('finance_requests')
        .select('id, status, object_address, purchase_price, loan_amount_requested')
        .eq('tenant_id', activeTenantId)
        .in('status', ['draft', 'collecting'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!activeTenantId,
  });

  // Listing data from Kaufy
  const { data: listings } = useQuery({
    queryKey: ['v_public_listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_public_listings')
        .select('public_id, title, city, postal_code, property_type, total_area_sqm, year_built, asking_price')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim() || !listings) return [];
    const q = searchQuery.toLowerCase();
    return listings.filter(l =>
      (l.public_id?.toLowerCase().includes(q)) ||
      (l.title?.toLowerCase().includes(q)) ||
      (l.city?.toLowerCase().includes(q)) ||
      (l.postal_code?.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, listings]);

  const handleListingSelect = (listing: NonNullable<typeof listings>[number]) => {
    setSearchQuery(`${listing.title ?? ''} — ${listing.city ?? ''}`);
    setShowDropdown(false);
    setExternalObjectData({
      city: listing.city ?? '', postalCode: listing.postal_code ?? '',
      objectType: mapPropertyType(listing.property_type),
      yearBuilt: listing.year_built?.toString() ?? '',
      livingArea: listing.total_area_sqm?.toString() ?? '',
    });
    setExternalPurchasePrice(listing.asking_price?.toString() ?? '');
  };

  const handleCalculate = (bedarf: number) => {
    setCalculatorBedarf(bedarf);
    setCalculatorPurchasePrice(Number(externalPurchasePrice) || 0);
  };

  const handleFloatingSave = () => {
    objectCardRef.current?.save();
    requestCardRef.current?.save();
    toast.success('Daten zwischengespeichert');
  };

  const handleMagicIntakeCreated = useCallback((result: MagicIntakeResult) => {
    setMagicIntakeResult(result);
  }, []);

  return (
    <PageShell>
      <ModulePageHeader title="Finanzierungsanfrage" description="Erfasse die Objektdaten und deinen Finanzierungswunsch" />

      {/* Widget-Leiste: All requests + CTA */}
      <FinanceRequestWidgets activeRequestId={activeDraft?.id} />

      {/* Top row: Magic Intake + Kaufy Search */}
      <div className={DESIGN.FORM_GRID.FULL}>
        <MagicIntakeCard onCaseCreated={handleMagicIntakeCreated} />

        {/* Kaufy listing search */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Objekte aus Kaufy</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">
              Durchsuchen Sie den Marktplatz nach Objekt-ID, Ort oder Straße — Stammdaten werden automatisch übernommen.
            </p>
            <div className="relative" ref={searchRef}>
              <Input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Objekt suchen (ID, Ort, Straße...)"
                className="h-7 text-xs"
              />
              {showDropdown && filteredListings.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {filteredListings.map(l => (
                    <button
                      key={l.public_id}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors border-b last:border-b-0"
                      onMouseDown={() => handleListingSelect(l)}
                    >
                      <div className="font-medium text-foreground">
                        {l.public_id && <span className="text-muted-foreground mr-1.5">{l.public_id}</span>}
                        {l.title ?? 'Ohne Titel'}
                      </div>
                      <div className="text-muted-foreground">
                        {l.postal_code ?? ''} {l.city ?? ''}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-2">
                        {l.asking_price ? <span>{Number(l.asking_price).toLocaleString('de-DE')} €</span> : null}
                        {l.total_area_sqm ? <span>{l.total_area_sqm} m²</span> : null}
                        {l.property_type ? <span className="capitalize">{l.property_type}</span> : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              className="w-full mt-2 gap-2"
              onClick={() => { if (searchQuery.trim()) setShowDropdown(true); }}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Marktplatz durchsuchen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Eckdaten + Kalkulator */}
      <div className={DESIGN.FORM_GRID.FULL}>
        <FinanceRequestCard
          ref={requestCardRef}
          storageKey="mod07-anfrage"
          externalPurchasePrice={externalPurchasePrice}
          showCalculator
          onCalculate={handleCalculate}
          hideFooter
          showObjectFields
          title="Eckdaten"
          onDataChange={({ usage, rentalIncome }) => {
            setEckdatenUsage(usage);
            setEckdatenRentalIncome(rentalIncome);
          }}
        />
        <FinanceCalculatorCard
          finanzierungsbedarf={calculatorBedarf}
          purchasePrice={calculatorPurchasePrice}
          onCalcUpdate={setCalcData}
        />
      </div>

      {/* Überschlägiges Finanzierungsangebot */}
      <FinanceOfferCard
        calcData={calcData}
        onTransferToApplication={() => toast.success('Eckdaten übernommen')}
      />

      {/* Finanzierungsobjekt */}
      <div>
        <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Finanzierungsobjekt</h2>
        <p className={DESIGN.TYPOGRAPHY.HINT + ' mt-1'}>
          Hier erfassen Sie Ihr Finanzierungsobjekt.
        </p>
      </div>

      <FinanceObjectCard ref={objectCardRef} storageKey="mod07-anfrage" externalData={externalObjectData} hideFooter />

      {/* Kapitaldienstfähigkeit */}
      <div>
        <h2 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Kapitaldienstfähigkeit</h2>
        <p className={DESIGN.TYPOGRAPHY.HINT + ' mt-1'}>
          Simulation der monatlichen Belastung nach Finanzierungsabschluss
        </p>
      </div>

      <HouseholdCalculationCard
        formData={{} as any}
        coFormData={{} as any}
        calcData={calcData}
        usage={eckdatenUsage}
        rentalIncome={eckdatenRentalIncome}
        livingArea={Number(externalObjectData?.livingArea) || 0}
        propertyAssets={[]}
      />

      {/* Finanzierungsauftrag — Einreichung */}
      {activeDraft && (
        <FinanzierungsauftragBlock
          requestId={activeDraft.id}
          objectAddress={activeDraft.object_address}
          purchasePrice={activeDraft.purchase_price ? Number(activeDraft.purchase_price) : null}
          loanAmount={activeDraft.loan_amount_requested ? Number(activeDraft.loan_amount_requested) : null}
          status={activeDraft.status}
        />
      )}

      {/* Spacer */}
      <div className="h-20" />

      {/* Floating save button */}
      <Button
        onClick={handleFloatingSave}
        variant="glass"
        className="fixed bottom-6 right-6 z-50 shadow-lg gap-2"
      >
        <Save className="h-4 w-4" /> Zwischenspeichern
      </Button>
    </PageShell>
  );
}
